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

## 2. Local Development

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
```

`.env.local` is in `.gitignore` and will never be committed.

### Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## 3. Vercel Deployment

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

Click **Save** for each.

### Redeploy

Go to **Deployments** → find the latest deployment → **Redeploy**. Or push a new commit to trigger a fresh build.

---

## 4. Custom Domain

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

## 5. Ongoing Maintenance

### Rotating the service role key

If you suspect the service role key has been exposed:
1. Go to Supabase → **Settings → API → Regenerate service_role key**
2. Update the `SUPABASE_SERVICE_ROLE_KEY` in Vercel environment variables
3. Redeploy

### Updating dependencies

```bash
npm outdated          # see what's behind
npm update            # update within semver range
npm run build         # verify the build passes before deploying
```

### Checking for security vulnerabilities

```bash
npm audit
npm audit fix         # auto-fix where safe
```
