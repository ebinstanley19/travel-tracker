import { CONTINENT_MAP } from "@/app/travel-tracker/continents";
import { getEntryCountries } from "@/app/travel-tracker/utils";
import type { TravelEntry } from "@/app/travel-tracker/types";

export interface Milestone {
  id: string;
  label: string;
  icon: string;
  achieved: boolean;
}

export function computeMilestones(entries: TravelEntry[]): Milestone[] {
  const totalTrips = entries.length;

  const allCountries = entries.flatMap((e) => getEntryCountries(e));
  const uniqueCountries = new Set(allCountries).size;
  const uniqueContinents = new Set(allCountries.map((c) => CONTINENT_MAP[c]).filter(Boolean)).size;

  let totalNights = 0;
  let longestNights = 0;
  for (const entry of entries) {
    if (entry.date && entry.endDate && entry.date !== entry.endDate) {
      const nights = Math.round(
        (new Date(entry.endDate).getTime() - new Date(entry.date).getTime()) / 86400000,
      );
      if (nights > 0) {
        totalNights += nights;
        if (nights > longestNights) longestNights = nights;
      }
    }
  }

  const yearsCovered = new Set(
    entries
      .map((e) => {
        const d = e.date || e.endDate;
        return d ? String(new Date(d).getFullYear()) : "";
      })
      .filter(Boolean),
  ).size;

  return [
    { id: "first-trip",      label: "First trip logged",            icon: "🛫", achieved: totalTrips >= 1 },
    { id: "trips-10",        label: "10 trips",                     icon: "✈️", achieved: totalTrips >= 10 },
    { id: "trips-25",        label: "25 trips",                     icon: "✈️", achieved: totalTrips >= 25 },
    { id: "trips-50",        label: "50 trips",                     icon: "✈️", achieved: totalTrips >= 50 },
    { id: "trips-100",       label: "100 trips",                    icon: "🚀", achieved: totalTrips >= 100 },
    { id: "trips-200",       label: "200 trips",                    icon: "🚀", achieved: totalTrips >= 200 },
    { id: "trips-500",       label: "500 trips",                    icon: "🏆", achieved: totalTrips >= 500 },
    { id: "countries-5",     label: "5 countries",                  icon: "🌍", achieved: uniqueCountries >= 5 },
    { id: "countries-10",    label: "10 countries",                 icon: "🌍", achieved: uniqueCountries >= 10 },
    { id: "countries-25",    label: "25 countries",                 icon: "🌍", achieved: uniqueCountries >= 25 },
    { id: "countries-50",    label: "50 countries",                 icon: "🌏", achieved: uniqueCountries >= 50 },
    { id: "countries-75",    label: "75 countries",                 icon: "🌏", achieved: uniqueCountries >= 75 },
    { id: "countries-100",   label: "Century Club (100 countries)", icon: "👑", achieved: uniqueCountries >= 100 },
    { id: "continents-3",    label: "3 continents",                 icon: "🗺️", achieved: uniqueContinents >= 3 },
    { id: "continents-5",    label: "5 continents",                 icon: "🗺️", achieved: uniqueContinents >= 5 },
    { id: "continents-6",    label: "All 6 continents",             icon: "🌐", achieved: uniqueContinents >= 6 },
    { id: "continents-7",    label: "All 7 continents",             icon: "🌐", achieved: uniqueContinents >= 7 },
    { id: "nights-30",       label: "30 nights abroad",             icon: "🌙", achieved: totalNights >= 30 },
    { id: "nights-100",      label: "100 nights abroad",            icon: "🌙", achieved: totalNights >= 100 },
    { id: "nights-365",      label: "A full year abroad",           icon: "⭐", achieved: totalNights >= 365 },
    { id: "years-3",         label: "3 years of travel",            icon: "📅", achieved: yearsCovered >= 3 },
    { id: "years-5",         label: "5 years of travel",            icon: "📅", achieved: yearsCovered >= 5 },
    { id: "years-10",        label: "10 years of travel",           icon: "🏆", achieved: yearsCovered >= 10 },
    { id: "long-haul-14",    label: "14-night trip",                icon: "🏕️", achieved: longestNights >= 14 },
    { id: "long-haul-30",    label: "30-night trip",                icon: "🏔️", achieved: longestNights >= 30 },
  ];
}
