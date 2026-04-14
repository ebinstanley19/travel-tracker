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
    <Card className="rounded-2xl shadow-sm">
      <CardContent className="p-4 md:p-5">
        <div className="grid gap-3 md:grid-cols-4">
          <div className="md:col-span-2">
            <Label>Search</Label>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search by country, city, route, notes..."
                className="pl-9"
              />
            </div>
          </div>
          <div>
            <Label>Country</Label>
            <Select value={countryFilter} onValueChange={onCountryChange}>
              <SelectTrigger className="mt-2"><SelectValue placeholder="All countries" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All countries</SelectItem>
                {countries.map((country) => (
                  <SelectItem key={country} value={country}>{country}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Year</Label>
            <Select value={yearFilter} onValueChange={onYearChange}>
              <SelectTrigger className="mt-2"><SelectValue placeholder="All years" /></SelectTrigger>
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
