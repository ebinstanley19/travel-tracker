"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Plane, Plus, Search, Upload, CalendarDays, MapPin, Globe2, Trash2, Pencil, Download } from "lucide-react";
import * as XLSX from "xlsx";

const monthOrder = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const sampleData: any[] = [];

function safeText(value: unknown): string {
  return (value ?? "").toString().trim();
}

function formatMonth(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleString("en-US", { month: "long" });
}

function formatYear(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return Number.isNaN(d.getTime()) ? "" : String(d.getFullYear());
}

function prettyDate(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return Number.isNaN(d.getTime())
    ? dateStr
    : d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function sortEntries(entries: any[]): any[] {
  return [...entries].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

function exportToExcel(entries: any[]): void {
  const rows = sortEntries(entries).map((item) => ({
    Year: formatYear(item.date),
    Month: formatMonth(item.date),
    Date: item.date,
    From: item.from,
    To: item.to,
    Country: item.country,
    Purpose: item.purpose,
    Notes: item.notes,
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Travel Records");
  XLSX.writeFile(wb, "travel-history.xlsx");
}

interface TravelEntry {
  id: string;
  date: string;
  from: string;
  to: string;
  country: string;
  purpose: string;
  notes: string;
}

type ParsedDateResult =
  | { type: "single"; startDay: number }
  | { type: "range"; startDay: number; endDay: number };

function makeId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function parseWorkbook(file: File, onLoad: (entries: TravelEntry[]) => void): void {
  const monthMap: Record<string, number> = {
    january: 1,
    february: 2,
    march: 3,
    april: 4,
    may: 5,
    june: 6,
    july: 7,
    august: 8,
    september: 9,
    october: 10,
    november: 11,
    december: 12,
  };

  function pad(n: number): string {
    return String(n).padStart(2, "0");
  }

  function makeDate(year: number, month: number, day: number): string {
    return `${year}-${pad(month)}-${pad(day)}`;
  }

  function normalizePlace(value: unknown): string {
    return safeText(value);
  }

  function parseDateCell(rawDate: unknown, currentMonthNumber: number): ParsedDateResult | null {
    if (rawDate === null || rawDate === undefined || rawDate === "") return null;

    if (typeof rawDate === "number") {
      return { type: "single", startDay: rawDate };
    }

    if (rawDate instanceof Date && !Number.isNaN(rawDate.getTime())) {
      const monthFromCell = rawDate.getMonth() + 1;
      const dayFromCell = rawDate.getDate();

      if (monthFromCell !== currentMonthNumber) {
        return {
          type: "range",
          startDay: monthFromCell,
          endDay: dayFromCell,
        };
      }

      return {
        type: "single",
        startDay: dayFromCell,
      };
    }

    const text = safeText(rawDate);

    if (/^\d+$/.test(text)) {
      return { type: "single", startDay: Number(text) };
    }

    const rangeMatch = text.match(/^(\d{1,2})\s*-\s*(\d{1,2})$/);
    if (rangeMatch) {
      return {
        type: "range",
        startDay: Number(rangeMatch[1]),
        endDay: Number(rangeMatch[2]),
      };
    }

    return null;
  }

  const reader = new FileReader();

  reader.onload = (e: ProgressEvent<FileReader>) => {
    const data = e.target?.result;
    if (!data) return;

    const workbook = XLSX.read(data, { type: "array", cellDates: true });
    const parsedEntries: TravelEntry[] = [];

    workbook.SheetNames.forEach((sheetName: string) => {
      const year = Number(sheetName);
      if (Number.isNaN(year)) return;

      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json<(string | number | Date)[]>(sheet, {
        header: 1,
        defval: "",
      });

      let currentMonth = "";

      for (let i = 3; i < rows.length; i++) {
        const row: (string | number | Date)[] = rows[i] || [];

        const monthCell = safeText(row[0]);
        const dateCell = row[1];
        const fromCell = normalizePlace(row[2]);
        const toCell = normalizePlace(row[3]);

        if (monthCell) {
          currentMonth = monthCell;
        }

        if (!currentMonth) continue;
        if (!dateCell && !fromCell && !toCell) continue;

        const monthNumber = monthMap[currentMonth.toLowerCase()];
        if (!monthNumber) continue;

        const parsedDate = parseDateCell(dateCell, monthNumber);
        if (!parsedDate) continue;

        if (parsedDate.type === "single") {
          parsedEntries.push({
            id: makeId(),
            date: makeDate(year, monthNumber, parsedDate.startDay),
            from: fromCell,
            to: toCell,
            country: toCell,
            purpose: "",
            notes: "",
          });
        }

        if (parsedDate.type === "range") {
          parsedEntries.push({
            id: makeId(),
            date: makeDate(year, monthNumber, parsedDate.startDay),
            from: fromCell,
            to: toCell,
            country: toCell,
            purpose: "",
            notes: "Auto-imported from date range",
          });

          parsedEntries.push({
            id: makeId(),
            date: makeDate(year, monthNumber, parsedDate.endDay),
            from: toCell,
            to: fromCell,
            country: fromCell,
            purpose: "",
            notes: "Auto-generated return trip from date range",
          });
        }
      }
    });

    onLoad(sortEntries(parsedEntries));
  };

  reader.readAsArrayBuffer(file);
}

interface EmptyStateProps {
  onAdd: () => void;
  onImport: () => void;
}

function EmptyState({ onAdd, onImport }: EmptyStateProps) {
  return (
    <Card className="border-dashed shadow-sm rounded-2xl">
      <CardContent className="py-12 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
          <Plane className="h-7 w-7" />
        </div>
        <h3 className="text-xl font-semibold">Start your travel history tracker</h3>
        <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
          Add trips manually or import your existing Excel file and turn it into a cleaner timeline with filters, yearly views, and country tracking.
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          <Button onClick={onAdd}><Plus className="mr-2 h-4 w-4" />Add travel entry</Button>
          <Button variant="outline" onClick={onImport}><Upload className="mr-2 h-4 w-4" />Import Excel</Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function TravelHistoryTrackerApp() {
  const [entries, setEntries] = useState(sampleData);
  const [search, setSearch] = useState("");
  const [countryFilter, setCountryFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [form, setForm] = useState({
    date: "",
    from: "",
    to: "",
    country: "",
    purpose: "",
    notes: "",
  });

  useEffect(() => {
    async function loadRecords() {
      const { data, error } = await supabase
        .from("travel_records")
        .select("*")
        .order("date", { ascending: false });

      if (!error && data) {
        const normalized: TravelEntry[] = data.map((item: any) => ({
          id: item.id,
          date: item.date ?? "",
          from: item.from ?? "",
          to: item.to ?? "",
          country: item.country ?? "",
          purpose: item.purpose ?? "",
          notes: item.notes ?? "",
        }));

        setEntries(normalized);
      }
    }

    loadRecords();
  }, []);

  const countries = useMemo(() => {
    return [...new Set(entries.map((e) => e.country).filter(Boolean))].sort();
  }, [entries]);

  const years = useMemo(() => {
    return [...new Set(entries.map((e) => formatYear(e.date)).filter(Boolean))].sort((a, b) => Number(b) - Number(a));
  }, [entries]);

  const filtered = useMemo(() => {
    return sortEntries(
      entries.filter((e) => {
        const blob = `${e.date} ${e.from} ${e.to} ${e.country} ${e.purpose} ${e.notes}`.toLowerCase();
        const matchesSearch = blob.includes(search.toLowerCase());
        const matchesCountry = countryFilter === "all" || e.country === countryFilter;
        const matchesYear = yearFilter === "all" || formatYear(e.date) === yearFilter;
        return matchesSearch && matchesCountry && matchesYear;
      })
    );
  }, [entries, search, countryFilter, yearFilter]);

  const groupedByYearMonth = useMemo(() => {
    const grouped: Record<string, Record<string, TravelEntry[]>> = {};
    filtered.forEach((entry) => {
      const year = formatYear(entry.date) || "Unknown Year";
      const month = formatMonth(entry.date) || "Unknown Month";
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
      months: monthOrder
        .filter((m) => grouped[year][m])
        .map((m) => ({ month: m, items: sortEntries(grouped[year][m]) })),
    }));
  }, [filtered]);

  const stats = useMemo(() => {
    const uniqueCountries = new Set(entries.map((e) => e.country).filter(Boolean)).size;
    const totalTrips = entries.length;
    const yearsCovered = new Set(entries.map((e) => formatYear(e.date)).filter(Boolean)).size;

    const countryCounts = entries.reduce<Record<string, number>>((acc, item) => {
      if (!item.country) return acc;
      acc[item.country] = (acc[item.country] || 0) + 1;
      return acc;
    }, {});

    const topCountry = Object.entries(countryCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "-";
    return { uniqueCountries, totalTrips, yearsCovered, topCountry };
  }, [entries]);

  function openNewModal() {
    setEditingId(null);
    setForm({ date: "", from: "", to: "", country: "", purpose: "", notes: "" });
    setOpen(true);
  }

  function openEditModal(entry: TravelEntry): void {
    setEditingId(entry.id);
    setForm({
      date: entry.date || "",
      from: entry.from || "",
      to: entry.to || "",
      country: entry.country || "",
      purpose: entry.purpose || "",
      notes: entry.notes || "",
    });
    setOpen(true);
  }

  async function saveEntry(): Promise<void> {
    if (!form.date && !form.from && !form.to && !form.country) return;

    if (editingId) {
      const { data, error } = await supabase
        .from("travel_records")
        .update({
          date: form.date,
          from: form.from || "",
          to: form.to || "",
          country: form.country || "",
          purpose: form.purpose || "",
          notes: form.notes || "",
        })
        .eq("id", editingId)
        .select()
        .single();

      if (!error && data) {
        const updated: TravelEntry = {
          id: data.id,
          date: data.date ?? "",
          from: data.from ?? "",
          to: data.to ?? "",
          country: data.country ?? "",
          purpose: data.purpose ?? "",
          notes: data.notes ?? "",
        };

        setEntries((prev: TravelEntry[]) =>
          prev.map((e: TravelEntry) => (e.id === editingId ? updated : e))
        );
      }
    } else {
      const { data, error } = await supabase
        .from("travel_records")
        .insert([
          {
            date: form.date,
            from: form.from || "",
            to: form.to || "",
            country: form.country || "",
            purpose: form.purpose || "",
            notes: form.notes || "",
          },
        ])
        .select()
        .single();

      if (!error && data) {
        const created: TravelEntry = {
          id: data.id,
          date: data.date ?? "",
          from: data.from ?? "",
          to: data.to ?? "",
          country: data.country ?? "",
          purpose: data.purpose ?? "",
          notes: data.notes ?? "",
        };

        setEntries((prev: TravelEntry[]) => sortEntries([created, ...prev]));
      }
    }

    setOpen(false);
  }

  async function deleteEntry(id: string): Promise<void> {
    const { error } = await supabase
      .from("travel_records")
      .delete()
      .eq("id", id);

    if (!error) {
      setEntries((prev: TravelEntry[]) =>
        prev.filter((e: TravelEntry) => e.id !== id)
      );
    }
  }

  function triggerImport(): void {
    fileInputRef.current?.click();
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 rounded-3xl bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Plane className="h-4 w-4" /> Travel History Tracker
            </div>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">Track every trip in one clean view</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Built for passport-style travel history. Keep all your entry and exit dates in one place, searchable by country, year, and route.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={() => exportToExcel(entries)}>
              <Download className="mr-2 h-4 w-4" /> Export Excel
            </Button>
            <Button variant="outline" onClick={triggerImport}>
              <Upload className="mr-2 h-4 w-4" /> Import Excel
            </Button>
            <Button onClick={openNewModal}>
              <Plus className="mr-2 h-4 w-4" /> Add entry
            </Button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) parseWorkbook(file, setEntries);
            }}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card className="rounded-2xl shadow-sm">
            <CardContent className="p-5">
              <div className="text-sm text-muted-foreground">Total entries</div>
              <div className="mt-2 text-3xl font-bold">{stats.totalTrips}</div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl shadow-sm">
            <CardContent className="p-5">
              <div className="text-sm text-muted-foreground">Countries visited</div>
              <div className="mt-2 text-3xl font-bold">{stats.uniqueCountries}</div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl shadow-sm">
            <CardContent className="p-5">
              <div className="text-sm text-muted-foreground">Years covered</div>
              <div className="mt-2 text-3xl font-bold">{stats.yearsCovered}</div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl shadow-sm">
            <CardContent className="p-5">
              <div className="text-sm text-muted-foreground">Most visited country</div>
              <div className="mt-2 text-3xl font-bold">{stats.topCountry}</div>
            </CardContent>
          </Card>
        </div>

        <Card className="rounded-2xl shadow-sm">
          <CardContent className="p-4 md:p-5">
            <div className="grid gap-3 md:grid-cols-4">
              <div className="md:col-span-2">
                <Label>Search</Label>
                <div className="relative mt-2">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by country, city, route, notes..."
                    className="pl-9"
                  />
                </div>
              </div>
              <div>
                <Label>Country</Label>
                <Select value={countryFilter} onValueChange={setCountryFilter}>
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
                <Select value={yearFilter} onValueChange={setYearFilter}>
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

        <Tabs defaultValue="timeline" className="space-y-4">
          <TabsList>
            <TabsTrigger value="timeline">Timeline view</TabsTrigger>
            <TabsTrigger value="table">Table view</TabsTrigger>
          </TabsList>

          <TabsContent value="timeline">
            {filtered.length === 0 ? (
              <EmptyState onAdd={openNewModal} onImport={triggerImport} />
            ) : (
              <div className="space-y-5">
                {groupedByYearMonth.map((yearBlock) => (
                  <Card key={yearBlock.year} className="rounded-2xl shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-2xl">
                        <CalendarDays className="h-5 w-5" /> {yearBlock.year}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {yearBlock.months.map((monthBlock) => (
                        <div key={`${yearBlock.year}-${monthBlock.month}`}>
                          <div className="mb-3 flex items-center justify-between">
                            <h3 className="text-lg font-semibold">{monthBlock.month}</h3>
                            <Badge variant="secondary">{monthBlock.items.length} entr{monthBlock.items.length > 1 ? "ies" : "y"}</Badge>
                          </div>
                          <div className="grid gap-3">
                            {monthBlock.items.map((entry) => (
                              <Card key={entry.id} className="rounded-2xl border bg-slate-50 shadow-none">
                                <CardContent className="p-4">
                                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                    <div className="space-y-2">
                                      <div className="flex flex-wrap items-center gap-2">
                                        <Badge>{prettyDate(entry.date)}</Badge>
                                        {entry.purpose && <Badge variant="outline">{entry.purpose}</Badge>}
                                        {entry.country && <Badge variant="secondary">{entry.country}</Badge>}
                                      </div>
                                      <div className="flex items-center gap-2 text-base font-medium">
                                        <MapPin className="h-4 w-4" />
                                        <span>{entry.from || "-"}</span>
                                        <span className="text-muted-foreground">→</span>
                                        <span>{entry.to || "-"}</span>
                                      </div>
                                      {entry.notes && <p className="text-sm text-muted-foreground">{entry.notes}</p>}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Button variant="outline" size="sm" onClick={() => openEditModal(entry)}>
                                        <Pencil className="mr-2 h-4 w-4" /> Edit
                                      </Button>
                                      <Button variant="destructive" size="sm" onClick={() => deleteEntry(entry.id)}>
                                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                                      </Button>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="table">
            <Card className="rounded-2xl shadow-sm">
              <CardContent className="p-0">
                <ScrollArea className="w-full">
                  <div className="min-w-[950px]">
                    <div className="grid grid-cols-8 gap-3 border-b bg-slate-50 px-4 py-3 text-sm font-semibold">
                      <div>Date</div>
                      <div>Year</div>
                      <div>Month</div>
                      <div>From</div>
                      <div>To</div>
                      <div>Country</div>
                      <div>Purpose</div>
                      <div>Notes</div>
                    </div>
                    {filtered.map((entry) => (
                      <div key={entry.id} className="grid grid-cols-8 gap-3 border-b px-4 py-3 text-sm">
                        <div>{prettyDate(entry.date)}</div>
                        <div>{formatYear(entry.date)}</div>
                        <div>{formatMonth(entry.date)}</div>
                        <div>{entry.from || "-"}</div>
                        <div>{entry.to || "-"}</div>
                        <div>{entry.country || "-"}</div>
                        <div>{entry.purpose || "-"}</div>
                        <div>{entry.notes || "-"}</div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="sm:max-w-xl rounded-2xl">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit travel entry" : "Add travel entry"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-2 md:grid-cols-2">
              <div>
                <Label>Date</Label>
                <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="mt-2" />
              </div>
              <div>
                <Label>Country</Label>
                <Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} placeholder="e.g. Vietnam" className="mt-2" />
              </div>
              <div>
                <Label>From</Label>
                <Input value={form.from} onChange={(e) => setForm({ ...form, from: e.target.value })} placeholder="e.g. Singapore" className="mt-2" />
              </div>
              <div>
                <Label>To</Label>
                <Input value={form.to} onChange={(e) => setForm({ ...form, to: e.target.value })} placeholder="e.g. Bangkok" className="mt-2" />
              </div>
              <div>
                <Label>Purpose</Label>
                <Input value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} placeholder="Vacation / Work / Transit" className="mt-2" />
              </div>
              <div>
                <Label>Notes</Label>
                <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Anything important" className="mt-2" />
              </div>
            </div>
            <Separator />
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={saveEntry}>{editingId ? "Save changes" : "Add entry"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Card className="rounded-2xl border-dashed shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <Globe2 className="mt-0.5 h-5 w-5" />
              <div>
                <h3 className="font-semibold">Best format for your passport records</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Keep one row per movement date. That means every departure and arrival can be its own entry if you want a full history. This makes searching, filtering, and future analytics much easier than using separate worksheets by year.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
