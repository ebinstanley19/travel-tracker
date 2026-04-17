"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ChevronDown, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import { COUNTRY_OPTIONS } from "@/app/travel-tracker/countries";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [homeCountry, setHomeCountry] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function initUser() {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      if (!mounted) return;

      setUser(currentUser ?? null);
      setFullName((currentUser?.user_metadata?.full_name as string | undefined) ?? "");
      setLoading(false);
    }

    void initUser();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const storedHomeCountry = localStorage.getItem("routebook-home-country");
    if (storedHomeCountry) {
      setHomeCountry(storedHomeCountry);
    }
  }, []);

  const userEmail = useMemo(() => user?.email ?? "", [user]);

  async function saveProfile(): Promise<void> {
    setErrorMessage("");
    setInfoMessage("");

    if (!user) return;

    setSavingProfile(true);
    const { error } = await supabase.auth.updateUser({
      data: {
        full_name: fullName.trim(),
      },
    });

    if (error) {
      setErrorMessage(error.message);
    } else {
      if (homeCountry.trim()) {
        localStorage.setItem("routebook-home-country", homeCountry.trim());
      } else {
        localStorage.removeItem("routebook-home-country");
      }
      setInfoMessage("Profile updated successfully.");
    }

    setSavingProfile(false);
  }

  async function deleteAccount(): Promise<void> {
    setErrorMessage("");
    if (!user) return;

    setDeleting(true);

    // Re-authenticate to prove the person at the keyboard owns the account.
    const { error: reAuthError } = await supabase.auth.signInWithPassword({
      email: userEmail,
      password: deletePassword,
    });

    if (reAuthError) {
      setErrorMessage("Incorrect password. Please try again.");
      setDeleting(false);
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setErrorMessage("Session expired. Please sign in again.");
      setDeleting(false);
      return;
    }

    const response = await fetch("/api/delete-account", {
      method: "DELETE",
      headers: { Authorization: `Bearer ${session.access_token}` },
    });

    let result: { error?: string } = {};
    try {
      result = (await response.json()) as { error?: string };
    } catch {
      // Response had no JSON body (e.g. unexpected server crash).
    }

    if (!response.ok) {
      setErrorMessage(result.error ?? "Failed to delete account.");
      setDeleting(false);
      return;
    }

    localStorage.removeItem("routebook-home-country");
    localStorage.removeItem("routebook-theme");
    await supabase.auth.signOut({ scope: "local" });
    router.push("/");
  }

  async function updatePassword(): Promise<void> {
    setErrorMessage("");
    setInfoMessage("");

    if (newPassword.length < 8) {
      setErrorMessage("New password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("New password and confirm password do not match.");
      return;
    }

    setUpdatingPassword(true);

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
      current_password: currentPassword,
    });

    if (error) {
      setErrorMessage(error.message);
    } else {
      setInfoMessage("Password updated successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }

    setUpdatingPassword(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 md:p-8">
        <div className="mx-auto max-w-3xl">
          <Card className="rounded-2xl shadow-sm">
            <CardContent className="p-6 text-sm text-muted-foreground">Loading profile...</CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 md:p-8">
        <div className="mx-auto max-w-3xl space-y-4">
          <Card className="rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle>Not signed in</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Please sign in first to manage your profile.</p>
              <Button asChild className="mt-4">
                <Link href="/">Go to sign in</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center justify-between rounded-2xl bg-white p-5 shadow-sm">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Profile settings</h1>
            <p className="mt-1 text-sm text-muted-foreground">Manage account details and password settings.</p>
          </div>
          <Button asChild variant="outline">
            <Link href="/"><ArrowLeft className="mr-2 h-4 w-4" />Back to dashboard</Link>
          </Button>
        </div>

        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle>Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={userEmail} disabled />
            </div>
            <div className="space-y-2">
              <Label>Full name</Label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your full name" />
            </div>
            <div className="space-y-2">
              <Label>Home country</Label>
              <Select value={homeCountry || "none"} onValueChange={(value) => setHomeCountry(value === "none" ? "" : value)}>
                <SelectTrigger className="h-10 w-full">
                  <SelectValue placeholder="Select home country" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  <SelectItem value="none">None</SelectItem>
                  {COUNTRY_OPTIONS.map((country) => (
                    <SelectItem key={country} value={country}>{country}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={saveProfile} disabled={savingProfile}>
              <Save className="mr-2 h-4 w-4" />
              {savingProfile ? "Saving..." : "Save profile"}
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm">
          <CardHeader
            className="cursor-pointer select-none"
            onClick={() => {
              if (showPasswordForm) {
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
              }
              setShowPasswordForm((prev) => !prev);
            }}
          >
            <CardTitle className="flex items-center justify-between">
              Reset Password
              <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${showPasswordForm ? "rotate-180" : ""}`} />
            </CardTitle>
          </CardHeader>
          {showPasswordForm && (
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Current password</Label>
                <Input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Your current password"
                  autoComplete="current-password"
                />
              </div>
              <div className="space-y-2">
                <Label>New password</Label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                />
              </div>
              <div className="space-y-2">
                <Label>Confirm new password</Label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  autoComplete="new-password"
                />
              </div>
              <div className="flex flex-wrap gap-3">
                <Button onClick={updatePassword} disabled={updatingPassword}>
                  {updatingPassword ? "Updating..." : "Update password"}
                </Button>
              </div>
            </CardContent>
          )}
        </Card>

        <Card className="rounded-2xl border-red-200 shadow-sm">
          <CardHeader
            className="cursor-pointer select-none"
            onClick={() => {
              if (showDeleteAccount) {
                setShowDeleteConfirm(false);
                setDeletePassword("");
              }
              setShowDeleteAccount((prev) => !prev);
            }}
          >
            <CardTitle className="flex items-center justify-between text-red-600">
              Delete Account
              <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${showDeleteAccount ? "rotate-180" : ""}`} />
            </CardTitle>
          </CardHeader>
          {showDeleteAccount && (
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-600">
                Permanently delete your account and all travel records. This cannot be undone.
              </p>
              {!showDeleteConfirm ? (
                <Button variant="destructive" onClick={() => setShowDeleteConfirm(true)}>
                  <Trash2 className="mr-2 h-4 w-4" /> Delete account
                </Button>
              ) : (
                <div className="space-y-3 rounded-xl border border-red-200 bg-red-50 p-4">
                  <p className="text-sm text-red-700">
                    Enter your password to confirm permanent deletion.
                  </p>
                  <Input
                    type="password"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    placeholder="Your current password"
                    autoComplete="current-password"
                    className="border-red-300 bg-white"
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="destructive"
                      disabled={!deletePassword || deleting}
                      onClick={deleteAccount}
                    >
                      {deleting ? "Deleting..." : "Permanently delete"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => { setShowDeleteConfirm(false); setDeletePassword(""); }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          )}
        </Card>

        {errorMessage ? <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{errorMessage}</p> : null}
        {infoMessage ? <p className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">{infoMessage}</p> : null}
      </div>
    </div>
  );
}
