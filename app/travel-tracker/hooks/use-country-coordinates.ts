import { useEffect, useState } from "react";
import { MAP_SEARCH_ALIASES } from "@/app/travel-tracker/countries";

export interface CachedPoint {
  lat: number;
  lng: number;
}

const CACHE_KEY = "routebook-country-coordinates-v1";

function parseCache(): Record<string, CachedPoint> {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return {};
    return (JSON.parse(raw) as Record<string, CachedPoint>) ?? {};
  } catch {
    return {};
  }
}

function saveCache(cache: Record<string, CachedPoint>): void {
  localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
}

async function resolveCountryPoint(country: string): Promise<CachedPoint | null> {
  const variants = [country, ...(MAP_SEARCH_ALIASES[country] ?? [])];

  for (const variant of variants) {
    const fullTextResponse = await fetch(
      `https://restcountries.com/v3.1/name/${encodeURIComponent(variant)}?fullText=true&fields=latlng`
    );
    if (fullTextResponse.ok) {
      const payload = (await fullTextResponse.json()) as Array<{ latlng?: [number, number] }>;
      const latlng = payload?.[0]?.latlng;
      if (latlng && latlng.length === 2) return { lat: latlng[0], lng: latlng[1] };
    }

    const looseResponse = await fetch(
      `https://restcountries.com/v3.1/name/${encodeURIComponent(variant)}?fields=latlng`
    );
    if (looseResponse.ok) {
      const payload = (await looseResponse.json()) as Array<{ latlng?: [number, number] }>;
      const latlng = payload?.[0]?.latlng;
      if (latlng && latlng.length === 2) return { lat: latlng[0], lng: latlng[1] };
    }
  }

  return null;
}

export function useCountryCoordinates(countryCounts: Record<string, number>) {
  const [coordinates, setCoordinates] = useState<Record<string, CachedPoint>>({});
  const [resolving, setResolving] = useState(false);

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
        if (point) nextCache[country] = point;
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

  return { coordinates, resolving };
}
