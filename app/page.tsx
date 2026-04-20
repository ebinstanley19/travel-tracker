"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Bell, ChevronDown, Download, HelpCircle, LogOut, Pencil, Plane, Plus, Search, Settings, Trash2, Upload, UserCircle2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { computeMilestones } from "@/app/travel-tracker/milestones";
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
  const notifRef = useRef<HTMLDivElement | null>(null);
  const notifMobileRef = useRef<HTMLDivElement | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [activeUpcomingOptionsId, setActiveUpcomingOptionsId] = useState<string | null>(null);
  const [upcomingExpanded, setUpcomingExpanded] = useState(true);
  const [seenMilestoneIds, setSeenMilestoneIds] = useState<Set<string>>(new Set());
  const [dismissedNotifIds, setDismissedNotifIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      const stored = localStorage.getItem("routebook-seen-milestones");
      if (stored) setSeenMilestoneIds(new Set(JSON.parse(stored) as string[]));
    } catch {}
    try {
      const stored = localStorage.getItem("routebook-dismissed-notifications");
      if (stored) setDismissedNotifIds(new Set(JSON.parse(stored) as string[]));
    } catch {}
  }, []);

  const newMilestones = useMemo(
    () => computeMilestones(travelEntries.entries).filter((m) => m.achieved && !seenMilestoneIds.has(m.id)),
    [travelEntries.entries, seenMilestoneIds],
  );

  const notifications = useMemo(() => {
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    const currentYear = today.getFullYear();
    const items: { id: string; icon: string; title: string; tag: string }[] = [];

    for (const m of newMilestones) {
      items.push({ id: `milestone-${m.id}`, icon: m.icon, title: m.label, tag: "Milestone" });
    }

    for (const entry of filters.upcomingEntries) {
      const days = Math.ceil((new Date(entry.date).setHours(0,0,0,0) - new Date().setHours(0,0,0,0)) / 86400000);
      if (days <= 7) {
        const dest = getCountryFromLocation(entry.to) || entry.country || entry.to || "Unknown";
        const label = days === 0 ? `Trip to ${dest} starts today` : days === 1 ? `Trip to ${dest} tomorrow` : `Trip to ${dest} in ${days} days`;
        items.push({ id: `upcoming-${entry.id}`, icon: "🗓️", title: label, tag: "Upcoming" });
      }
      if (entry.endDate && entry.endDate !== entry.date) {
        const nights = Math.round((new Date(entry.endDate).getTime() - new Date(entry.date).getTime()) / 86400000);
        if (nights >= 14) {
          const dest = getCountryFromLocation(entry.to) || entry.country || entry.to || "Unknown";
          items.push({ id: `longtrip-${entry.id}`, icon: "🏕️", title: `${dest} — ${nights}-night trip ahead`, tag: "Long trip" });
        }
      }
    }

    const incomplete = travelEntries.entries.filter((e) => (!e.date || e.date <= todayStr) && !e.endDate);
    if (incomplete.length > 0) {
      items.push({ id: `incomplete-${incomplete.length}`, icon: "⚠️", title: `${incomplete.length} past entr${incomplete.length !== 1 ? "ies" : "y"} missing an end date`, tag: "Data" });
    }

    const todayMonth = today.getMonth();
    const todayDay = today.getDate();
    for (const entry of travelEntries.entries) {
      if (!entry.date || entry.date > todayStr) continue;
      const d = new Date(entry.date);
      if (d.getMonth() === todayMonth && d.getDate() === todayDay && d.getFullYear() !== currentYear) {
        const yearsAgo = currentYear - d.getFullYear();
        const dest = getCountryFromLocation(entry.to) || entry.country || entry.to || "Unknown";
        // Year suffix ensures the anniversary reappears each new year
        items.push({ id: `anniversary-${entry.id}-${currentYear}`, icon: "📸", title: `${yearsAgo} year${yearsAgo !== 1 ? "s" : ""} ago today: ${dest}`, tag: "Anniversary" });
      }
    }

    return items.filter((n) => !dismissedNotifIds.has(n.id));
  }, [newMilestones, filters.upcomingEntries, travelEntries.entries, dismissedNotifIds]);

  function clearAllNotifications() {
    const allAchievedIds = computeMilestones(travelEntries.entries).filter((m) => m.achieved).map((m) => m.id);
    const nextMilestones = new Set([...seenMilestoneIds, ...allAchievedIds]);
    setSeenMilestoneIds(nextMilestones);
    try { localStorage.setItem("routebook-seen-milestones", JSON.stringify([...nextMilestones])); } catch {}

    const currentIds = notifications.map((n) => n.id);
    const nextDismissed = new Set([...dismissedNotifIds, ...currentIds]);
    setDismissedNotifIds(nextDismissed);
    try { localStorage.setItem("routebook-dismissed-notifications", JSON.stringify([...nextDismissed])); } catch {}

    setNotifOpen(false);
  }
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
      const target = event.target as HTMLElement;
      if (
        !settingsMenuRef.current?.contains(target) &&
        !settingsMobilePanelRef.current?.contains(target)
      ) {
        setSettingsOpen(false);
      }
      if (
        !notifRef.current?.contains(target) &&
        !notifMobileRef.current?.contains(target)
      ) {
        setNotifOpen(false);
      }
      if (!target.closest("[data-upcoming-options-menu]")) {
        setActiveUpcomingOptionsId(null);
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
          <div className="flex items-start justify-between gap-3">
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
            {/* Mobile bell */}
            <div className="relative shrink-0 md:hidden" ref={notifMobileRef}>
              <Button variant="outline" size="icon" className="relative rounded-xl" onClick={() => setNotifOpen((prev) => !prev)} aria-label="Notifications">
                <Bell className="h-4 w-4" />
                {notifications.length > 0 && (
                  <span className="pointer-events-none absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-slate-950 text-[10px] font-bold text-white">
                    {notifications.length}
                  </span>
                )}
              </Button>
              {notifOpen && (
                <div className="absolute right-0 top-full z-30 mt-2 w-72 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                  <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                    <p className="text-sm font-semibold text-slate-800">Notifications</p>
                    {notifications.length > 0 && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">{notifications.length}</span>}
                  </div>
                  {notifications.length === 0 ? (
                    <p className="px-4 py-5 text-center text-sm text-slate-400">You&apos;re all caught up ✓</p>
                  ) : (
                    <div className="max-h-72 divide-y divide-slate-100 overflow-y-auto">
                      {notifications.map((n) => (
                        <div key={n.id} className="flex items-start gap-3 px-4 py-3">
                          <span className="mt-0.5 text-base">{n.icon}</span>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-slate-800">{n.title}</p>
                            <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{n.tag}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {newMilestones.length > 0 && (
                    <div className="border-t border-slate-100 px-4 py-3">
                      <button type="button" onClick={clearAllNotifications} className="text-xs font-semibold text-slate-500 hover:text-slate-700">
                        Clear notifications
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
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
            <div className="relative" ref={notifRef}>
              <Button variant="outline" size="icon" className="relative rounded-xl" onClick={() => setNotifOpen((prev) => !prev)} aria-label="Notifications">
                <Bell className="h-4 w-4" />
                {notifications.length > 0 && (
                  <span className="pointer-events-none absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-slate-950 text-[10px] font-bold text-white">
                    {notifications.length}
                  </span>
                )}
              </Button>
              {notifOpen && (
                <div className="absolute right-0 top-full z-30 mt-2 w-72 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                  <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                    <p className="text-sm font-semibold text-slate-800">Notifications</p>
                    {notifications.length > 0 && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">{notifications.length}</span>}
                  </div>
                  {notifications.length === 0 ? (
                    <p className="px-4 py-5 text-center text-sm text-slate-400">You&apos;re all caught up ✓</p>
                  ) : (
                    <div className="max-h-72 divide-y divide-slate-100 overflow-y-auto">
                      {notifications.map((n) => (
                        <div key={n.id} className="flex items-start gap-3 px-4 py-3">
                          <span className="mt-0.5 text-base">{n.icon}</span>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-slate-800">{n.title}</p>
                            <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{n.tag}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {newMilestones.length > 0 && (
                    <div className="border-t border-slate-100 px-4 py-3">
                      <button type="button" onClick={clearAllNotifications} className="text-xs font-semibold text-slate-500 hover:text-slate-700">
                        Clear notifications
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
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

        {filters.currentlyTravelingEntries.length > 0 && (
          <div className="animate-fade-up" style={{ animationDelay: "75ms" }}>
            <div className="rounded-[2rem] border border-emerald-200/70 bg-emerald-50/80 shadow-[0_18px_50px_rgba(15,23,42,0.06)] backdrop-blur-xl">
              <div className="flex items-center gap-3 border-b border-emerald-100 px-5 py-4">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-emerald-600">
                  <Plane className="h-3.5 w-3.5 text-white" />
                </div>
                <h2 className="text-sm font-semibold text-emerald-900">Currently traveling</h2>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                  {filters.currentlyTravelingEntries.length}
                </span>
              </div>
              <div className="divide-y divide-emerald-100">
                {filters.currentlyTravelingEntries.map((entry) => {
                  const dest = getCountryFromLocation(entry.to) || entry.country || entry.to || "Unknown";
                  const from = getCountryFromLocation(entry.from) || entry.from || "";
                  const daysLeft = Math.ceil((new Date(entry.endDate!).setHours(0,0,0,0) - new Date().setHours(0,0,0,0)) / 86400000);
                  return (
                    <div key={entry.id} className="flex items-center gap-3 px-5 py-3.5">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate font-medium text-emerald-900">{dest}</span>
                          <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                            {daysLeft === 0 ? "Ends today" : `${daysLeft} day${daysLeft !== 1 ? "s" : ""} left`}
                          </span>
                        </div>
                        <p className="mt-0.5 truncate text-xs text-emerald-700">
                          {from && `${from} → `}{prettyDate(entry.date)}{entry.endDate && entry.endDate !== entry.date ? ` – ${prettyDate(entry.endDate)}` : ""}
                          {entry.notes ? ` · ${entry.notes}` : ""}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {filters.upcomingEntries.length > 0 && (
          <div className="animate-fade-up" style={{ animationDelay: "90ms" }}>
            <div className="rounded-[2rem] border border-white/60 bg-white/75 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl">
              <button
                type="button"
                onClick={() => setUpcomingExpanded((prev) => !prev)}
                className={`flex w-full items-center gap-2.5 px-5 py-4 text-left transition-colors hover:bg-slate-50/50 ${upcomingExpanded ? "border-b border-slate-100" : ""}`}
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-slate-950">
                  <Plane className="h-3.5 w-3.5 text-white" />
                </div>
                <h2 className="text-sm font-semibold text-slate-950">Upcoming trips</h2>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500">
                  {filters.upcomingEntries.length}
                </span>
                <ChevronDown className={`ml-auto h-4 w-4 text-slate-400 transition-transform duration-200 ${upcomingExpanded ? "rotate-180" : ""}`} />
              </button>
              <div
                className="grid overflow-hidden transition-[grid-template-rows] duration-300 ease-out"
                style={{ gridTemplateRows: upcomingExpanded ? "1fr" : "0fr" }}
              >
              <div className="overflow-hidden">
              <div className="divide-y divide-slate-100">
                {filters.upcomingEntries.map((entry) => {
                  const dest = getCountryFromLocation(entry.to) || entry.country || entry.to || "Unknown";
                  const from = getCountryFromLocation(entry.from) || entry.from || "";
                  const days = Math.ceil((new Date(entry.date).setHours(0,0,0,0) - new Date().setHours(0,0,0,0)) / 86400000);
                  const badge =
                    days === 0 ? { label: "Today", cls: "bg-amber-100 text-amber-700" } :
                    days === 1 ? { label: "Tomorrow", cls: "bg-amber-100 text-amber-700" } :
                    days <= 7  ? { label: `In ${days} days`, cls: "bg-amber-100 text-amber-700" } :
                    days <= 30 ? { label: `In ${days} days`, cls: "bg-blue-100 text-blue-700" } :
                                 { label: `In ${days} days`, cls: "bg-slate-100 text-slate-600" };
                  return (
                    <div key={entry.id} className="flex items-center gap-3 px-5 py-3.5">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-900 truncate">{dest}</span>
                          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${badge.cls}`}>{badge.label}</span>
                        </div>
                        <p className="mt-0.5 text-xs text-slate-500 truncate">
                          {from && `${from} → `}{prettyDate(entry.date)}{entry.endDate && entry.endDate !== entry.date ? ` – ${prettyDate(entry.endDate)}` : ""}
                          {entry.notes ? ` · ${entry.notes}` : ""}
                        </p>
                      </div>
                      <div className="relative shrink-0" data-upcoming-options-menu>
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-xl border-slate-200 bg-white/90"
                          onClick={() => setActiveUpcomingOptionsId(activeUpcomingOptionsId === entry.id ? null : entry.id)}
                        >
                          Options <ChevronDown className="ml-1.5 h-3.5 w-3.5" />
                        </Button>
                        {activeUpcomingOptionsId === entry.id && (
                          <div className="absolute right-0 bottom-full z-30 mb-2 w-36 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg sm:bottom-auto sm:top-full sm:mb-0 sm:mt-2">
                            <Button variant="ghost" size="sm" className="h-10 w-full justify-start rounded-none px-3"
                              onClick={() => { setActiveUpcomingOptionsId(null); travelEntries.openEditModal(entry); }}>
                              <Pencil className="mr-2 h-4 w-4" /> Edit
                            </Button>
                            <Button variant="ghost" size="sm" className="h-10 w-full justify-start rounded-none px-3 text-red-600 hover:text-red-700"
                              onClick={() => { setActiveUpcomingOptionsId(null); travelEntries.deleteEntry(entry.id); }}>
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              </div>
              </div>
            </div>
          </div>
        )}

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
          <TabsList className="h-auto w-full rounded-2xl border border-slate-200/70 bg-white/80 p-1.5 backdrop-blur-sm shadow-[0_4px_20px_rgba(15,23,42,0.06)]">
            <TabsTrigger className="flex-1 rounded-xl py-2.5 font-medium text-slate-600 data-[state=active]:bg-slate-950 data-[state=active]:text-white data-[state=active]:shadow-none" value="timeline">
              <span className="md:hidden">Timeline</span><span className="hidden md:inline">Timeline view</span>
            </TabsTrigger>
            <TabsTrigger className="flex-1 rounded-xl py-2.5 font-medium text-slate-600 data-[state=active]:bg-slate-950 data-[state=active]:text-white data-[state=active]:shadow-none" value="table">
              <span className="md:hidden">Table</span><span className="hidden md:inline">Table view</span>
            </TabsTrigger>
            <TabsTrigger className="flex-1 rounded-xl py-2.5 font-medium text-slate-600 data-[state=active]:bg-slate-950 data-[state=active]:text-white data-[state=active]:shadow-none" value="map">
              <span className="md:hidden">Map</span><span className="hidden md:inline">Map mode</span>
            </TabsTrigger>
            <TabsTrigger className="flex-1 rounded-xl py-2.5 font-medium text-slate-600 data-[state=active]:bg-slate-950 data-[state=active]:text-white data-[state=active]:shadow-none" value="insights">
              Insights
            </TabsTrigger>
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
