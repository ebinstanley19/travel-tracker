import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";
import { resolveDestination } from "@/app/travel-tracker/date-utils";
import type { TravelEntry } from "@/app/travel-tracker/types";

interface PushSubscription {
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

function mapRecord(r: Record<string, unknown>): TravelEntry {
  return {
    id: r.id as string,
    date: (r.date as string | null) ?? "",
    endDate: (r.end_date as string | null) ?? "",
    from: (r.from as string | null) ?? "",
    to: (r.to as string | null) ?? "",
    country: (r.country as string | null) ?? "",
    purpose: (r.purpose as string | null) ?? "",
    notes: (r.notes as string | null) ?? "",
  };
}

function buildNotifications(entries: TravelEntry[], todayStr: string): { title: string; body: string; tag: string }[] {
  const today = new Date(todayStr);
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
  const sevenDays = new Date(today); sevenDays.setDate(today.getDate() + 7);
  const tomorrowStr = tomorrow.toISOString().split("T")[0];
  const sevenDaysStr = sevenDays.toISOString().split("T")[0];
  const todayMonth = today.getMonth();
  const todayDay = today.getDate();
  const currentYear = today.getFullYear();

  const notifications: { title: string; body: string; tag: string }[] = [];

  for (const entry of entries) {
    const dest = resolveDestination(entry);

    if (entry.date === todayStr) {
      notifications.push({ title: "Route Book", body: `Your trip to ${dest} starts today ✈️`, tag: `start-${entry.id}` });
    } else if (entry.date === tomorrowStr) {
      notifications.push({ title: "Route Book", body: `Trip to ${dest} starts tomorrow 🗓️`, tag: `tomorrow-${entry.id}` });
    } else if (entry.date === sevenDaysStr) {
      notifications.push({ title: "Route Book", body: `Trip to ${dest} in 7 days 📅`, tag: `week-${entry.id}` });
    }

    if (entry.endDate && entry.endDate === todayStr && entry.endDate !== entry.date) {
      notifications.push({ title: "Route Book", body: `Last day in ${dest} 🏁`, tag: `end-${entry.id}` });
    }

    if (entry.date && entry.date <= todayStr) {
      const d = new Date(entry.date);
      if (d.getMonth() === todayMonth && d.getDate() === todayDay && d.getFullYear() !== currentYear) {
        const yearsAgo = currentYear - d.getFullYear();
        notifications.push({ title: "Route Book", body: `${yearsAgo} year${yearsAgo !== 1 ? "s" : ""} ago today: ${dest} 📸`, tag: `anniversary-${entry.id}-${currentYear}` });
      }
    }
  }

  return notifications;
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return Response.json({ error: "Server misconfiguration: SUPABASE_SERVICE_ROLE_KEY is not set." }, { status: 500 });
  }

  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY || !process.env.VAPID_SUBJECT) {
    const missing = ["VAPID_PUBLIC_KEY", "VAPID_PRIVATE_KEY", "VAPID_SUBJECT"].filter((k) => !process.env[k]);
    return Response.json({ error: "Server misconfiguration: VAPID keys not set.", missing }, { status: 500 });
  }

  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY,
  );

  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  const { data: subscriptions, error: subsError } = await adminClient
    .from("push_subscriptions")
    .select("user_id, endpoint, p256dh, auth");

  if (subsError || !subscriptions || subscriptions.length === 0) {
    return Response.json({ success: true, sent: 0, skipped: 0 });
  }

  const subs = subscriptions as PushSubscription[];
  const uniqueUserIds = [...new Set(subs.map((s) => s.user_id))];

  const { data: allRecords } = await adminClient
    .from("travel_records")
    .select("*")
    .in("user_id", uniqueUserIds);

  const recordsByUser = new Map<string, TravelEntry[]>();
  for (const r of allRecords ?? []) {
    const userId = r.user_id as string;
    if (!recordsByUser.has(userId)) recordsByUser.set(userId, []);
    recordsByUser.get(userId)!.push(mapRecord(r as Record<string, unknown>));
  }

  const todayStr = new Date().toISOString().split("T")[0];
  let sent = 0;
  let skipped = 0;

  const sends: Promise<void>[] = [];

  for (const userId of uniqueUserIds) {
    const entries = recordsByUser.get(userId);
    if (!entries || entries.length === 0) { skipped++; continue; }

    const notifications = buildNotifications(entries, todayStr);
    if (notifications.length === 0) { skipped++; continue; }

    const userSubs = subs.filter((s) => s.user_id === userId);

    for (const sub of userSubs) {
      for (const notif of notifications) {
        sends.push(
          webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            JSON.stringify({ title: notif.title, body: notif.body, tag: notif.tag, icon: "/icon-192.png" }),
          ).then(() => { sent++; }).catch(async (err: unknown) => {
            const status = (err as { statusCode?: number }).statusCode;
            if (status === 404 || status === 410) {
              await adminClient.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
            } else {
              console.error(`push/cron: failed for user ${userId}:`, err);
            }
            skipped++;
          })
        );
      }
    }
  }

  await Promise.all(sends);

  console.log(`push/cron: sent=${sent} skipped=${skipped}`);
  return Response.json({ success: true, sent, skipped });
}
