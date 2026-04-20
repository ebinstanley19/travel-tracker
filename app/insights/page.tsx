"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Award, Globe, Map, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CONTINENT_MAP } from "@/app/travel-tracker/continents";
import { computeMilestones } from "@/app/travel-tracker/milestones";
import { supabase } from "@/lib/supabase";
import { getCountryFromLocation, getEntryCountries, prettyDate } from "@/app/travel-tracker/utils";
import type { TravelEntry } from "@/app/travel-tracker/types";

interface InsightStats {
  totalTrips: number;
  uniqueCountries: number;
  uniqueContinents: number;
  totalNights: number;
  avgTripLength: number;
  tripsByYear: { year: string; count: number }[];
  topCountries: { country: string; count: number }[];
  tripsByMonth: { month: string; count: number }[];
  continentBreakdown: { continent: string; count: number; pct: number }[];
  longestTrip: { entry: TravelEntry; nights: number } | null;
  mostRecentDest: string;
  mostVisitedCountry: string;
  firstTrip: TravelEntry | null;
  yearsCovered: number;
}

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function computeStats(entries: TravelEntry[]): InsightStats {
  const totalTrips = entries.length;

  const allCountries = entries.flatMap((e) => getEntryCountries(e));
  const uniqueCountries = new Set(allCountries).size;

  const continents = new Set(allCountries.map((c) => CONTINENT_MAP[c]).filter(Boolean));
  const uniqueContinents = continents.size;

  let totalNights = 0;
  let longestTrip: { entry: TravelEntry; nights: number } | null = null;
  for (const entry of entries) {
    if (entry.date && entry.endDate && entry.date !== entry.endDate) {
      const nights = Math.round(
        (new Date(entry.endDate).getTime() - new Date(entry.date).getTime()) / (1000 * 60 * 60 * 24)
      );
      if (nights > 0) {
        totalNights += nights;
        if (!longestTrip || nights > longestTrip.nights) {
          longestTrip = { entry, nights };
        }
      }
    }
  }
  const avgTripLength = totalTrips > 0 ? Math.round(totalNights / totalTrips) : 0;

  // Trips by year
  const yearMap: Record<string, number> = {};
  for (const entry of entries) {
    const d = entry.date || entry.endDate;
    if (!d) continue;
    const year = String(new Date(d).getFullYear());
    yearMap[year] = (yearMap[year] || 0) + 1;
  }
  const tripsByYear = Object.entries(yearMap)
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .map(([year, count]) => ({ year, count }));

  // Top countries (by "to" country)
  const countryMap: Record<string, number> = {};
  for (const entry of entries) {
    const country = getCountryFromLocation(entry.to) || entry.country;
    if (country) countryMap[country] = (countryMap[country] || 0) + 1;
  }
  const topCountries = Object.entries(countryMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([country, count]) => ({ country, count }));

  // Trips by calendar month
  const monthMap: Record<number, number> = {};
  for (const entry of entries) {
    const d = entry.date || entry.endDate;
    if (!d) continue;
    const m = new Date(d).getMonth();
    monthMap[m] = (monthMap[m] || 0) + 1;
  }
  const tripsByMonth = MONTH_NAMES.map((month, i) => ({ month, count: monthMap[i] || 0 }));

  // Continent breakdown
  const continentMap: Record<string, number> = {};
  for (const entry of entries) {
    const toCountry = getCountryFromLocation(entry.to) || entry.country;
    const continent = CONTINENT_MAP[toCountry];
    if (continent) continentMap[continent] = (continentMap[continent] || 0) + 1;
  }
  const totalContTrips = Object.values(continentMap).reduce((a, b) => a + b, 0);
  const continentBreakdown = Object.entries(continentMap)
    .sort((a, b) => b[1] - a[1])
    .map(([continent, count]) => ({
      continent,
      count,
      pct: totalContTrips > 0 ? Math.round((count / totalContTrips) * 100) : 0,
    }));

  // Most recent destination
  const sorted = [...entries].sort(
    (a, b) => new Date(b.date || b.endDate).getTime() - new Date(a.date || a.endDate).getTime()
  );
  const mostRecentDest = sorted[0]
    ? getCountryFromLocation(sorted[0].to) || sorted[0].country || "-"
    : "-";

  // Most visited country
  const mostVisitedEntry = Object.entries(countryMap).sort((a, b) => b[1] - a[1])[0];
  const mostVisitedCountry = mostVisitedEntry?.[0] || "-";

  // First trip
  const firstTrip = sorted[sorted.length - 1] || null;

  // Years covered
  const years = new Set(entries.map((e) => {
    const d = e.date || e.endDate;
    return d ? String(new Date(d).getFullYear()) : "";
  }).filter(Boolean));
  const yearsCovered = years.size;

  return {
    totalTrips, uniqueCountries, uniqueContinents, totalNights, avgTripLength,
    tripsByYear, topCountries, tripsByMonth, continentBreakdown,
    longestTrip, mostRecentDest, mostVisitedCountry, firstTrip, yearsCovered,
  };
}


function HorizBar({ value, max, color = "bg-slate-800" }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.max(2, Math.round((value / max) * 100)) : 0;
  return (
    <div className="h-2.5 w-full rounded-full bg-slate-100">
      <div className={`h-2.5 rounded-full ${color} transition-all duration-500`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function InsightsPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<TravelEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/"); return; }

      const { data } = await supabase
        .from("travel_records")
        .select("id,date,end_date,from,to,country,purpose,notes")
        .eq("user_id", user.id);

      if (data) {
        setEntries(
          (data as Array<{ id: string; date: string | null; end_date: string | null; from: string | null; to: string | null; country: string | null; purpose: string | null; notes: string | null }>).map((r) => ({
            id: r.id,
            date: r.date ?? "",
            endDate: r.end_date ?? "",
            from: r.from ?? "",
            to: r.to ?? "",
            country: r.country ?? "",
            purpose: r.purpose ?? "",
            notes: r.notes ?? "",
          }))
        );
      }
      setLoading(false);
    }
    void load();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen p-4 md:p-8">
        <div className="mx-auto max-w-3xl space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl bg-white/70" />
          ))}
        </div>
      </div>
    );
  }

  const stats = computeStats(entries);
  const milestones = computeMilestones(entries);
  const maxYearCount = Math.max(...stats.tripsByYear.map((y) => y.count), 1);
  const maxCountryCount = Math.max(...stats.topCountries.map((c) => c.count), 1);
  const maxMonthCount = Math.max(...stats.tripsByMonth.map((m) => m.count), 1);

  const cardCls = "rounded-2xl border border-white/60 bg-white/80 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl";

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="mx-auto max-w-3xl space-y-6">

        <div className={`flex items-center justify-between p-5 ${cardCls}`}>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Insights</h1>
            <p className="mt-1 text-sm text-muted-foreground">A deep look at your travel history.</p>
          </div>
          <Button asChild variant="outline">
            <Link href="/"><ArrowLeft className="mr-2 h-4 w-4" />Dashboard</Link>
          </Button>
        </div>

        {/* At a glance */}
        <Card className={cardCls}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Globe className="h-4 w-4 text-muted-foreground" /> At a glance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {[
                { label: "Total trips", value: stats.totalTrips },
                { label: "Countries visited", value: stats.uniqueCountries },
                { label: "Continents", value: stats.uniqueContinents },
                { label: "Total nights abroad", value: stats.totalNights },
                { label: "Avg trip length", value: stats.avgTripLength > 0 ? `${stats.avgTripLength}n` : "—" },
                { label: "Years of travel", value: stats.yearsCovered },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
                  <p className="mt-1 text-2xl font-bold tabular-nums tracking-tight text-slate-900">{value}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Trips by year */}
        {stats.tripsByYear.length > 0 && (
          <Card className={cardCls}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><TrendingUp className="h-4 w-4 text-muted-foreground" /> Trips by year</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {stats.tripsByYear.map(({ year, count }) => (
                <div key={year} className="flex items-center gap-3">
                  <span className="w-12 text-right text-sm font-semibold tabular-nums text-slate-700">{year}</span>
                  <div className="flex-1">
                    <HorizBar value={count} max={maxYearCount} color="bg-slate-800" />
                  </div>
                  <span className="w-6 text-right text-sm tabular-nums text-slate-500">{count}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Top countries */}
        {stats.topCountries.length > 0 && (
          <Card className={cardCls}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Map className="h-4 w-4 text-muted-foreground" /> Top 10 countries</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {stats.topCountries.map(({ country, count }) => (
                <div key={country} className="flex items-center gap-3">
                  <span className="w-32 truncate text-sm font-medium text-slate-700">{country}</span>
                  <div className="flex-1">
                    <HorizBar value={count} max={maxCountryCount} color="bg-blue-500" />
                  </div>
                  <span className="w-6 text-right text-sm tabular-nums text-slate-500">{count}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Busiest months */}
        {stats.totalTrips > 0 && (
          <Card className={cardCls}>
            <CardHeader>
              <CardTitle>Busiest months</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-6 gap-2 sm:grid-cols-12">
                {stats.tripsByMonth.map(({ month, count }) => {
                  const pct = maxMonthCount > 0 ? Math.max(4, Math.round((count / maxMonthCount) * 100)) : 4;
                  return (
                    <div key={month} className="flex flex-col items-center gap-1">
                      <div className="flex h-16 w-full items-end justify-center">
                        <div
                          className="w-full max-w-[20px] rounded-t-sm bg-amber-400 transition-all duration-500"
                          style={{ height: count > 0 ? `${pct}%` : "4px", opacity: count > 0 ? 1 : 0.2 }}
                        />
                      </div>
                      <span className="text-[10px] font-medium text-slate-500">{month}</span>
                      {count > 0 && <span className="text-[10px] tabular-nums text-slate-400">{count}</span>}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Continent breakdown */}
        {stats.continentBreakdown.length > 0 && (
          <Card className={cardCls}>
            <CardHeader>
              <CardTitle>Continent breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {stats.continentBreakdown.map(({ continent, count, pct }) => (
                <div key={continent} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700">{continent}</span>
                    <span className="text-sm tabular-nums text-slate-500">{count} trip{count !== 1 ? "s" : ""} · {pct}%</span>
                  </div>
                  <HorizBar value={pct} max={100} color="bg-emerald-500" />
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Personal records */}
        {stats.totalTrips > 0 && (
          <Card className={cardCls}>
            <CardHeader>
              <CardTitle>Personal records</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Longest trip</p>
                {stats.longestTrip ? (
                  <>
                    <p className="mt-1 text-base font-semibold text-slate-900">
                      {getCountryFromLocation(stats.longestTrip.entry.to) || stats.longestTrip.entry.country || "—"}
                    </p>
                    <p className="text-sm text-slate-500">{stats.longestTrip.nights} nights</p>
                  </>
                ) : <p className="mt-1 text-sm text-slate-400">No multi-day trips yet</p>}
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Most recent destination</p>
                <p className="mt-1 text-base font-semibold text-slate-900">{stats.mostRecentDest}</p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Most visited country</p>
                <p className="mt-1 text-base font-semibold text-slate-900">{stats.mostVisitedCountry}</p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">First recorded trip</p>
                {stats.firstTrip ? (
                  <>
                    <p className="mt-1 text-base font-semibold text-slate-900">
                      {getCountryFromLocation(stats.firstTrip.to) || stats.firstTrip.country || "—"}
                    </p>
                    <p className="text-sm text-slate-500">{prettyDate(stats.firstTrip.date)}</p>
                  </>
                ) : <p className="mt-1 text-sm text-slate-400">—</p>}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Milestones */}
        <Card className={cardCls}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Award className="h-4 w-4 text-muted-foreground" /> Milestones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {milestones.map(({ id, label, achieved, icon }) => (
                <div
                  key={id}
                  className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors ${
                    achieved
                      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                      : "border-slate-100 bg-slate-50/50 text-slate-400"
                  }`}
                >
                  <span className={achieved ? "" : "grayscale opacity-40"}>{icon}</span>
                  {label}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
