import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type AuthMode = "login" | "signup";

interface AuthCardProps {
  mode: AuthMode;
  fullName: string;
  email: string;
  password: string;
  pending: boolean;
  errorMessage: string;
  infoMessage: string;
  onModeChange: (mode: AuthMode) => void;
  onFullNameChange: (fullName: string) => void;
  onEmailChange: (email: string) => void;
  onPasswordChange: (password: string) => void;
  onForgotPassword: () => void;
  onSubmit: () => void;
  onGoogleSignIn: () => void;
}

export function AuthCard({
  mode,
  fullName,
  email,
  password,
  pending,
  errorMessage,
  infoMessage,
  onModeChange,
  onFullNameChange,
  onEmailChange,
  onPasswordChange,
  onForgotPassword,
  onSubmit,
  onGoogleSignIn,
}: AuthCardProps) {
  return (
    <Card className="mx-auto w-full max-w-md overflow-hidden rounded-[2rem] border border-white/60 bg-white/80 shadow-[0_20px_80px_rgba(22,27,45,0.12)] backdrop-blur-xl">
      <div className="h-20 bg-[radial-gradient(circle_at_20%_30%,rgba(245,178,76,0.45),transparent_40%),radial-gradient(circle_at_80%_40%,rgba(77,143,255,0.35),transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.9),rgba(255,255,255,0.55))]" />
      <CardHeader className="space-y-3 border-b border-border/60 pb-6">
        <div className="inline-flex w-fit items-center rounded-full border border-amber-200/70 bg-amber-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-800">
          Private access
        </div>
        <CardTitle className="text-3xl font-semibold tracking-[-0.03em] text-slate-950">
          {mode === "login" ? "Sign in" : "Create account"}
        </CardTitle>
        <p className="max-w-sm text-sm leading-6 text-slate-600">
          {mode === "login"
            ? "Use your email and password to access your private timeline."
            : "Set up your secure account to keep your trips, border crossings, and notes private to you."}
        </p>
      </CardHeader>
      <CardContent className="space-y-5 p-6">
        {mode === "signup" ? (
          <div className="space-y-2">
            <Label className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Full name</Label>
            <Input
              type="text"
              value={fullName}
              onChange={(e) => onFullNameChange(e.target.value)}
              placeholder="e.g. Alex Tan"
              autoComplete="name"
              className="h-12 rounded-2xl border-slate-200/80 bg-white/80 px-4 shadow-none"
            />
          </div>
        ) : null}

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
            placeholder="At least 8 characters"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            className="h-12 rounded-2xl border-slate-200/80 bg-white/80 px-4 shadow-none"
          />
          {mode === "login" ? (
            <button
              type="button"
              className="text-xs font-medium text-slate-600 underline underline-offset-4"
              onClick={onForgotPassword}
              disabled={pending}
            >
              Forgot password?
            </button>
          ) : null}
        </div>

        {errorMessage ? <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{errorMessage}</p> : null}
        {infoMessage ? <p className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">{infoMessage}</p> : null}

        <Button className="h-12 w-full rounded-2xl bg-slate-950 text-white hover:bg-slate-800" onClick={onSubmit} disabled={pending}>
          {pending ? "Please wait..." : mode === "login" ? "Log in" : "Create account"}
        </Button>

        <div className="relative flex items-center gap-3">
          <div className="h-px flex-1 bg-slate-200" />
          <span className="text-xs text-slate-400">or</span>
          <div className="h-px flex-1 bg-slate-200" />
        </div>

        <button
          type="button"
          onClick={onGoogleSignIn}
          disabled={pending}
          className="flex h-12 w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
        >
          <svg width="18" height="18" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
            <path fill="#EA4335" d="M24 9.5c3.14 0 5.95 1.08 8.17 2.86l6.08-6.08C34.46 3.09 29.5 1 24 1 14.82 1 7.07 6.48 3.64 14.22l7.08 5.5C12.43 13.61 17.73 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.14 24.5c0-1.64-.15-3.22-.42-4.75H24v9h12.44c-.54 2.93-2.18 5.41-4.64 7.08l7.08 5.5C42.9 37.3 46.14 31.36 46.14 24.5z"/>
            <path fill="#FBBC05" d="M10.72 28.28A14.6 14.6 0 0 1 9.5 24c0-1.49.26-2.93.72-4.28l-7.08-5.5A23.94 23.94 0 0 0 0 24c0 3.86.93 7.5 2.56 10.72l7.08-5.5-.92.06z"/>
            <path fill="#34A853" d="M24 47c5.5 0 10.12-1.82 13.5-4.94l-7.08-5.5C28.6 38.1 26.42 39 24 39c-6.27 0-11.57-4.11-13.28-9.72l-7.08 5.5C7.07 42.52 14.82 47 24 47z"/>
          </svg>
          Continue with Google
        </button>

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
