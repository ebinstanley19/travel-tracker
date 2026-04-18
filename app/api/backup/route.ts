import { createClient } from "@supabase/supabase-js";
import * as XLSX from "xlsx";
import Mailjet from "node-mailjet";
import { sortEntries, formatYear, formatMonth } from "@/app/travel-tracker/date-utils";
import type { TravelEntry } from "@/app/travel-tracker/types";

function generateExcelBuffer(entries: TravelEntry[]): Buffer {
  const rows = sortEntries(entries).map((item) => ({
    Year: formatYear(item.date || item.endDate),
    Month: formatMonth(item.date || item.endDate),
    Date: item.date,
    "To Date": item.endDate,
    From: item.from,
    To: item.to,
    Country: item.country,
    City: item.purpose,
    Purpose: item.notes,
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Travel Records");
  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return Response.json({ error: "Server misconfiguration: SUPABASE_SERVICE_ROLE_KEY is not set." }, { status: 500 });
  }

  if (!process.env.MAILJET_API_KEY || !process.env.MAILJET_SECRET_KEY) {
    return Response.json({ error: "Server misconfiguration: Mailjet keys not set." }, { status: 500 });
  }

  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  const { data: { users }, error: usersError } = await adminClient.auth.admin.listUsers();
  if (usersError || !users) {
    console.error("backup: failed to list users:", usersError);
    return Response.json({ error: "Failed to fetch users." }, { status: 500 });
  }

  const mailjet = Mailjet.apiConnect(
    process.env.MAILJET_API_KEY,
    process.env.MAILJET_SECRET_KEY,
  );

  let sent = 0;
  let skipped = 0;
  const today = new Date().toISOString().split("T")[0];

  for (const user of users) {
    if (!user.email) { skipped++; continue; }

    const { data: records, error: recordsError } = await adminClient
      .from("travel_records")
      .select("*")
      .eq("user_id", user.id)
      .order("date", { ascending: false });

    if (recordsError || !records || records.length === 0) { skipped++; continue; }

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

    const excelBuffer = generateExcelBuffer(entries);
    const base64 = excelBuffer.toString("base64");

    try {
      await mailjet.post("send", { version: "v3.1" }).request({
        Messages: [
          {
            From: {
              Email: "routebooktrip@gmail.com",
              Name: "Route Book",
            },
            To: [{ Email: user.email }],
            Subject: `Your Route Book backup — ${today}`,
            TextPart: `Hi,\n\nAttached is your weekly Route Book backup as of ${today}.\n\nIt contains all your travel records. Keep it somewhere safe — you can reimport it into the app at any time using Import Excel.\n\n— Route Book`,
            Attachments: [
              {
                ContentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                Filename: `route-book-backup-${today}.xlsx`,
                Base64Content: base64,
              },
            ],
          },
        ],
      });
      sent++;
    } catch (err) {
      console.error(`backup: failed to send email to ${user.email}:`, err);
      skipped++;
    }
  }

  console.log(`backup: sent=${sent} skipped=${skipped}`);
  return Response.json({ success: true, sent, skipped });
}
