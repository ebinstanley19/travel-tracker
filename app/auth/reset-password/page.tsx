"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";

type PageState = "waiting" | "ready" | "success" | "invalid";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [pageState, setPageState] = useState<PageState>("waiting");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setPageState("ready");
      }
    });

    // If there's already an active recovery session (e.g. page was refreshed),
    // check for it immediately.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setPageState((prev) => (prev === "waiting" ? "ready" : prev));
      } else {
        // Give the hash a moment to be parsed by the Supabase client.
        const timeout = setTimeout(() => {
          setPageState((prev) => (prev === "waiting" ? "invalid" : prev));
        }, 3000);
        return () => clearTimeout(timeout);
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setErrorMessage("");

    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setPending(true);

    const { error } = await supabase.auth.updateUser({ password });

    setPending(false);

    if (error) {
      setErrorMessage(error.message);
    } else {
      setPageState("success");
      setTimeout(() => router.push("/"), 2000);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="mx-auto max-w-md space-y-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground pt-4">
          <KeyRound className="h-4 w-4" /> Route Book
        </div>

        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle>Reset your password</CardTitle>
          </CardHeader>
          <CardContent>
            {pageState === "waiting" && (
              <p className="text-sm text-muted-foreground">Verifying your reset link…</p>
            )}

            {pageState === "invalid" && (
              <div className="space-y-4">
                <p className="text-sm text-red-600">
                  This reset link is invalid or has expired. Please request a new one.
                </p>
                <Button onClick={() => router.push("/")}>Back to sign in</Button>
              </div>
            )}

            {pageState === "ready" && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>New password</Label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    autoComplete="new-password"
                    autoFocus
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Confirm new password</Label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat your new password"
                    autoComplete="new-password"
                    className="h-11"
                  />
                </div>
                {errorMessage ? (
                  <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {errorMessage}
                  </p>
                ) : null}
                <Button type="submit" className="w-full" disabled={pending}>
                  {pending ? "Updating…" : "Set new password"}
                </Button>
              </form>
            )}

            {pageState === "success" && (
              <p className="text-sm text-slate-700">
                Password updated. Redirecting you to the app…
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
