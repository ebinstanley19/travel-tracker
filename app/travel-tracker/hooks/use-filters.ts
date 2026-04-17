import { useMemo, useState } from "react";
import type { TravelEntry, YearMonthGroup } from "@/app/travel-tracker/types";
import { formatMonth, formatYear, getCountryFromLocation, getEntryCountries, monthOrder, sortEntries } from "@/app/travel-tracker/utils";

function getVisitedCountry(entry: TravelEntry): string {
  const toCountry = getCountryFromLocation(entry.to);
  if (toCountry) return toCountry;
  return (entry.country || "").trim();
}

interface Stats {
  uniqueCountries: number;
  totalTrips: number;
  yearsCovered: number;
  topCountry: string;
  topCountryVisits: number;
}

export function useFilters({ entries, homeCountry = "" }: { entries: TravelEntry[]; homeCountry?: string }) {
  const [search, setSearch] = useState("");
  const [countryFilter, setCountryFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");

  const countries = useMemo(
    () => [...new Set(entries.flatMap((entry) => getEntryCountries(entry)))].sort(),
    [entries]
  );

  const years = useMemo(
    () =>
      [...new Set(entries.map((e) => formatYear(e.date || e.endDate)).filter(Boolean))].sort(
        (a, b) => Number(b) - Number(a)
      ),
    [entries]
  );

  const filtered = useMemo(
    () =>
      sortEntries(
        entries.filter((entry) => {
          const blob =
            `${entry.date} ${entry.endDate} ${entry.from} ${entry.to} ${entry.country} ${entry.purpose} ${entry.notes}`.toLowerCase();
          const matchesSearch = blob.includes(search.toLowerCase());
          const matchesCountry =
            countryFilter === "all" || getEntryCountries(entry).includes(countryFilter);
          const matchesYear =
            yearFilter === "all" || formatYear(entry.date || entry.endDate) === yearFilter;
          return matchesSearch && matchesCountry && matchesYear;
        })
      ),
    [entries, search, countryFilter, yearFilter]
  );

  const groupedByYearMonth = useMemo<YearMonthGroup[]>(() => {
    const grouped: Record<string, Record<string, TravelEntry[]>> = {};
    filtered.forEach((entry) => {
      const anchorDate = entry.date || entry.endDate;
      const year = formatYear(anchorDate) || "Unknown Year";
      const month = formatMonth(anchorDate) || "Unknown Month";
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
      months: [...monthOrder]
        .reverse()
        .filter((month) => grouped[year][month])
        .map((month) => ({ month, items: sortEntries(grouped[year][month]) })),
    }));
  }, [filtered]);

  const stats = useMemo<Stats>(() => {
    const normalizedHomeCountry = homeCountry.trim();
    const uniqueCountries = new Set(entries.flatMap((entry) => getEntryCountries(entry))).size;
    const totalTrips = entries.length;
    const yearsCovered = new Set(
      entries.map((e) => formatYear(e.date || e.endDate)).filter(Boolean)
    ).size;

    const countryCounts = entries.reduce<Record<string, number>>((acc, item) => {
      const visitedCountry = getVisitedCountry(item);
      if (!visitedCountry) return acc;
      if (normalizedHomeCountry && visitedCountry === normalizedHomeCountry) return acc;
      acc[visitedCountry] = (acc[visitedCountry] || 0) + 1;
      return acc;
    }, {});

    const topCountryEntry = Object.entries(countryCounts).sort((a, b) => b[1] - a[1])[0];
    return {
      uniqueCountries,
      totalTrips,
      yearsCovered,
      topCountry: topCountryEntry?.[0] || "-",
      topCountryVisits: topCountryEntry?.[1] || 0,
    };
  }, [entries, homeCountry]);

  return {
    search,
    countryFilter,
    yearFilter,
    setSearch,
    setCountryFilter,
    setYearFilter,
    countries,
    years,
    filtered,
    groupedByYearMonth,
    stats,
  };
}
