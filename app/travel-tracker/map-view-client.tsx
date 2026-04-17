"use client";

import { useEffect, useMemo } from "react";
import { Globe2 } from "lucide-react";
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TravelEntry } from "@/app/travel-tracker/types";
import { getEntryCountries } from "@/app/travel-tracker/date-utils";
import { useCountryCoordinates } from "@/app/travel-tracker/hooks/use-country-coordinates";

interface MapViewClientProps {
  entries: TravelEntry[];
  selectedCountry: string;
  homeCountry?: string;
  onCountrySelect: (country: string) => void;
}

interface CountryPoint {
  country: string;
  count: number;
  lat: number;
  lng: number;
  cities: string[];
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

export function MapViewClient({ entries, selectedCountry, homeCountry = "", onCountrySelect }: MapViewClientProps) {
  const countryCounts = useMemo(
    () =>
      entries.reduce<Record<string, number>>((acc, entry) => {
        getEntryCountries(entry).forEach((country) => {
          acc[country] = (acc[country] || 0) + 1;
        });
        return acc;
      }, {}),
    [entries]
  );

  const citiesByCountry = useMemo(
    () =>
      entries.reduce<Record<string, string[]>>((acc, entry) => {
        if (!entry.purpose) return acc;

        getEntryCountries(entry).forEach((country) => {
          if (!acc[country]) acc[country] = [];
          if (!acc[country].includes(entry.purpose)) {
            acc[country].push(entry.purpose);
          }
        });
        return acc;
      }, {}),
    [entries]
  );

  const { coordinates, resolving } = useCountryCoordinates(countryCounts);

  const points = useMemo<CountryPoint[]>(
    () =>
      Object.entries(countryCounts)
        .map(([country, count]) => {
          const point = coordinates[country];
          if (!point) return null;
          return { country, count, lat: point.lat, lng: point.lng, cities: citiesByCountry[country] ?? [] };
        })
        .filter((item): item is CountryPoint => Boolean(item))
        .sort((a, b) => b.count - a.count),
    [countryCounts, coordinates, citiesByCountry]
  );

  const topCountries = points.filter((point) => point.country !== homeCountry.trim()).slice(0, 8);

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
            <button
              key={item.country}
              className={`w-full rounded-xl border px-3 py-2 text-left text-sm ${selectedCountry === item.country ? "border-amber-300 bg-amber-50/70" : "border-slate-200/80 bg-slate-50/70"}`}
              onClick={() => onCountrySelect(item.country)}
            >
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
