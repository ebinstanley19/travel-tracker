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
    <Card className="mx-auto w-full max-w-md rounded-2xl shadow-sm">
      <CardHeader>
        <CardTitle>{mode === "login" ? "Log in" : "Create account"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Email</Label>
          <Input
            type="email"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
          />
        </div>

        <div className="space-y-2">
          <Label>Password</Label>
          <Input
            type="password"
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            placeholder="At least 6 characters"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
          />
        </div>

        {errorMessage ? <p className="text-sm text-red-600">{errorMessage}</p> : null}
        {infoMessage ? <p className="text-sm text-muted-foreground">{infoMessage}</p> : null}

        <Button className="w-full" onClick={onSubmit} disabled={pending}>
          {pending ? "Please wait..." : mode === "login" ? "Log in" : "Create account"}
        </Button>

        <div className="text-sm text-muted-foreground">
          {mode === "login" ? "New here?" : "Already have an account?"}{" "}
          <button
            type="button"
            className="font-medium text-foreground underline underline-offset-4"
            onClick={() => onModeChange(mode === "login" ? "signup" : "login")}
          >
            {mode === "login" ? "Create account" : "Log in"}
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
