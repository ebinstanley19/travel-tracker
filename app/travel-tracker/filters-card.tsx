import { Search, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface FiltersCardProps {
  search: string;
  countryFilter: string;
  yearFilter: string;
  fromDateFilter: string;
  toDateFilter: string;
  countries: string[];
  years: string[];
  onSearchChange: (value: string) => void;
  onCountryChange: (value: string) => void;
  onYearChange: (value: string) => void;
  onFromDateChange: (value: string) => void;
  onToDateChange: (value: string) => void;
}

const labelCls = "text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500";
const controlCls = "mt-2 h-11 rounded-2xl border-slate-200/80 bg-white/80 shadow-none";

export function FiltersCard({
  search,
  countryFilter,
  yearFilter,
  fromDateFilter,
  toDateFilter,
  countries,
  years,
  onSearchChange,
  onCountryChange,
  onYearChange,
  onFromDateChange,
  onToDateChange,
}: FiltersCardProps) {
  const hasActiveFilters =
    search !== "" ||
    countryFilter !== "all" ||
    yearFilter !== "all" ||
    fromDateFilter !== "" ||
    toDateFilter !== "";

  function clearAll() {
    onSearchChange("");
    onCountryChange("all");
    onYearChange("all");
    onFromDateChange("");
    onToDateChange("");
  }

  return (
    <Card className="rounded-[2rem] border-white/60 bg-white/75 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl">
      <CardContent className="p-5 md:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-950 md:text-xl">Filters</h2>
          {hasActiveFilters ? (
            <button
              type="button"
              onClick={clearAll}
              className="flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-500 transition-colors hover:border-slate-300 hover:text-slate-700"
            >
              <X className="h-3 w-3" /> Clear all
            </button>
          ) : (
            <p className="text-xs font-medium text-slate-500 md:text-sm">Find trips in seconds</p>
          )}
        </div>

        {/* All filters — 2-col grid on mobile, single row on sm+ */}
        <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-row">
          <div className="col-span-2 sm:flex-1 min-w-0">
            <Label className={labelCls}>Search</Label>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Country, city, or notes…"
                className="h-11 rounded-2xl border-slate-200/80 bg-white/80 pl-9 shadow-none"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => onSearchChange("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-slate-700"
                  aria-label="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
          <div className="sm:flex-1 min-w-0">
            <Label className={labelCls}>Country</Label>
            <Select value={countryFilter} onValueChange={onCountryChange}>
              <SelectTrigger className={controlCls}><SelectValue placeholder="All countries" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All countries</SelectItem>
                {countries.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="sm:flex-1 min-w-0">
            <Label className={labelCls}>Year</Label>
            <Select value={yearFilter} onValueChange={onYearChange}>
              <SelectTrigger className={controlCls}><SelectValue placeholder="All years" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All years</SelectItem>
                {years.map((y) => (
                  <SelectItem key={y} value={y}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2 sm:flex-1 min-w-0">
            <Label className={labelCls}>From date</Label>
            <div className="mt-2 flex min-w-0 items-center gap-1">
              <Input
                type="date"
                value={fromDateFilter}
                onChange={(e) => onFromDateChange(e.target.value)}
                className="h-11 min-w-0 flex-1 rounded-2xl border-slate-200/80 bg-white/80 shadow-none"
              />
              {fromDateFilter && (
                <button
                  type="button"
                  onClick={() => onFromDateChange("")}
                  className="shrink-0 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                  aria-label="Clear from date"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
          <div className="col-span-2 sm:flex-1 min-w-0">
            <Label className={labelCls}>To date</Label>
            <div className="mt-2 flex min-w-0 items-center gap-1">
              <Input
                type="date"
                value={toDateFilter}
                onChange={(e) => onToDateChange(e.target.value)}
                className="h-11 min-w-0 flex-1 rounded-2xl border-slate-200/80 bg-white/80 shadow-none"
              />
              {toDateFilter && (
                <button
                  type="button"
                  onClick={() => onToDateChange("")}
                  className="shrink-0 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                  aria-label="Clear to date"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
