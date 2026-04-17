"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Download, HelpCircle, LogOut, Plus, Settings, Upload, UserCircle2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { useTravelEntries } from "@/app/travel-tracker/hooks/use-travel-entries";
import { downloadImportTemplate, exportToExcel } from "@/app/travel-tracker/utils";

export default function TravelHistoryTrackerApp() {
  const auth = useAuth();
  const [homeCountry, setHomeCountry] = useState("");
  const travelEntries = useTravelEntries({ user: auth.user, homeCountry });
  const filters = useFilters({ entries: travelEntries.entries, homeCountry });

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const settingsMenuRef = useRef<HTMLDivElement | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const logoSrc = `/logo-${LOGO_VARIANT}.svg`;

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  })();

  useEffect(() => {
    const storedTheme = typeof window !== "undefined" ? localStorage.getItem("routebook-theme") : null;
    if (storedTheme === "sand" || storedTheme === "ocean" || storedTheme === "sunset") {
      document.documentElement.setAttribute("data-theme", storedTheme);
      return;
    }
    document.documentElement.setAttribute("data-theme", "sand");
  }, []);

  useEffect(() => {
    const storedHomeCountry = typeof window !== "undefined" ? localStorage.getItem("routebook-home-country") : null;
    if (storedHomeCountry) {
      setHomeCountry(storedHomeCountry);
    }
  }, []);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!settingsMenuRef.current?.contains(event.target as Node)) {
        setSettingsOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  function triggerImport(): void {
    fileInputRef.current?.click();
  }

  if (auth.authLoading || (!!auth.user && travelEntries.entriesLoading)) {
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

  if (!auth.user) {
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
                  Every border crossed. Every trip logged. All yours.
                </h1>
                <p className="mt-4 max-w-xl text-sm leading-7 text-white/78 md:text-base">
                  A private archive for everywhere you've been.
                </p>
              </div>
            </CardContent>
          </Card>
          <div className="flex items-center justify-center">
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
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 pb-24 md:p-8 md:pb-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 rounded-3xl bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <img src={logoSrc} alt="Route Book logo" className="h-4 w-4 rounded-sm" /> Route Book
            </div>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">
              {greeting}, {auth.user?.user_metadata?.full_name?.split(" ")[0] ?? auth.user?.email?.split("@")[0]}.
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Here's everything you've logged.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
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
                  <Button
                    variant="ghost"
                    className="h-11 w-full justify-start rounded-none px-3"
                    onClick={() => { setSettingsOpen(false); downloadImportTemplate(); }}
                  >
                    <Download className="mr-2 h-4 w-4" /> Download template
                  </Button>
                  <Button
                    asChild
                    variant="ghost"
                    className="h-11 w-full justify-start rounded-none px-3"
                    onClick={() => setSettingsOpen(false)}
                  >
                    <Link href="/help">
                      <HelpCircle className="mr-2 h-4 w-4" /> Help
                    </Link>
                  </Button>
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
                    onClick={() => { setSettingsOpen(false); void auth.handleSignOut(); }}
                    disabled={auth.authPending}
                  >
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

        <StatsCards
          totalTrips={filters.stats.totalTrips}
          uniqueCountries={filters.stats.uniqueCountries}
          yearsCovered={filters.stats.yearsCovered}
          topCountry={filters.stats.topCountry}
          topCountryVisits={filters.stats.topCountryVisits}
        />

        <FiltersCard
          search={filters.search}
          countryFilter={filters.countryFilter}
          yearFilter={filters.yearFilter}
          countries={filters.countries}
          years={filters.years}
          onSearchChange={filters.setSearch}
          onCountryChange={filters.setCountryFilter}
          onYearChange={filters.setYearFilter}
        />

        <Tabs defaultValue="timeline" className="space-y-4">
          <TabsList className="w-full justify-start overflow-x-auto whitespace-nowrap">
            <TabsTrigger value="timeline">Timeline view</TabsTrigger>
            <TabsTrigger value="table">Table view</TabsTrigger>
            <TabsTrigger value="map">Map mode</TabsTrigger>
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
        </Tabs>

        <EntryDialog
          open={travelEntries.open}
          editingId={travelEntries.editingId}
          form={travelEntries.form}
          onOpenChange={travelEntries.setOpen}
          onFormChange={travelEntries.setForm}
          onSave={travelEntries.saveEntry}
        />
      </div>

      <Button
        className="fixed bottom-5 right-5 h-12 rounded-full px-5 shadow-xl md:hidden"
        onClick={travelEntries.openNewModal}
      >
        <Plus className="mr-2 h-4 w-4" /> Quick add
      </Button>
    </div>
  );
}
