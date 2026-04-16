import { Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface FiltersCardProps {
  search: string;
  countryFilter: string;
  yearFilter: string;
  countries: string[];
  years: string[];
  onSearchChange: (value: string) => void;
  onCountryChange: (value: string) => void;
  onYearChange: (value: string) => void;
}

export function FiltersCard({
  search,
  countryFilter,
  yearFilter,
  countries,
  years,
  onSearchChange,
  onCountryChange,
  onYearChange,
}: FiltersCardProps) {
  return (
    <Card className="rounded-[2rem] border-white/60 bg-white/75 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl">
      <CardContent className="p-5 md:p-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-950 md:text-xl">Filters</h2>
          <p className="text-xs font-medium text-slate-500 md:text-sm">Find trips in seconds</p>
        </div>
        <div className="grid gap-3 md:grid-cols-4">
          <div className="md:col-span-2">
            <Label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Search</Label>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Country, city, route, or notes"
                className="h-12 rounded-2xl border-slate-200/80 bg-white/80 pl-9 shadow-none"
              />
            </div>
          </div>
          <div>
            <Label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Country</Label>
            <Select value={countryFilter} onValueChange={onCountryChange}>
              <SelectTrigger className="mt-2 h-12 rounded-2xl border-slate-200/80 bg-white/80 shadow-none"><SelectValue placeholder="All countries" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All countries</SelectItem>
                {countries.map((country) => (
                  <SelectItem key={country} value={country}>{country}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Year</Label>
            <Select value={yearFilter} onValueChange={onYearChange}>
              <SelectTrigger className="mt-2 h-12 rounded-2xl border-slate-200/80 bg-white/80 shadow-none"><SelectValue placeholder="All years" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All years</SelectItem>
                {years.map((year) => (
                  <SelectItem key={year} value={year}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
