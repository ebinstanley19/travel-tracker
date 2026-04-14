import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type AuthMode = "login" | "signup";

interface AuthCardProps {
  mode: AuthMode;
  email: string;
  password: string;
  pending: boolean;
  errorMessage: string;
  infoMessage: string;
  onModeChange: (mode: AuthMode) => void;
  onEmailChange: (email: string) => void;
  onPasswordChange: (password: string) => void;
  onSubmit: () => void;
}

export function AuthCard({
  mode,
  email,
  password,
  pending,
  errorMessage,
  infoMessage,
  onModeChange,
  onEmailChange,
  onPasswordChange,
  onSubmit,
}: AuthCardProps) {
  return (
    <Card className="mx-auto w-full max-w-md overflow-hidden rounded-[2rem] border border-white/60 bg-white/80 shadow-[0_20px_80px_rgba(22,27,45,0.12)] backdrop-blur-xl">
      <CardHeader className="space-y-3 border-b border-border/60 pb-6">
        <div className="inline-flex w-fit items-center rounded-full border border-amber-200/70 bg-amber-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-800">
          Private access
        </div>
        <CardTitle className="text-3xl font-semibold tracking-[-0.03em] text-slate-950">
          {mode === "login" ? "Welcome back" : "Start your travel ledger"}
        </CardTitle>
        <p className="max-w-sm text-sm leading-6 text-slate-600">
          {mode === "login"
            ? "Step into your personal borderless dashboard and continue managing your routes."
            : "Create a secure account so every trip, border crossing, and note stays private to you."}
        </p>
      </CardHeader>
      <CardContent className="space-y-5 p-6">
        <div className="space-y-2">
          <Label className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Email</Label>
          <Input
            type="email"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            className="h-12 rounded-2xl border-slate-200/80 bg-white/80 px-4 shadow-none"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Password</Label>
          <Input
            type="password"
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            placeholder="At least 6 characters"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            className="h-12 rounded-2xl border-slate-200/80 bg-white/80 px-4 shadow-none"
          />
        </div>

        {errorMessage ? <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{errorMessage}</p> : null}
        {infoMessage ? <p className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">{infoMessage}</p> : null}

        <Button className="h-12 w-full rounded-2xl bg-slate-950 text-white hover:bg-slate-800" onClick={onSubmit} disabled={pending}>
          {pending ? "Please wait..." : mode === "login" ? "Log in" : "Create account"}
        </Button>

        <div className="text-sm text-slate-500">
          {mode === "login" ? "New here?" : "Already have an account?"}{" "}
          <button
            type="button"
            className="font-medium text-slate-950 underline underline-offset-4"
            onClick={() => onModeChange(mode === "login" ? "signup" : "login")}
          >
            {mode === "login" ? "Create account" : "Log in"}
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
