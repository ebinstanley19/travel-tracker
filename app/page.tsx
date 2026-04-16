"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Download, LogOut, Plane, Plus, Settings, Upload, UserCircle2 } from "lucide-react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AuthCard, type AuthMode } from "@/app/travel-tracker/auth-card";
import { EntryDialog } from "@/app/travel-tracker/entry-dialog";
import { normalizeCountryName } from "@/app/travel-tracker/countries";
import { FiltersCard } from "@/app/travel-tracker/filters-card";
import { StatsCards } from "@/app/travel-tracker/stats-cards";
import { TableView } from "@/app/travel-tracker/table-view";
import { TimelineView } from "@/app/travel-tracker/timeline-view";
import type { TravelEntry, TravelForm, YearMonthGroup } from "@/app/travel-tracker/types";
import { exportToExcel, formatMonth, formatYear, monthOrder, parseWorkbook, sortEntries } from "@/app/travel-tracker/utils";
import { supabase } from "@/lib/supabase";

const sampleData: TravelEntry[] = [];
const LOCATION_SEPARATOR = " | ";

const emptyForm: TravelForm = {
  date: "",
  endDate: "",
  from: "",
  fromCountry: "",
  to: "",
  toCountry: "",
  purpose: "",
  notes: "",
};

interface TravelRecordRow {
  id: string;
  date?: string | null;
  end_date?: string | null;
  from?: string | null;
  to?: string | null;
  country?: string | null;
  purpose?: string | null;
  notes?: string | null;
}

function normalizeStoredLocation(value: string): string {
  if (!value) return "";

  const parts = value.split(LOCATION_SEPARATOR);
  if (parts.length < 2) {
    return normalizeCountryName(value);
  }

  const place = parts[0]?.trim() ?? "";
  const country = normalizeCountryName(parts.slice(1).join(LOCATION_SEPARATOR).trim());
  return country ? `${place}${LOCATION_SEPARATOR}${country}` : place;
}

function normalizeRecord(item: TravelRecordRow): TravelEntry {
  return {
    id: item.id,
    date: item.date ?? "",
    endDate: item.end_date ?? "",
    from: normalizeStoredLocation(item.from ?? ""),
    to: normalizeStoredLocation(item.to ?? ""),
    country: normalizeCountryName(item.country ?? ""),
    purpose: item.purpose ?? "",
    notes: item.notes ?? "",
  };
}

function isMissingEndDateColumn(errorMessage: string): boolean {
  return /end_date/i.test(errorMessage);
}

function normalizeDateRange(start: string, end: string): { startDate: string; endDate: string } {
  const startDate = start || end;
  const endDate = end || start;

  if (!startDate || !endDate) {
    return { startDate, endDate };
  }

  const startTime = new Date(startDate).getTime();
  const endTime = new Date(endDate).getTime();

  if (Number.isNaN(startTime) || Number.isNaN(endTime) || startTime <= endTime) {
    return { startDate, endDate };
  }

  return { startDate: endDate, endDate: startDate };
}

function splitLocation(value: string): { place: string; country: string } {
  if (!value) return { place: "", country: "" };

  const parts = value.split(LOCATION_SEPARATOR);
  if (parts.length < 2) {
    return { place: value, country: "" };
  }

  return {
    place: parts[0]?.trim() ?? "",
    country: parts[1]?.trim() ?? "",
  };
}

export default function TravelHistoryTrackerApp() {
  const [entries, setEntries] = useState<TravelEntry[]>(sampleData);
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authPending, setAuthPending] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [authFullName, setAuthFullName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authInfo, setAuthInfo] = useState("");
  const [search, setSearch] = useState("");
  const [countryFilter, setCountryFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const [deletingSelected, setDeletingSelected] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const settingsMenuRef = useRef<HTMLDivElement | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [form, setForm] = useState<TravelForm>(emptyForm);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!settingsMenuRef.current?.contains(event.target as Node)) {
        setSettingsOpen(false);
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  useEffect(() => {
    async function loadRecords(userId: string) {
      const { data, error } = await supabase
        .from("travel_records")
        .select("*")
        .eq("user_id", userId)
        .order("date", { ascending: false });

      if (!error && data) {
        setEntries((data as TravelRecordRow[]).map(normalizeRecord));
      }
    }

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
          setEntries([]);
          return;
        }

        const sessionUser = session?.user ?? null;
        setUser(sessionUser);

        if (sessionUser) {
          await loadRecords(sessionUser.id);
        } else {
          setEntries([]);
        }
      } catch (error) {
        if (isMounted) {
          console.error("Unexpected auth bootstrap error:", error);
          setUser(null);
          setEntries([]);
        }
      } finally {
        if (isMounted) {
          setAuthLoading(false);
        }
      }
    }

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!isMounted) return;

      const sessionUser = session?.user ?? null;
      setUser(sessionUser);

      if (sessionUser) {
        await loadRecords(sessionUser.id);
      } else {
        setEntries([]);
      }

      setAuthLoading(false);
    });

    void bootstrapAuth();

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const countries = useMemo(() => {
    return [...new Set(entries.map((entry) => entry.country).filter(Boolean))].sort();
  }, [entries]);

  const years = useMemo(() => {
    return [...new Set(entries.map((entry) => formatYear(entry.date || entry.endDate)).filter(Boolean))].sort((a, b) => Number(b) - Number(a));
  }, [entries]);

  const filtered = useMemo(() => {
    return sortEntries(
      entries.filter((entry) => {
        const blob = `${entry.date} ${entry.endDate} ${entry.from} ${entry.to} ${entry.country} ${entry.purpose} ${entry.notes}`.toLowerCase();
        const matchesSearch = blob.includes(search.toLowerCase());
        const matchesCountry = countryFilter === "all" || entry.country === countryFilter;
        const matchesYear = yearFilter === "all" || formatYear(entry.date || entry.endDate) === yearFilter;
        return matchesSearch && matchesCountry && matchesYear;
      })
    );
  }, [entries, search, countryFilter, yearFilter]);

  const groupedByYearMonth = useMemo<YearMonthGroup[]>(() => {
    const grouped: Record<string, Record<string, TravelEntry[]>> = {};
    filtered.forEach((entry) => {
      const anchorDate = entry.date || entry.endDate;
      const year = formatYear(anchorDate) || "Unknown Year";
      const month = formatMonth(anchorDate) || "Unknown Month";
      grouped[year] ??= {};
      grouped[year][month] ??= [];
      grouped[year][month].push(entry);
    });

    const orderedYears = Object.keys(grouped).sort((a, b) => {
      if (a === "Unknown Year") return 1;
      if (b === "Unknown Year") return -1;
      return Number(b) - Number(a);
    });

    return orderedYears.map((year) => ({
      year,
      months: [...monthOrder]
        .reverse()
        .filter((month) => grouped[year][month])
        .map((month) => ({ month, items: sortEntries(grouped[year][month]) })),
    }));
  }, [filtered]);

  const stats = useMemo(() => {
    const uniqueCountries = new Set(entries.map((entry) => entry.country).filter(Boolean)).size;
    const totalTrips = entries.length;
    const yearsCovered = new Set(entries.map((entry) => formatYear(entry.date || entry.endDate)).filter(Boolean)).size;

    const countryCounts = entries.reduce<Record<string, number>>((acc, item) => {
      if (!item.country) return acc;
      acc[item.country] = (acc[item.country] || 0) + 1;
      return acc;
    }, {});

    const topCountryEntry = Object.entries(countryCounts).sort((a, b) => b[1] - a[1])[0];
    const topCountry = topCountryEntry?.[0] || "-";
    const topCountryVisits = topCountryEntry?.[1] || 0;
    return { uniqueCountries, totalTrips, yearsCovered, topCountry, topCountryVisits };
  }, [entries]);

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

    if (authMode === "signup") {
      const { error } = await supabase.auth.signUp({
        email: authEmail,
        password: authPassword,
        options: {
          data: {
            full_name: authFullName.trim(),
          },
        },
      });

      if (error) {
        setAuthError(error.message);
      } else {
        setAuthInfo("Account created. Check your email to confirm before logging in.");
      }
    }

    if (authMode === "login") {
      const { error } = await supabase.auth.signInWithPassword({
        email: authEmail,
        password: authPassword,
      });

      if (error) {
        setAuthError(error.message);
      }
    }

    setAuthPending(false);
  }

  async function handleForgotPassword(): Promise<void> {
    setAuthError("");
    setAuthInfo("");

    if (!authEmail) {
      setAuthError("Enter your email first, then click Forgot password.");
      return;
    }

    setAuthPending(true);

    const { error } = await supabase.auth.resetPasswordForEmail(authEmail, {
      redirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
    });

    if (error) {
      setAuthError(error.message);
    } else {
      setAuthInfo("Password reset email sent. Check your inbox and spam folder.");
    }

    setAuthPending(false);
  }

  async function handleSignOut(): Promise<void> {
    setAuthError("");
    setAuthInfo("");
    setAuthPending(true);

    // Ensure UI exits authenticated state immediately even if remote revoke fails.
    setUser(null);
    setEntries([]);
    setOpen(false);
    setEditingId(null);

    const { error } = await supabase.auth.signOut({ scope: "local" });
    if (error) {
      setAuthError(`Signed out locally, but Supabase returned: ${error.message}`);
    }

    setAuthPending(false);
  }

  function openNewModal() {
    setEditingId(null);
    setForm(emptyForm);
    setOpen(true);
  }

  function openEditModal(entry: TravelEntry): void {
    const fromLocation = splitLocation(entry.from || "");
    const toLocation = splitLocation(entry.to || "");

    setEditingId(entry.id);
    setForm({
      date: entry.date || "",
      endDate: entry.endDate || entry.date || "",
      from: fromLocation.country ? fromLocation.place : "",
      fromCountry: fromLocation.country || fromLocation.place || "",
      to: toLocation.country ? toLocation.place : "",
      toCountry: toLocation.country || toLocation.place || entry.country || "",
      purpose: entry.purpose || "",
      notes: entry.notes || "",
    });
    setOpen(true);
  }

  async function saveEntry(): Promise<void> {
    if (!user) return;
    if (!form.date && !form.endDate && !form.fromCountry && !form.toCountry) return;

    const { startDate, endDate } = normalizeDateRange(form.date, form.endDate);

    const fromLocation = form.fromCountry.trim();
    const toLocation = form.toCountry.trim();
    const destinationCountry = form.toCountry || form.fromCountry || "";

    if (editingId) {
      let { data, error } = await supabase
        .from("travel_records")
        .update({
          date: startDate,
          end_date: endDate || null,
          from: fromLocation,
          to: toLocation,
          country: destinationCountry,
          purpose: form.purpose || "",
          notes: form.notes || "",
        })
        .eq("id", editingId)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error?.message && isMissingEndDateColumn(error.message)) {
        console.warn("travel_records.end_date column not found; falling back to single date storage.");
        const retry = await supabase
          .from("travel_records")
          .update({
            date: startDate,
            from: fromLocation,
            to: toLocation,
            country: destinationCountry,
            purpose: form.purpose || "",
            notes: form.notes || "",
          })
          .eq("id", editingId)
          .eq("user_id", user.id)
          .select()
          .single();

        data = retry.data;
        error = retry.error;
      }

      if (!error && data) {
        const updated = normalizeRecord(data as TravelRecordRow);
        setEntries((prev) => prev.map((entry) => (entry.id === editingId ? updated : entry)));
      }
    } else {
      let { data, error } = await supabase
        .from("travel_records")
        .insert([
          {
            date: startDate,
            end_date: endDate || null,
            from: fromLocation,
            to: toLocation,
            country: destinationCountry,
            purpose: form.purpose || "",
            notes: form.notes || "",
            user_id: user.id,
          },
        ])
        .select()
        .single();

      if (error?.message && isMissingEndDateColumn(error.message)) {
        console.warn("travel_records.end_date column not found; falling back to single date storage.");
        const retry = await supabase
          .from("travel_records")
          .insert([
            {
              date: startDate,
              from: fromLocation,
              to: toLocation,
              country: destinationCountry,
              purpose: form.purpose || "",
              notes: form.notes || "",
              user_id: user.id,
            },
          ])
          .select()
          .single();

        data = retry.data;
        error = retry.error;
      }

      if (!error && data) {
        const created = normalizeRecord(data as TravelRecordRow);
        setEntries((prev) => sortEntries([created, ...prev]));
      }
    }

    setOpen(false);
  }

  async function deleteEntry(id: string): Promise<void> {
    if (!user) return;
    const { error } = await supabase
      .from("travel_records")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (!error) {
      setEntries((prev) => prev.filter((entry) => entry.id !== id));
    }
  }

  async function deleteSelectedEntries(ids: string[]): Promise<void> {
    if (!user || ids.length === 0) return;

    setDeletingSelected(true);
    const { error } = await supabase
      .from("travel_records")
      .delete()
      .in("id", ids)
      .eq("user_id", user.id);

    if (!error) {
      setEntries((prev) => prev.filter((entry) => !ids.includes(entry.id)));
    }

    setDeletingSelected(false);
  }

  function triggerImport(): void {
    fileInputRef.current?.click();
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 md:p-8">
        <div className="mx-auto max-w-7xl">
          <Card className="rounded-2xl shadow-sm">
            <CardContent className="p-6 text-sm text-muted-foreground">
              Loading your session...
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-slate-50 p-4 md:p-8">
        <div className="pointer-events-none absolute -left-24 -top-16 h-72 w-72 rounded-full bg-amber-200/45 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 top-12 h-80 w-80 rounded-full bg-sky-200/40 blur-3xl" />
        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="rounded-[2rem] border-0 bg-[linear-gradient(145deg,#0b1324,#142748_65%,#2859a0)] p-0 text-white shadow-[0_24px_90px_rgba(12,26,52,0.3)]">
            <CardContent className="space-y-6 p-8 md:p-10">
              <div className="inline-flex items-center rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/85">
                Private travel archive
              </div>
              <div>
                <h1 className="text-4xl font-semibold leading-tight tracking-[-0.03em] md:text-5xl">
                  Own your travel history in one beautiful timeline.
                </h1>
                <p className="mt-4 max-w-xl text-sm leading-7 text-white/78 md:text-base">
                  Add trips and search your travel history instantly.
                </p>
              </div>
            </CardContent>
          </Card>
          <div className="flex items-center justify-center">
            <AuthCard
              mode={authMode}
              fullName={authFullName}
              email={authEmail}
              password={authPassword}
              pending={authPending}
              errorMessage={authError}
              infoMessage={authInfo}
              onModeChange={setAuthMode}
              onFullNameChange={setAuthFullName}
              onEmailChange={setAuthEmail}
              onPasswordChange={setAuthPassword}
              onForgotPassword={handleForgotPassword}
              onSubmit={handleAuthSubmit}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 rounded-3xl bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Plane className="h-4 w-4" /> Route Book
            </div>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">Track every trip in one clean view</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Built for passport-style travel history. Keep all your entry and exit dates in one place, searchable by country, year, and route.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button onClick={openNewModal}>
              <Plus className="mr-2 h-4 w-4" /> Add entry
            </Button>
            <Button variant="outline" onClick={() => exportToExcel(entries)}>
              <Download className="mr-2 h-4 w-4" /> Export Excel
            </Button>
            <Button variant="outline" onClick={triggerImport}>
              <Upload className="mr-2 h-4 w-4" /> Import Excel
            </Button>
            <div className="relative" ref={settingsMenuRef}>
              <Button variant="outline" onClick={() => setSettingsOpen((prev) => !prev)}>
                <Settings className="mr-2 h-4 w-4" /> Settings <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
              {settingsOpen ? (
                <div className="absolute right-0 z-30 mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                  <Button
                    asChild
                    variant="ghost"
                    className="h-11 w-full justify-start rounded-none px-3"
                    onClick={() => setSettingsOpen(false)}
                  >
                    <Link href="/profile">
                      <UserCircle2 className="mr-2 h-4 w-4" /> Profile
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    className="h-11 w-full justify-start rounded-none px-3 text-red-600 hover:text-red-700"
                    onClick={() => {
                      setSettingsOpen(false);
                      void handleSignOut();
                    }}
                    disabled={authPending}
                  >
                    <LogOut className="mr-2 h-4 w-4" /> {authPending ? "Logging out..." : "Log out"}
                  </Button>
                </div>
              ) : null}
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              const file = e.target.files?.[0];
              if (!file) return;
              if (!user) return;

              parseWorkbook(file, async (parsed: TravelEntry[]) => {
                const payload = parsed.map((item) => ({
                  date: item.date,
                  end_date: item.endDate || null,
                  from: item.from,
                  to: item.to,
                  country: item.country,
                  purpose: item.purpose,
                  notes: item.notes,
                  user_id: user.id,
                }));

                let { data, error } = await supabase
                  .from("travel_records")
                  .insert(payload)
                  .select();

                if (error?.message && isMissingEndDateColumn(error.message)) {
                  console.warn("travel_records.end_date column not found; falling back to single date storage for imports.");
                  const fallbackPayload = parsed.map((item) => ({
                    date: item.date,
                    from: item.from,
                    to: item.to,
                    country: item.country,
                    purpose: item.purpose,
                    notes: item.notes,
                    user_id: user.id,
                  }));

                  const retry = await supabase
                    .from("travel_records")
                    .insert(fallbackPayload)
                    .select();

                  data = retry.data;
                  error = retry.error;
                }

                if (!error && data) {
                  const normalized = (data as TravelRecordRow[]).map(normalizeRecord);
                  setEntries((prev) => sortEntries([...normalized, ...prev]));
                } else {
                  console.error("Import failed:", error);
                }
              });
            }}
          />
        </div>

        <StatsCards
          totalTrips={stats.totalTrips}
          uniqueCountries={stats.uniqueCountries}
          yearsCovered={stats.yearsCovered}
          topCountry={stats.topCountry}
          topCountryVisits={stats.topCountryVisits}
        />

        <FiltersCard
          search={search}
          countryFilter={countryFilter}
          yearFilter={yearFilter}
          countries={countries}
          years={years}
          onSearchChange={setSearch}
          onCountryChange={setCountryFilter}
          onYearChange={setYearFilter}
        />

        <Tabs defaultValue="timeline" className="space-y-4">
          <TabsList>
            <TabsTrigger value="timeline">Timeline view</TabsTrigger>
            <TabsTrigger value="table">Table view</TabsTrigger>
          </TabsList>

          <TabsContent value="timeline">
            <TimelineView
              filteredEntries={filtered}
              groupedByYearMonth={groupedByYearMonth}
              onAdd={openNewModal}
              onImport={triggerImport}
              onEdit={openEditModal}
              onDelete={deleteEntry}
            />
          </TabsContent>

          <TabsContent value="table">
            <TableView entries={filtered} onDeleteSelected={deleteSelectedEntries} deletingSelected={deletingSelected} />
          </TabsContent>
        </Tabs>

        <EntryDialog
          open={open}
          editingId={editingId}
          form={form}
          onOpenChange={setOpen}
          onFormChange={setForm}
          onSave={saveEntry}
        />
      </div>
    </div>
  );
}
