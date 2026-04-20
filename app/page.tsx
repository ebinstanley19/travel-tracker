"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Download, HelpCircle, LogOut, Plus, Search, Settings, Upload, UserCircle2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AuthCard } from "@/app/travel-tracker/auth-card";
import { EntryDialog } from "@/app/travel-tracker/entry-dialog";
import { FiltersCard } from "@/app/travel-tracker/filters-card";
import { MapView } from "@/app/travel-tracker/map-view";
import { StatsCards } from "@/app/travel-tracker/stats-cards";
import { TableView } from "@/app/travel-tracker/table-view";
import { TimelineView } from "@/app/travel-tracker/timeline-view";
import { LOGO_VARIANT } from "@/app/travel-tracker/brand-config";
import { useAuth } from "@/app/travel-tracker/hooks/use-auth";
import { useFilters } from "@/app/travel-tracker/hooks/use-filters";
import { usePreferences } from "@/app/travel-tracker/hooks/use-preferences";
import { useTravelEntries } from "@/app/travel-tracker/hooks/use-travel-entries";
import { downloadImportTemplate, exportToExcel } from "@/app/travel-tracker/utils";

export default function TravelHistoryTrackerApp() {
  const auth = useAuth();
  const { prefs } = usePreferences(auth.user);
  const [homeCountry, setHomeCountry] = useState("");
  const [defaultView, setDefaultView] = useState("timeline");
  const travelEntries = useTravelEntries({ user: auth.user, homeCountry });
  const filters = useFilters({ entries: travelEntries.entries, homeCountry });

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const settingsMenuRef = useRef<HTMLDivElement | null>(null);
  const settingsMobilePanelRef = useRef<HTMLDivElement | null>(null);
  const filtersRef = useRef<HTMLDivElement | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const logoSrc = `/logo-${LOGO_VARIANT}.svg`;

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  })();

  useEffect(() => {
    const storedTheme = typeof window !== "undefined" ? localStorage.getItem("routebook-theme") : null;
    if (storedTheme === "sand" || storedTheme === "ocean" || storedTheme === "sunset" || storedTheme === "white") {
      document.documentElement.setAttribute("data-theme", storedTheme);
      return;
    }
    document.documentElement.setAttribute("data-theme", "sand");
  }, []);

  useEffect(() => {
    setHomeCountry(prefs.homeCountry);
  }, [prefs.homeCountry]);

  useEffect(() => {
    setDefaultView(prefs.defaultView);
  }, [prefs.defaultView]);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (
        !settingsMenuRef.current?.contains(event.target as Node) &&
        !settingsMobilePanelRef.current?.contains(event.target as Node)
      ) {
        setSettingsOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  function triggerImport(): void {
    fileInputRef.current?.click();
  }

  const insightLine = "Here's everything you've logged.";

  if (auth.authLoading || (!!auth.user && travelEntries.entriesLoading)) {
    return (
      <div className="min-h-screen p-4 md:p-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="rounded-3xl bg-white/80 p-6 shadow-sm backdrop-blur-xl">
            <div className="h-3.5 w-20 animate-pulse rounded-full bg-slate-200" />
            <div className="mt-4 h-7 w-44 animate-pulse rounded-full bg-slate-200" />
            <div className="mt-2.5 h-3.5 w-56 animate-pulse rounded-full bg-slate-100" />
          </div>
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-32 animate-pulse rounded-[2rem] bg-white/70" style={{ animationDelay: `${i * 60}ms` }} />
            ))}
          </div>
          <div className="h-16 animate-pulse rounded-[2rem] bg-white/70 backdrop-blur-xl" />
          <div className="h-10 animate-pulse rounded-2xl bg-white/70" />
          <div className="h-64 animate-pulse rounded-[2rem] bg-white/70 backdrop-blur-xl" />
        </div>
      </div>
    );
  }

  if (!auth.user) {
    return (
      <div className="grid min-h-screen bg-white lg:grid-cols-[1.1fr_0.9fr]">
        <div className="flex flex-col justify-center bg-[linear-gradient(145deg,#0b1324,#142748_65%,#2859a0)] p-12 text-white">
          <div className="inline-flex items-center rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/85 w-fit">
            Private travel archive
          </div>
          <h1 className="mt-6 text-4xl font-semibold leading-tight tracking-[-0.03em] md:text-5xl">
            Every border crossed. Every trip logged. All yours.
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-7 text-white/78 md:text-base">
            A private archive for everywhere you&apos;ve been.
          </p>
        </div>
        <div className="flex items-center justify-center p-8">
          <AuthCard
            mode={auth.authMode}
            fullName={auth.authFullName}
            email={auth.authEmail}
            password={auth.authPassword}
            pending={auth.authPending}
            errorMessage={auth.authError}
            infoMessage={auth.authInfo}
            onModeChange={auth.setAuthMode}
            onFullNameChange={auth.setAuthFullName}
            onEmailChange={auth.setAuthEmail}
            onPasswordChange={auth.setAuthPassword}
            onForgotPassword={auth.handleForgotPassword}
            onSubmit={auth.handleAuthSubmit}
            onGoogleSignIn={auth.handleGoogleSignIn}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 pb-24 md:p-8 md:pb-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-3 rounded-3xl bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between md:p-6">
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <img src={logoSrc} alt="Route Book logo" className="h-4 w-4 rounded-sm" /> Route Book
            </div>
            <h1 className="mt-1 text-xl font-bold tracking-tight md:mt-2 md:text-3xl">
              {greeting}, {auth.user?.user_metadata?.full_name?.split(" ")[0] ?? auth.user?.email?.split("@")[0]}.
            </h1>
            <p className="mt-1 hidden max-w-2xl text-sm text-muted-foreground md:mt-2 md:block">
              {insightLine}
            </p>
          </div>
          <div className="hidden flex-wrap gap-3 md:flex">
            <Button onClick={travelEntries.openNewModal}>
              <Plus className="mr-2 h-4 w-4" /> Add entry
            </Button>
            <Button variant="outline" onClick={() => exportToExcel(travelEntries.entries)}>
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
                <div className="absolute right-0 z-30 mt-2 w-64 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                  <div className="border-b border-slate-100 px-3 py-3">
                    <p className="truncate text-sm font-semibold text-slate-800">
                      {auth.user?.user_metadata?.full_name ?? auth.user?.email?.split("@")[0]}
                    </p>
                    <p className="truncate text-xs text-slate-500">{auth.user?.email}</p>
                  </div>
                  <Button variant="ghost" className="h-11 w-full justify-start rounded-none px-3" onClick={() => { setSettingsOpen(false); downloadImportTemplate(); }}>
                    <Download className="mr-2 h-4 w-4" /> Download template
                  </Button>
                  <Button asChild variant="ghost" className="h-11 w-full justify-start rounded-none px-3" onClick={() => setSettingsOpen(false)}>
                    <Link href="/help"><HelpCircle className="mr-2 h-4 w-4" /> Help</Link>
                  </Button>
                  <Button asChild variant="ghost" className="h-11 w-full justify-start rounded-none px-3" onClick={() => setSettingsOpen(false)}>
                    <Link href="/visa"><UserCircle2 className="mr-2 h-4 w-4" /> Visa tracker</Link>
                  </Button>
                  <Button asChild variant="ghost" className="h-11 w-full justify-start rounded-none px-3" onClick={() => setSettingsOpen(false)}>
                    <Link href="/profile"><UserCircle2 className="mr-2 h-4 w-4" /> Profile</Link>
                  </Button>
                  <Button variant="ghost" className="h-11 w-full justify-start rounded-none px-3 text-red-600 hover:text-red-700" onClick={() => { setSettingsOpen(false); void auth.handleSignOut(); }} disabled={auth.authPending}>
                    <LogOut className="mr-2 h-4 w-4" /> {auth.authPending ? "Logging out..." : "Log out"}
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
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const validExts = [".xlsx", ".xls", ".csv"];
              const hasValidExt = validExts.some((ext) => file.name.toLowerCase().endsWith(ext));
              if (!hasValidExt) {
                alert("Only .xlsx, .xls, and .csv files are supported.");
                e.target.value = "";
                return;
              }
              if (file.size > 10 * 1024 * 1024) {
                alert("File is too large. Maximum size is 10 MB.");
                e.target.value = "";
                return;
              }
              travelEntries.importEntries(file);
              e.target.value = "";
            }}
          />
        </div>

        <div className="animate-fade-up" style={{ animationDelay: "60ms" }}>
          <StatsCards
            totalTrips={filters.stats.totalTrips}
            uniqueCountries={filters.stats.uniqueCountries}
            yearsCovered={filters.stats.yearsCovered}
            topCountry={filters.stats.topCountry}
            topCountryVisits={filters.stats.topCountryVisits}
          />
        </div>

        <div ref={filtersRef} className={`animate-fade-up md:block${filtersOpen ? " block" : " hidden"}`} style={{ animationDelay: "120ms" }}>
          <FiltersCard
            search={filters.search}
            countryFilter={filters.countryFilter}
            yearFilter={filters.yearFilter}
            fromDateFilter={filters.fromDateFilter}
            toDateFilter={filters.toDateFilter}
            countries={filters.countries}
            years={filters.years}
            onSearchChange={filters.setSearch}
            onCountryChange={filters.setCountryFilter}
            onYearChange={filters.setYearFilter}
            onFromDateChange={filters.setFromDateFilter}
            onToDateChange={filters.setToDateFilter}
          />
        </div>

        <div className="animate-fade-up" style={{ animationDelay: "180ms" }}>
        <Tabs defaultValue={defaultView} className="space-y-4">
          <TabsList className="h-auto w-full justify-start overflow-x-auto whitespace-nowrap rounded-2xl border border-slate-200/70 bg-white/80 p-1.5 backdrop-blur-sm shadow-[0_4px_20px_rgba(15,23,42,0.06)]">
            <TabsTrigger className="rounded-xl px-5 py-2.5 font-medium text-slate-600 data-[state=active]:bg-slate-950 data-[state=active]:text-white data-[state=active]:shadow-none" value="timeline">Timeline view</TabsTrigger>
            <TabsTrigger className="rounded-xl px-5 py-2.5 font-medium text-slate-600 data-[state=active]:bg-slate-950 data-[state=active]:text-white data-[state=active]:shadow-none" value="table">Table view</TabsTrigger>
            <TabsTrigger className="rounded-xl px-5 py-2.5 font-medium text-slate-600 data-[state=active]:bg-slate-950 data-[state=active]:text-white data-[state=active]:shadow-none" value="map">Map mode</TabsTrigger>
            <TabsTrigger className="rounded-xl px-5 py-2.5 font-medium text-slate-600 data-[state=active]:bg-slate-950 data-[state=active]:text-white data-[state=active]:shadow-none" value="insights">Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="timeline">
            <TimelineView
              filteredEntries={filters.filtered}
              groupedByYearMonth={filters.groupedByYearMonth}
              onAdd={travelEntries.openNewModal}
              onImport={triggerImport}
              onEdit={travelEntries.openEditModal}
              onDelete={travelEntries.deleteEntry}
            />
          </TabsContent>

          <TabsContent value="table">
            <TableView
              entries={filters.filtered}
              onDeleteSelected={travelEntries.deleteSelectedEntries}
              deletingSelected={travelEntries.deletingSelected}
            />
          </TabsContent>

          <TabsContent value="map">
            <MapView
              entries={filters.filtered}
              selectedCountry={filters.countryFilter}
              homeCountry={homeCountry}
              onCountrySelect={filters.setCountryFilter}
            />
          </TabsContent>

          <TabsContent value="insights">
            <InsightsInline entries={travelEntries.entries} />
          </TabsContent>
        </Tabs>
        </div>

        <EntryDialog
          open={travelEntries.open}
          editingId={travelEntries.editingId}
          form={travelEntries.form}
          onOpenChange={travelEntries.setOpen}
          onFormChange={travelEntries.setForm}
          onSave={travelEntries.saveEntry}
        />
      </div>

      {/* Mobile bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-slate-200 bg-white/95 backdrop-blur-xl md:hidden">
        <button
          className="flex flex-1 flex-col items-center gap-1 py-3 text-[11px] font-medium text-slate-600 active:bg-slate-50"
          onClick={travelEntries.openNewModal}
        >
          <Plus className="h-5 w-5" /> Add
        </button>
        <button
          className="flex flex-1 flex-col items-center gap-1 py-3 text-[11px] font-medium text-slate-600 active:bg-slate-50"
          onClick={() => exportToExcel(travelEntries.entries)}
        >
          <Download className="h-5 w-5" /> Export
        </button>
        <button
          className={`flex flex-1 flex-col items-center gap-1 py-3 text-[11px] font-medium active:bg-slate-50 ${filtersOpen ? "text-slate-950" : "text-slate-600"}`}
          onClick={() => {
            setFiltersOpen((prev) => {
              if (!prev) setTimeout(() => filtersRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
              return !prev;
            });
          }}
        >
          <Search className="h-5 w-5" /> Search
        </button>
        <button
          className="flex flex-1 flex-col items-center gap-1 py-3 text-[11px] font-medium text-slate-600 active:bg-slate-50"
          onClick={() => setSettingsOpen((prev) => !prev)}
        >
          <Settings className="h-5 w-5" /> Settings
        </button>
      </div>

      {/* Mobile settings panel */}
      {settingsOpen ? (
        <div className="md:hidden">
          <div className="fixed inset-0 z-40 bg-black/20" onClick={() => setSettingsOpen(false)} />
          <div ref={settingsMobilePanelRef} className="fixed bottom-16 left-2 right-2 z-50 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
            <div className="border-b border-slate-100 px-4 py-3">
              <p className="truncate text-sm font-semibold text-slate-800">
                {auth.user?.user_metadata?.full_name ?? auth.user?.email?.split("@")[0]}
              </p>
              <p className="truncate text-xs text-slate-500">{auth.user?.email}</p>
            </div>
            <Button variant="ghost" className="h-12 w-full justify-start rounded-none px-4" onClick={() => { setSettingsOpen(false); triggerImport(); }}>
              <Upload className="mr-2 h-4 w-4" /> Import Excel
            </Button>
            <Button variant="ghost" className="h-12 w-full justify-start rounded-none px-4" onClick={() => { setSettingsOpen(false); downloadImportTemplate(); }}>
              <Download className="mr-2 h-4 w-4" /> Download template
            </Button>
            <Button asChild variant="ghost" className="h-12 w-full justify-start rounded-none px-4" onClick={() => setSettingsOpen(false)}>
              <Link href="/help"><HelpCircle className="mr-2 h-4 w-4" /> Help</Link>
            </Button>
            <Button asChild variant="ghost" className="h-12 w-full justify-start rounded-none px-4" onClick={() => setSettingsOpen(false)}>
              <Link href="/visa"><UserCircle2 className="mr-2 h-4 w-4" /> Visa tracker</Link>
            </Button>
            <Button asChild variant="ghost" className="h-12 w-full justify-start rounded-none px-4" onClick={() => setSettingsOpen(false)}>
              <Link href="/profile"><UserCircle2 className="mr-2 h-4 w-4" /> Profile</Link>
            </Button>
            <Button variant="ghost" className="h-12 w-full justify-start rounded-none px-4 text-red-600 hover:text-red-700" onClick={() => { setSettingsOpen(false); void auth.handleSignOut(); }} disabled={auth.authPending}>
              <LogOut className="mr-2 h-4 w-4" /> {auth.authPending ? "Logging out..." : "Log out"}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

// Inline insights component for the tab — lightweight version linking to the full page
import type { TravelEntry } from "@/app/travel-tracker/types";
import { getCountryFromLocation, prettyDate } from "@/app/travel-tracker/utils";
import { CONTINENT_MAP } from "@/app/travel-tracker/continents";

function InsightsInline({ entries }: { entries: TravelEntry[] }) {
  const totalTrips = entries.length;

  const allToCountries = entries.map((e) => getCountryFromLocation(e.to) || e.country).filter(Boolean);
  const uniqueCountries = new Set(entries.flatMap((e) => {
    const from = getCountryFromLocation(e.from);
    const to = getCountryFromLocation(e.to) || e.country;
    return [from, to].filter(Boolean);
  })).size;

  const continents = new Set(allToCountries.map((c) => CONTINENT_MAP[c]).filter(Boolean));

  let totalNights = 0;
  let longestTrip: { dest: string; nights: number } | null = null;
  for (const entry of entries) {
    if (entry.date && entry.endDate && entry.date !== entry.endDate) {
      const n = Math.round((new Date(entry.endDate).getTime() - new Date(entry.date).getTime()) / (1000 * 60 * 60 * 24));
      if (n > 0) {
        totalNights += n;
        if (!longestTrip || n > longestTrip.nights) {
          longestTrip = { dest: getCountryFromLocation(entry.to) || entry.country || "—", nights: n };
        }
      }
    }
  }

  const countryCount: Record<string, number> = {};
  for (const c of allToCountries) {
    countryCount[c] = (countryCount[c] || 0) + 1;
  }
  const top5 = Object.entries(countryCount).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const maxCount = top5[0]?.[1] ?? 1;

  const sorted = [...entries].sort((a, b) => new Date(b.date || b.endDate).getTime() - new Date(a.date || a.endDate).getTime());
  const firstTrip = sorted[sorted.length - 1];

  if (totalTrips === 0) {
    return (
      <div className="rounded-[2rem] border border-white/60 bg-white/75 py-16 text-center shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl">
        <p className="text-sm text-slate-400">Add some trips to see your insights.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-[2rem] border border-white/60 bg-white/75 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold tracking-tight">Your travel at a glance</h2>
        <Button asChild variant="outline" size="sm">
          <Link href="/insights">Full insights →</Link>
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Trips", value: totalTrips },
          { label: "Countries", value: uniqueCountries },
          { label: "Continents", value: continents.size },
          { label: "Nights abroad", value: totalNights },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-xl border border-slate-100 bg-slate-50/60 p-4 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">{value}</p>
          </div>
        ))}
      </div>
      {top5.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-slate-700">Top destinations</p>
          {top5.map(([country, count]) => (
            <div key={country} className="flex items-center gap-3">
              <span className="w-28 truncate text-sm text-slate-700">{country}</span>
              <div className="flex-1 h-2 rounded-full bg-slate-100">
                <div
                  className="h-2 rounded-full bg-slate-800 transition-all"
                  style={{ width: `${Math.round((count / maxCount) * 100)}%` }}
                />
              </div>
              <span className="w-5 text-right text-xs tabular-nums text-slate-500">{count}</span>
            </div>
          ))}
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        {longestTrip && (
          <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Longest trip</p>
            <p className="mt-0.5 text-sm font-semibold text-slate-800">{longestTrip.dest} · {longestTrip.nights}n</p>
          </div>
        )}
        {firstTrip && (
          <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">First trip</p>
            <p className="mt-0.5 text-sm font-semibold text-slate-800">
              {getCountryFromLocation(firstTrip.to) || firstTrip.country || "—"} · {prettyDate(firstTrip.date)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
