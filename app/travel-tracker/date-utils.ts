import type { TravelEntry } from "@/app/travel-tracker/types";

export const LOCATION_SEPARATOR = " | ";

export const monthOrder = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function formatMonth(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleString("en-US", { month: "long" });
}

export function formatYear(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return Number.isNaN(d.getTime()) ? "" : String(d.getFullYear());
}

export function prettyDate(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return Number.isNaN(d.getTime())
    ? dateStr
    : d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export function prettyDateRange(startDate: string, endDate?: string): string {
  if (!startDate && !endDate) return "";
  if (!startDate) return prettyDate(endDate ?? "");
  if (!endDate || endDate === startDate) return prettyDate(startDate);
  return `${prettyDate(startDate)} -> ${prettyDate(endDate)}`;
}

export function sortEntries(entries: TravelEntry[]): TravelEntry[] {
  function toMillis(value: string): number {
    const parsed = new Date(value).getTime();
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  return [...entries].sort(
    (a, b) => toMillis(b.date || b.endDate) - toMillis(a.date || a.endDate)
  );
}

export function displayLocation(value: string): string {
  if (!value) return "-";
  const [place, country] = value.split(LOCATION_SEPARATOR);
  return country ? `${place} (${country})` : value;
}

export function getCountryFromLocation(value: string): string {
  if (!value) return "";
  const parts = value.split(LOCATION_SEPARATOR);
  if (parts.length < 2) return value.trim();
  return parts[1]?.trim() ?? "";
}

export function getEntryCountries(entry: TravelEntry): string[] {
  const fromCountry = getCountryFromLocation(entry.from);
  const toCountry = getCountryFromLocation(entry.to);
  const fallbackCountry = (entry.country || "").trim();
  return [...new Set([fromCountry, toCountry, fallbackCountry].filter(Boolean))];
}
