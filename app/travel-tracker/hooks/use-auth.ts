import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import type { AuthMode } from "@/app/travel-tracker/auth-card";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [authFullName, setAuthFullName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authInfo, setAuthInfo] = useState("");
  const [authPending, setAuthPending] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function bootstrapAuth() {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (!isMounted) return;

        if (error) {
          console.error("Auth bootstrap failed:", error.message);
          setUser(null);
          return;
        }

        setUser(session?.user ?? null);
      } catch (err) {
        if (isMounted) {
          console.error("Unexpected auth bootstrap error:", err);
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setAuthLoading(false);
        }
      }
    }

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    void bootstrapAuth();

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  async function handleAuthSubmit(): Promise<void> {
    setAuthError("");
    setAuthInfo("");

    if (!authEmail || !authPassword) {
      setAuthError("Email and password are required.");
      return;
    }

    if (authMode === "signup" && !authFullName.trim()) {
      setAuthError("Full name is required for account creation.");
      return;
    }

    setAuthPending(true);

    try {
      if (authMode === "signup") {
        const { error } = await supabase.auth.signUp({
          email: authEmail,
          password: authPassword,
          options: { data: { full_name: authFullName.trim() } },
        });
        if (error) {
          setAuthError(error.message);
        } else {
          setAuthInfo("Account created. Check your email to confirm before logging in.");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: authEmail,
          password: authPassword,
        });
        if (error) {
          setAuthError(error.message);
        }
      }
    } finally {
      setAuthPending(false);
    }
  }

  async function handleForgotPassword(): Promise<void> {
    setAuthError("");
    setAuthInfo("");

    if (!authEmail) {
      setAuthError("Enter your email first, then click Forgot password.");
      return;
    }

    setAuthPending(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(authEmail, {
        redirectTo: typeof window !== "undefined"
          ? `${window.location.origin}/auth/reset-password`
          : undefined,
      });
      if (error) {
        setAuthError(error.message);
      } else {
        setAuthInfo("Password reset email sent. Check your inbox and spam folder.");
      }
    } finally {
      setAuthPending(false);
    }
  }

  async function handleSignOut(): Promise<void> {
    setAuthError("");
    setAuthInfo("");
    setAuthPending(true);

    // Optimistic: exit auth state immediately even if remote revoke fails.
    setUser(null);

    try {
      const { error } = await supabase.auth.signOut({ scope: "local" });
      if (error) {
        setAuthError(`Signed out locally, but Supabase returned: ${error.message}`);
      }
    } finally {
      setAuthPending(false);
    }
  }

  return {
    user,
    authLoading,
    authMode,
    authFullName,
    authEmail,
    authPassword,
    authError,
    authInfo,
    authPending,
    setAuthMode,
    setAuthFullName,
    setAuthEmail,
    setAuthPassword,
    handleAuthSubmit,
    handleForgotPassword,
    handleSignOut,
  };
}
