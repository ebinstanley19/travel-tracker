import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";
import { getCountryFromLocation } from "@/app/travel-tracker/date-utils";
import type { TravelEntry } from "@/app/travel-tracker/types";

interface PushSubscription {
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
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
    const dest = getCountryFromLocation(entry.to) || entry.country || entry.to || "Unknown";

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

  if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY || !process.env.VAPID_SUBJECT) {
    return Response.json({ error: "Server misconfiguration: VAPID keys not set." }, { status: 500 });
  }

  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
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

  const todayStr = new Date().toISOString().split("T")[0];
  let sent = 0;
  let skipped = 0;

  const uniqueUserIds = [...new Set((subscriptions as PushSubscription[]).map((s) => s.user_id))];

  for (const userId of uniqueUserIds) {
    const { data: records } = await adminClient
      .from("travel_records")
      .select("*")
      .eq("user_id", userId);

    if (!records || records.length === 0) { skipped++; continue; }

    const entries: TravelEntry[] = records.map((r) => ({
      id: r.id as string,
      date: (r.date as string | null) ?? "",
      endDate: (r.end_date as string | null) ?? "",
      from: (r.from as string | null) ?? "",
      to: (r.to as string | null) ?? "",
      country: (r.country as string | null) ?? "",
      purpose: (r.purpose as string | null) ?? "",
      notes: (r.notes as string | null) ?? "",
    }));

    const notifications = buildNotifications(entries, todayStr);
    if (notifications.length === 0) { skipped++; continue; }

    const userSubs = (subscriptions as PushSubscription[]).filter((s) => s.user_id === userId);

    for (const sub of userSubs) {
      for (const notif of notifications) {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            JSON.stringify({ title: notif.title, body: notif.body, tag: notif.tag, icon: "/icon-192.png" }),
          );
          sent++;
        } catch (err: unknown) {
          const status = (err as { statusCode?: number }).statusCode;
          if (status === 404 || status === 410) {
            // Subscription expired — remove it
            await adminClient.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
          } else {
            console.error(`push/cron: failed for user ${userId}:`, err);
          }
          skipped++;
        }
      }
    }
  }

  console.log(`push/cron: sent=${sent} skipped=${skipped}`);
  return Response.json({ success: true, sent, skipped });
}
