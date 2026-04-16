"use client";

import { useEffect, useMemo, useState } from "react";
import { Globe2 } from "lucide-react";
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TravelEntry } from "@/app/travel-tracker/types";

interface MapViewClientProps {
  entries: TravelEntry[];
  selectedCountry: string;
  onCountrySelect: (country: string) => void;
}

interface CountryPoint {
  country: string;
  count: number;
  lat: number;
  lng: number;
  cities: string[];
}

interface CachedPoint {
  lat: number;
  lng: number;
}

function countryCacheKey(): string {
  return "routebook-country-coordinates-v1";
}

function parseCache(): Record<string, CachedPoint> {
  try {
    const raw = localStorage.getItem(countryCacheKey());
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, CachedPoint>;
    return parsed ?? {};
  } catch {
    return {};
  }
}

function saveCache(cache: Record<string, CachedPoint>): void {
  localStorage.setItem(countryCacheKey(), JSON.stringify(cache));
}

function countryAliases(name: string): string[] {
  const aliasMap: Record<string, string[]> = {
    "United States": ["United States of America", "USA"],
    "United Kingdom": ["UK", "Great Britain"],
    "South Korea": ["Korea, Republic of", "Republic of Korea"],
    "North Korea": ["Korea, Democratic People's Republic of"],
    "Russia": ["Russian Federation"],
    "Vietnam": ["Viet Nam"],
    "Czechia": ["Czech Republic"],
    "Türkiye": ["Turkey"],
    "Iran": ["Iran, Islamic Republic of"],
    "Syria": ["Syrian Arab Republic"],
    "Laos": ["Lao People's Democratic Republic"],
    "Moldova": ["Moldova, Republic of"],
    "Bolivia": ["Bolivia, Plurinational State of"],
    "Tanzania": ["Tanzania, United Republic of"],
    "Venezuela": ["Venezuela, Bolivarian Republic of"],
  };

  return [name, ...(aliasMap[name] ?? [])];
}

async function resolveCountryPoint(country: string): Promise<CachedPoint | null> {
  const variants = countryAliases(country);

  for (const variant of variants) {
    const fullTextResponse = await fetch(`https://restcountries.com/v3.1/name/${encodeURIComponent(variant)}?fullText=true&fields=latlng`);
    if (fullTextResponse.ok) {
      const payload = (await fullTextResponse.json()) as Array<{ latlng?: [number, number] }>;
      const latlng = payload?.[0]?.latlng;
      if (latlng && latlng.length === 2) {
        return { lat: latlng[0], lng: latlng[1] };
      }
    }

    const looseResponse = await fetch(`https://restcountries.com/v3.1/name/${encodeURIComponent(variant)}?fields=latlng`);
    if (looseResponse.ok) {
      const payload = (await looseResponse.json()) as Array<{ latlng?: [number, number] }>;
      const latlng = payload?.[0]?.latlng;
      if (latlng && latlng.length === 2) {
        return { lat: latlng[0], lng: latlng[1] };
      }
    }
  }

  return null;
}

function FitMapToPoints({ points }: { points: CountryPoint[] }) {
  const map = useMap();

  useEffect(() => {
    if (points.length === 0) return;

    if (points.length === 1) {
      map.setView([points[0].lat, points[0].lng], 4, { animate: true });
      return;
    }

    const bounds = points.map((point) => [point.lat, point.lng] as [number, number]);
    map.fitBounds(bounds, { padding: [36, 36], animate: true, maxZoom: 5 });
  }, [map, points]);

  return null;
}

export function MapViewClient({ entries, selectedCountry, onCountrySelect }: MapViewClientProps) {
  const [coordinates, setCoordinates] = useState<Record<string, CachedPoint>>({});
  const [resolving, setResolving] = useState(false);

  const countryCounts = useMemo(() => entries.reduce<Record<string, number>>((acc, entry) => {
    if (!entry.country) return acc;
    acc[entry.country] = (acc[entry.country] || 0) + 1;
    return acc;
  }, {}), [entries]);

  const citiesByCountry = useMemo(() => entries.reduce<Record<string, string[]>>((acc, entry) => {
    if (!entry.country || !entry.purpose) return acc;
    if (!acc[entry.country]) acc[entry.country] = [];
    if (!acc[entry.country].includes(entry.purpose)) {
      acc[entry.country].push(entry.purpose);
    }
    return acc;
  }, {}), [entries]);

  useEffect(() => {
    const cache = parseCache();
    setCoordinates(cache);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function hydrateCoordinates() {
      const countries = Object.keys(countryCounts);
      if (countries.length === 0) return;

      const existing = parseCache();
      const missing = countries.filter((country) => !existing[country]);
      if (missing.length === 0) {
        if (!cancelled) setCoordinates(existing);
        return;
      }

      setResolving(true);
      const nextCache = { ...existing };

      for (const country of missing) {
        const point = await resolveCountryPoint(country);
        if (point) {
          nextCache[country] = point;
        }
      }

      if (cancelled) return;
      saveCache(nextCache);
      setCoordinates(nextCache);
      setResolving(false);
    }

    void hydrateCoordinates();

    return () => {
      cancelled = true;
    };
  }, [countryCounts]);

  const points = useMemo<CountryPoint[]>(() => {
    return Object.entries(countryCounts)
      .map(([country, count]) => {
        const point = coordinates[country];
        if (!point) return null;
        return {
          country,
          count,
          lat: point.lat,
          lng: point.lng,
          cities: citiesByCountry[country] ?? [],
        };
      })
      .filter((item): item is CountryPoint => Boolean(item))
      .sort((a, b) => b.count - a.count);
  }, [countryCounts, coordinates, citiesByCountry]);

  const topCountries = points.slice(0, 8);

  return (
    <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
      <Card className="overflow-hidden rounded-[2rem] border-white/60 bg-white/75 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl">
        <CardHeader className="border-b border-slate-200/80 bg-white/70">
          <CardTitle className="flex items-center gap-2 text-xl font-semibold tracking-[-0.03em] text-slate-950">
            <Globe2 className="h-5 w-5 text-sky-700" /> Real Map Mode
          </CardTitle>
          <p className="text-sm text-slate-600">Pinned on a real world map. Click a bubble to filter timeline/table by country.</p>
        </CardHeader>
        <CardContent className="p-4 md:p-6">
          <div className="overflow-hidden rounded-[1.4rem] border border-slate-200">
            <MapContainer center={[15, 10]} zoom={2} minZoom={2} maxZoom={6} className="h-[420px] w-full">
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <FitMapToPoints points={points} />
              {points.map((point) => (
                <CircleMarker
                  key={point.country}
                  center={[point.lat, point.lng]}
                  radius={Math.min(9 + point.count * 1.8, 22)}
                  eventHandlers={{ click: () => onCountrySelect(point.country) }}
                  pathOptions={{
                    color: selectedCountry === point.country ? "#b45309" : "#0f4c81",
                    fillColor: selectedCountry === point.country ? "#f59e0b" : "#1d7fd6",
                    fillOpacity: 0.65,
                    weight: 2,
                  }}
                >
                  <Popup>
                    <p className="font-semibold">{point.country}</p>
                    <p>{point.count} visit{point.count > 1 ? "s" : ""}</p>
                    {point.cities.length > 0 ? (
                      <p className="mt-1 text-xs text-slate-600">Cities: {point.cities.slice(0, 4).join(", ")}</p>
                    ) : null}
                  </Popup>
                </CircleMarker>
              ))}
            </MapContainer>
          </div>
          {resolving ? <p className="mt-3 text-xs text-slate-500">Resolving country coordinates...</p> : null}
        </CardContent>
      </Card>

      <Card className="rounded-[2rem] border-white/60 bg-white/75 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold tracking-[-0.02em] text-slate-950">Top Countries</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {selectedCountry !== "all" ? (
            <Button variant="outline" size="sm" className="mb-1" onClick={() => onCountrySelect("all")}>Clear country filter</Button>
          ) : null}
          {topCountries.length > 0 ? topCountries.map((item, index) => (
            <button key={item.country} className={`w-full rounded-xl border px-3 py-2 text-left text-sm ${selectedCountry === item.country ? "border-amber-300 bg-amber-50/70" : "border-slate-200/80 bg-slate-50/70"}`} onClick={() => onCountrySelect(item.country)}>
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-700">#{index + 1} {item.country}</span>
                <span className="text-slate-500">{item.count} visits</span>
              </div>
              {item.cities.length > 0 ? <p className="mt-1 text-xs text-slate-500">{item.cities.slice(0, 3).join(", ")}</p> : null}
            </button>
          )) : <p className="text-sm text-slate-500">No countries yet.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
