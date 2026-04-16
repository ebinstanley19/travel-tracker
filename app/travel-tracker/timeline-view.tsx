import { CalendarDays, MapPin, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/app/travel-tracker/empty-state";
import type { TravelEntry, YearMonthGroup } from "@/app/travel-tracker/types";
import { prettyDate } from "@/app/travel-tracker/utils";

interface TimelineViewProps {
  filteredEntries: TravelEntry[];
  groupedByYearMonth: YearMonthGroup[];
  onAdd: () => void;
  onImport: () => void;
  onEdit: (entry: TravelEntry) => void;
  onDelete: (id: string) => void;
}

function displayLocation(value: string): string {
  if (!value) return "-";
  const [place, country] = value.split(" | ");
  if (country) {
    return `${place} (${country})`;
  }
  return value;
}

export function TimelineView({
  filteredEntries,
  groupedByYearMonth,
  onAdd,
  onImport,
  onEdit,
  onDelete,
}: TimelineViewProps) {
  if (filteredEntries.length === 0) {
    return <EmptyState onAdd={onAdd} onImport={onImport} />;
  }

  return (
    <div className="space-y-6">
      {groupedByYearMonth.map((yearBlock, yearIndex) => (
        <Card
          key={yearBlock.year}
          className="timeline-year-card overflow-hidden rounded-[2rem] border-white/60 bg-white/75 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl"
          style={{ animationDelay: `${yearIndex * 80}ms` }}
        >
          <CardHeader className="border-b border-border/60 bg-[linear-gradient(135deg,rgba(16,33,58,0.98),rgba(48,89,152,0.92))] text-white">
            <CardTitle className="flex items-center gap-2 text-3xl font-semibold tracking-[-0.04em]">
              <CalendarDays className="h-5 w-5" /> {yearBlock.year}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {yearBlock.months.map((monthBlock, monthIndex) => (
              <div
                key={`${yearBlock.year}-${monthBlock.month}`}
                className="timeline-month-block rounded-[1.6rem] border border-slate-200/70 bg-slate-50/70 p-4 md:p-5"
                style={{ animationDelay: `${yearIndex * 110 + monthIndex * 70}ms` }}
              >
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-xl font-semibold tracking-[-0.03em] text-slate-950">{monthBlock.month}</h3>
                  <Badge className="rounded-full bg-white px-3 py-1 text-slate-700 shadow-none" variant="secondary">{monthBlock.items.length} entr{monthBlock.items.length > 1 ? "ies" : "y"}</Badge>
                </div>
                <div className="relative grid gap-3 md:pl-8">
                  <div className="timeline-rail pointer-events-none absolute bottom-2 left-2 top-2 hidden w-px bg-[linear-gradient(180deg,rgba(148,163,184,0),rgba(100,116,139,0.45),rgba(148,163,184,0))] md:block" />
                  {monthBlock.items.map((entry, itemIndex) => (
                    <Card
                      key={entry.id}
                      className="timeline-entry-card relative rounded-[1.5rem] border border-white bg-[linear-gradient(145deg,rgba(255,255,255,0.98),rgba(248,250,252,0.95))] shadow-none transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_30px_rgba(15,23,42,0.1)]"
                      style={{ animationDelay: `${yearIndex * 120 + monthIndex * 90 + itemIndex * 60}ms` }}
                    >
                      <div className="timeline-entry-dot pointer-events-none absolute -left-[1.6rem] top-1/2 hidden h-3.5 w-3.5 -translate-y-1/2 rounded-full border border-white bg-slate-400 shadow-[0_0_0_5px_rgba(241,245,249,0.95)] md:block" />
                      <CardContent className="p-4">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                          <div className="space-y-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge className="rounded-full bg-slate-950 px-3 py-1 text-white">{prettyDate(entry.date)}</Badge>
                              {entry.purpose && <Badge className="rounded-full border-amber-200 bg-amber-50 px-3 py-1 text-amber-800" variant="outline">{entry.purpose}</Badge>}
                            </div>
                            <div className="flex items-center gap-2 text-base font-semibold tracking-[-0.02em] text-slate-950">
                              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                                <MapPin className="h-4 w-4" />
                              </div>
                              <span>{displayLocation(entry.from)}</span>
                              <span className="text-muted-foreground">→</span>
                              <span>{displayLocation(entry.to)}</span>
                            </div>
                            {entry.notes && <p className="text-sm leading-6 text-slate-600">{entry.notes}</p>}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button className="rounded-xl border-slate-200 bg-white/90" variant="outline" size="sm" onClick={() => onEdit(entry)}>
                              <Pencil className="mr-2 h-4 w-4" /> Edit
                            </Button>
                            <Button className="rounded-xl" variant="destructive" size="sm" onClick={() => onDelete(entry.id)}>
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
  );
}
