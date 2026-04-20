import { createClient, type SupabaseClient } from "@supabase/supabase-js";

function createAdminClient(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

async function authenticateRequest(request: Request): Promise<{ user: { id: string } } | Response> {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) return Response.json({ error: "Unauthorized" }, { status: 401 });

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return Response.json({ error: "Server misconfiguration." }, { status: 500 });
  }

  const anonClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  const { data: { user }, error } = await anonClient.auth.getUser(token);
  if (error || !user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  return { user };
}

export async function POST(request: Request) {
  const auth = await authenticateRequest(request);
  if (auth instanceof Response) return auth;

  const body = await request.json() as { endpoint: string; keys: { p256dh: string; auth: string } };
  const { endpoint, keys } = body;
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return Response.json({ error: "Invalid subscription data." }, { status: 400 });
  }

  const { error: upsertError } = await createAdminClient()
    .from("push_subscriptions")
    .upsert({ user_id: auth.user.id, endpoint, p256dh: keys.p256dh, auth: keys.auth }, { onConflict: "endpoint" });

  if (upsertError) {
    console.error("push/subscribe: upsert failed:", upsertError);
    return Response.json({ error: "Failed to save subscription." }, { status: 500 });
  }

  return Response.json({ success: true });
}

export async function DELETE(request: Request) {
  const auth = await authenticateRequest(request);
  if (auth instanceof Response) return auth;

  const { endpoint } = await request.json() as { endpoint: string };

  await createAdminClient()
    .from("push_subscriptions")
    .delete()
    .eq("user_id", auth.user.id)
    .eq("endpoint", endpoint);

  return Response.json({ success: true });
}
