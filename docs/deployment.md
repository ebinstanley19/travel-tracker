# Deployment Guide

This guide covers setting up Route Book from scratch — Supabase, local development, and Vercel deployment.

---

## Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) account
- A [Vercel](https://vercel.com) account (for hosting)

---

## 1. Supabase Setup

### Create a project

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. Choose a region close to your users.
3. Save the database password somewhere safe.

### Create the database table

In the Supabase Dashboard, go to **SQL Editor** and run:

```sql
CREATE TABLE travel_records (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL,
  end_date date,
  "from" text NOT NULL DEFAULT '',
  "to" text NOT NULL DEFAULT '',
  country text DEFAULT '',
  purpose text DEFAULT '',
  notes text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
```

### Enable Row-Level Security

```sql
ALTER TABLE travel_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_records" ON travel_records
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "insert_own_records" ON travel_records
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "update_own_records" ON travel_records
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "delete_own_records" ON travel_records
  FOR DELETE USING (auth.uid() = user_id);
```

### Configure Auth

In Supabase Dashboard → **Authentication → URL Configuration**:

- **Site URL** — set to your production URL (e.g., `https://yourdomain.com`)
- **Redirect URLs** — add:
  - `https://yourdomain.com/auth/reset-password`
  - `http://localhost:3000/auth/reset-password` (for local development)

### Get your API keys

Go to **Settings → API**:

- Copy the **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
- Copy the **anon / public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Copy the **service_role (secret) key** → `SUPABASE_SERVICE_ROLE_KEY`

---

## 2. Mailjet Setup (monthly backup emails)

1. Sign up at [mailjet.com](https://mailjet.com) — free tier is sufficient
2. Verify the email address you want to send backups from
3. Go to **Account → API Keys** and copy your **API Key** and **Secret Key**
4. Add them as `MAILJET_API_KEY` and `MAILJET_SECRET_KEY` in your environment variables
5. Generate a random string for `CRON_SECRET` — this secures the backup endpoint so only Vercel can trigger it

The backup runs automatically on the 1st of every month at 8am UTC. Each user receives their travel records as an Excel attachment. To trigger it manually:

```bash
curl -H "Authorization: Bearer your_cron_secret" https://your-vercel-url.vercel.app/api/backup
```

---

## 3. Web Push Notifications (optional)

Push notifications let users receive daily trip reminders on iOS/Android when the app is added to their home screen.

### Create the push_subscriptions table

In Supabase SQL Editor:

```sql
CREATE TABLE push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint text NOT NULL UNIQUE,
  p256dh text NOT NULL,
  auth text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Only the service role (used by the cron) can read all subscriptions.
-- Users can only manage their own.
CREATE POLICY "manage_own_subscriptions" ON push_subscriptions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
```

### Generate VAPID keys

Install the `web-push` CLI once globally, then generate a key pair:

```bash
npx web-push generate-vapid-keys
```

This outputs a public key and a private key. Store them as environment variables (see below).

For `VAPID_SUBJECT`, use `mailto:you@yourdomain.com` — this is sent to push services as a contact address.

### How it works

- **Subscribe**: when a user taps "Enable push alerts" in Settings, the browser registers the service worker (`/sw.js`) and saves the push subscription to the `push_subscriptions` table via `/api/push/subscribe`.
- **Daily cron**: Vercel runs `/api/push/cron` at 7 am UTC every day. For each subscribed user it fetches their travel records and sends push notifications for: trips starting today / tomorrow / in 7 days, last day of a trip, and travel anniversaries (same day in a prior year).
- **Unsubscribe**: tapping "Disable push alerts" calls DELETE on `/api/push/subscribe` and unregisters the device.

---

## 4. Local Development

### Clone and install

```bash
git clone <your-repo-url>
cd travel-tracker
npm install
```

### Create `.env.local`

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
MAILJET_API_KEY=your_mailjet_api_key
MAILJET_SECRET_KEY=your_mailjet_secret_key
CRON_SECRET=any_long_random_string_you_make_up
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
VAPID_SUBJECT=mailto:you@yourdomain.com
```

`.env.local` is in `.gitignore` and will never be committed.

### Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## 5. Vercel Deployment

### Connect the repo

1. Go to [vercel.com](https://vercel.com) → **Add New Project**
2. Import your Git repository
3. Framework preset: **Next.js** (auto-detected)
4. Click **Deploy** — the first deploy will fail because environment variables aren't set yet, that's fine

### Add environment variables

In your Vercel project → **Settings → Environment Variables**, add:

| Name | Value | Environments |
|------|-------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | your Supabase project URL | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | your anon key | Production, Preview, Development |
| `SUPABASE_SERVICE_ROLE_KEY` | your service role key | Production, Preview, Development |
| `MAILJET_API_KEY` | Mailjet API key | Production, Preview, Development |
| `MAILJET_SECRET_KEY` | Mailjet secret key | Production, Preview, Development |
| `CRON_SECRET` | random string to secure the backup endpoint | Production, Preview, Development |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | VAPID public key (from `npx web-push generate-vapid-keys`) | Production, Preview, Development |
| `VAPID_PRIVATE_KEY` | VAPID private key | Production, Preview, Development |
| `VAPID_SUBJECT` | `mailto:you@yourdomain.com` | Production, Preview, Development |

Click **Save** for each.

### Redeploy

Go to **Deployments** → find the latest deployment → **Redeploy**. Or push a new commit to trigger a fresh build.

---

## 6. Custom Domain

### Add the domain in Vercel

1. Go to your project → **Settings → Domains**
2. Enter your domain (e.g., `routebook.app`) and click **Add**
3. Vercel will show you the DNS records required

### Configure DNS at your registrar (e.g., Namecheap)

Go to your domain registrar → DNS settings → add the records Vercel shows you. Typically:

| Type | Host | Value |
|------|------|-------|
| `A` | `@` | Vercel IP |
| `CNAME` | `www` | `cname.vercel-dns.com` |

If Vercel shows a verification error ("domain linked to another account"), add a `TXT` record:

| Type | Host | Value |
|------|------|-------|
| `TXT` | `_vercel` | the verification string Vercel gives you |

DNS changes can take a few minutes to propagate. Once Vercel confirms the domain, you can delete the TXT record.

### Update Supabase redirect URLs

After pointing your custom domain, go back to Supabase → **Authentication → URL Configuration** and:

- Update **Site URL** to your custom domain
- Add `https://yourcustomdomain.com/auth/reset-password` to **Redirect URLs**

---

## 7. Ongoing Maintenance

### Rotating the service role key

If you suspect the service role key has been exposed:
1. Go to Supabase → **Settings → API → Regenerate service_role key**
2. Update the `SUPABASE_SERVICE_ROLE_KEY` in Vercel environment variables
3. Redeploy

### Updating dependencies

```bash
npm outdated          # see what's behind
npm update            # update within semver range
npm run build         # verify the build passes before deploying it
```

### Checking for security vulnerabilities

```bash
npm audit
npm audit fix         # auto-fix where safe
```
