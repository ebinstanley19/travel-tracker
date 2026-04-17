import { createClient } from "@supabase/supabase-js";

export async function DELETE(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.slice(7);

    // Verify the caller's identity using their own JWT.
    const userClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
    const { data: { user }, error: authError } = await userClient.auth.getUser(token);

    if (authError || !user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return Response.json({ error: "Server misconfiguration: SUPABASE_SERVICE_ROLE_KEY is not set." }, { status: 500 });
    }

    // Admin client — needs SUPABASE_SERVICE_ROLE_KEY in environment variables.
    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    // Delete all travel records for this user first.
    const { error: dataError } = await adminClient
      .from("travel_records")
      .delete()
      .eq("user_id", user.id);

    if (dataError) {
      console.error("delete-account: travel_records delete failed:", dataError);
      return Response.json({ error: "Failed to delete account. Please try again or contact support." }, { status: 500 });
    }

    // Delete the auth account.
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id);

    if (deleteError) {
      console.error("delete-account: auth.admin.deleteUser failed:", deleteError);
      return Response.json({ error: "Failed to delete account. Please try again or contact support." }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (err) {
    console.error("delete-account: unexpected error:", err);
    return Response.json({ error: "An unexpected error occurred. Please try again or contact support." }, { status: 500 });
  }
}
