import { useMemo, useState } from "react";
import type { TravelEntry, YearMonthGroup } from "@/app/travel-tracker/types";
import { CONTINENT_MAP } from "@/app/travel-tracker/continents";
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
  const [continentFilter, setContinentFilter] = useState("all");
  const [fromDateFilter, setFromDateFilter] = useState("");
  const [toDateFilter, setToDateFilter] = useState("");

  const countries = useMemo(() => {
    const allCountries = [...new Set(entries.flatMap((entry) => getEntryCountries(entry)))].sort();
    if (continentFilter === "all") return allCountries;
    return allCountries.filter((c) => CONTINENT_MAP[c] === continentFilter);
  }, [entries, continentFilter]);

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

          const entryCountries = getEntryCountries(entry);
          const matchesCountry =
            countryFilter === "all" || entryCountries.includes(countryFilter);

          const matchesYear =
            yearFilter === "all" || formatYear(entry.date || entry.endDate) === yearFilter;

          const matchesContinent =
            continentFilter === "all" ||
            entryCountries.some((c) => CONTINENT_MAP[c] === continentFilter);

          let matchesDateRange = true;
          if (fromDateFilter || toDateFilter) {
            const entryStart = entry.date ? new Date(entry.date).getTime() : null;
            const entryEnd = entry.endDate ? new Date(entry.endDate).getTime() : entryStart;
            const rangeStart = fromDateFilter ? new Date(fromDateFilter).getTime() : null;
            const rangeEnd = toDateFilter ? new Date(toDateFilter).getTime() : null;
            if (entryStart !== null && entryEnd !== null) {
              if (rangeStart !== null && entryEnd < rangeStart) matchesDateRange = false;
              if (rangeEnd !== null && entryStart > rangeEnd) matchesDateRange = false;
            }
          }

          return matchesSearch && matchesCountry && matchesYear && matchesContinent && matchesDateRange;
        })
      ),
    [entries, search, countryFilter, yearFilter, continentFilter, fromDateFilter, toDateFilter]
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
    continentFilter,
    fromDateFilter,
    toDateFilter,
    setSearch,
    setCountryFilter,
    setYearFilter,
    setContinentFilter,
    setFromDateFilter,
    setToDateFilter,
    countries,
    years,
    filtered,
    groupedByYearMonth,
    stats,
  };
}
