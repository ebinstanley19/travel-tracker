"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Download, Globe2, Plane, Plus, Upload } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AuthCard, type AuthMode } from "@/app/travel-tracker/auth-card";
import { EntryDialog } from "@/app/travel-tracker/entry-dialog";
import { FiltersCard } from "@/app/travel-tracker/filters-card";
import { StatsCards } from "@/app/travel-tracker/stats-cards";
import { TableView } from "@/app/travel-tracker/table-view";
import { TimelineView } from "@/app/travel-tracker/timeline-view";
import type { TravelEntry, TravelForm, YearMonthGroup } from "@/app/travel-tracker/types";
import { exportToExcel, formatMonth, formatYear, monthOrder, parseWorkbook, sortEntries } from "@/app/travel-tracker/utils";
import { supabase } from "@/lib/supabase";

const sampleData: TravelEntry[] = [];

const emptyForm: TravelForm = {
  date: "",
  from: "",
  to: "",
  country: "",
  purpose: "",
  notes: "",
};

interface TravelRecordRow {
  id: string;
  date?: string | null;
  from?: string | null;
  to?: string | null;
  country?: string | null;
  purpose?: string | null;
  notes?: string | null;
}

function normalizeRecord(item: TravelRecordRow): TravelEntry {
  return {
    id: item.id,
    date: item.date ?? "",
    from: item.from ?? "",
    to: item.to ?? "",
    country: item.country ?? "",
    purpose: item.purpose ?? "",
    notes: item.notes ?? "",
  };
}

export default function TravelHistoryTrackerApp() {
  const [entries, setEntries] = useState<TravelEntry[]>(sampleData);
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authPending, setAuthPending] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authInfo, setAuthInfo] = useState("");
  const [search, setSearch] = useState("");
  const [countryFilter, setCountryFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [form, setForm] = useState<TravelForm>(emptyForm);

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

    supabase.auth.getUser().then(async ({ data }) => {
      if (!isMounted) return;

      const currentUser = data.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        await loadRecords(currentUser.id);
      } else {
        setEntries([]);
      }

      setAuthLoading(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const sessionUser = session?.user ?? null;
      setUser(sessionUser);

      if (sessionUser) {
        await loadRecords(sessionUser.id);
      } else {
        setEntries([]);
      }
    });

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const countries = useMemo(() => {
    return [...new Set(entries.map((entry) => entry.country).filter(Boolean))].sort();
  }, [entries]);

  const years = useMemo(() => {
    return [...new Set(entries.map((entry) => formatYear(entry.date)).filter(Boolean))].sort((a, b) => Number(b) - Number(a));
  }, [entries]);

  const filtered = useMemo(() => {
    return sortEntries(
      entries.filter((entry) => {
        const blob = `${entry.date} ${entry.from} ${entry.to} ${entry.country} ${entry.purpose} ${entry.notes}`.toLowerCase();
        const matchesSearch = blob.includes(search.toLowerCase());
        const matchesCountry = countryFilter === "all" || entry.country === countryFilter;
        const matchesYear = yearFilter === "all" || formatYear(entry.date) === yearFilter;
        return matchesSearch && matchesCountry && matchesYear;
      })
    );
  }, [entries, search, countryFilter, yearFilter]);

  const groupedByYearMonth = useMemo<YearMonthGroup[]>(() => {
    const grouped: Record<string, Record<string, TravelEntry[]>> = {};
    filtered.forEach((entry) => {
      const year = formatYear(entry.date) || "Unknown Year";
      const month = formatMonth(entry.date) || "Unknown Month";
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
      months: monthOrder
        .filter((month) => grouped[year][month])
        .map((month) => ({ month, items: sortEntries(grouped[year][month]) })),
    }));
  }, [filtered]);

  const stats = useMemo(() => {
    const uniqueCountries = new Set(entries.map((entry) => entry.country).filter(Boolean)).size;
    const totalTrips = entries.length;
    const yearsCovered = new Set(entries.map((entry) => formatYear(entry.date)).filter(Boolean)).size;

    const countryCounts = entries.reduce<Record<string, number>>((acc, item) => {
      if (!item.country) return acc;
      acc[item.country] = (acc[item.country] || 0) + 1;
      return acc;
    }, {});

    const topCountry = Object.entries(countryCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "-";
    return { uniqueCountries, totalTrips, yearsCovered, topCountry };
  }, [entries]);

  async function handleAuthSubmit(): Promise<void> {
    setAuthError("");
    setAuthInfo("");

    if (!authEmail || !authPassword) {
      setAuthError("Email and password are required.");
      return;
    }

    setAuthPending(true);

    if (authMode === "signup") {
      const { error } = await supabase.auth.signUp({
        email: authEmail,
        password: authPassword,
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
    setEditingId(entry.id);
    setForm({
      date: entry.date || "",
      from: entry.from || "",
      to: entry.to || "",
      country: entry.country || "",
      purpose: entry.purpose || "",
      notes: entry.notes || "",
    });
    setOpen(true);
  }

  async function saveEntry(): Promise<void> {
    if (!user) return;
    if (!form.date && !form.from && !form.to && !form.country) return;

    if (editingId) {
      const { data, error } = await supabase
        .from("travel_records")
        .update({
          date: form.date,
          from: form.from || "",
          to: form.to || "",
          country: form.country || "",
          purpose: form.purpose || "",
          notes: form.notes || "",
        })
        .eq("id", editingId)
        .eq("user_id", user.id)
        .select()
        .single();

      if (!error && data) {
        const updated = normalizeRecord(data as TravelRecordRow);
        setEntries((prev) => prev.map((entry) => (entry.id === editingId ? updated : entry)));
      }
    } else {
      const { data, error } = await supabase
        .from("travel_records")
        .insert([
          {
            date: form.date,
            from: form.from || "",
            to: form.to || "",
            country: form.country || "",
            purpose: form.purpose || "",
            notes: form.notes || "",
            user_id: user.id,
          },
        ])
        .select()
        .single();

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
      <div className="min-h-screen bg-slate-50 p-4 md:p-8">
        <div className="mx-auto max-w-4xl space-y-6">
          <Card className="rounded-2xl shadow-sm">
            <CardContent className="p-6">
              <h1 className="text-2xl font-bold tracking-tight">Travel History Tracker</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Create an account or log in to manage your own private travel history.
              </p>
            </CardContent>
          </Card>
          <AuthCard
            mode={authMode}
            email={authEmail}
            password={authPassword}
            pending={authPending}
            errorMessage={authError}
            infoMessage={authInfo}
            onModeChange={setAuthMode}
            onEmailChange={setAuthEmail}
            onPasswordChange={setAuthPassword}
            onSubmit={handleAuthSubmit}
          />
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
              <Plane className="h-4 w-4" /> Travel History Tracker
            </div>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">Track every trip in one clean view</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Built for passport-style travel history. Keep all your entry and exit dates in one place, searchable by country, year, and route.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={handleSignOut} disabled={authPending}>
              {authPending ? "Logging out..." : "Log out"}
            </Button>
            <Button variant="outline" onClick={() => exportToExcel(entries)}>
              <Download className="mr-2 h-4 w-4" /> Export Excel
            </Button>
            <Button variant="outline" onClick={triggerImport}>
              <Upload className="mr-2 h-4 w-4" /> Import Excel
            </Button>
            <Button onClick={openNewModal}>
              <Plus className="mr-2 h-4 w-4" /> Add entry
            </Button>
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
                  from: item.from,
                  to: item.to,
                  country: item.country,
                  purpose: item.purpose,
                  notes: item.notes,
                  user_id: user.id,
                }));

                const { data, error } = await supabase
                  .from("travel_records")
                  .insert(payload)
                  .select();

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
            <TableView entries={filtered} />
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
