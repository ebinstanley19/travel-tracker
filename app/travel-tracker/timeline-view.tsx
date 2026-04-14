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
      {groupedByYearMonth.map((yearBlock) => (
        <Card key={yearBlock.year} className="overflow-hidden rounded-[2rem] border-white/60 bg-white/75 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl">
          <CardHeader className="border-b border-border/60 bg-[linear-gradient(135deg,rgba(16,33,58,0.98),rgba(48,89,152,0.92))] text-white">
            <CardTitle className="flex items-center gap-2 text-3xl font-semibold tracking-[-0.04em]">
              <CalendarDays className="h-5 w-5" /> {yearBlock.year}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {yearBlock.months.map((monthBlock) => (
              <div key={`${yearBlock.year}-${monthBlock.month}`} className="rounded-[1.6rem] border border-slate-200/70 bg-slate-50/70 p-4 md:p-5">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-xl font-semibold tracking-[-0.03em] text-slate-950">{monthBlock.month}</h3>
                  <Badge className="rounded-full bg-white px-3 py-1 text-slate-700 shadow-none" variant="secondary">{monthBlock.items.length} entr{monthBlock.items.length > 1 ? "ies" : "y"}</Badge>
                </div>
                <div className="grid gap-3">
                  {monthBlock.items.map((entry) => (
                    <Card key={entry.id} className="rounded-[1.5rem] border border-white bg-white/95 shadow-none transition-transform duration-200 hover:-translate-y-0.5">
                      <CardContent className="p-4">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                          <div className="space-y-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge className="rounded-full bg-slate-950 px-3 py-1 text-white">{prettyDate(entry.date)}</Badge>
                              {entry.purpose && <Badge className="rounded-full border-amber-200 bg-amber-50 px-3 py-1 text-amber-800" variant="outline">{entry.purpose}</Badge>}
                              {entry.country && <Badge className="rounded-full bg-slate-100 px-3 py-1 text-slate-700" variant="secondary">{entry.country}</Badge>}
                            </div>
                            <div className="flex items-center gap-2 text-base font-semibold tracking-[-0.02em] text-slate-950">
                              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                                <MapPin className="h-4 w-4" />
                              </div>
                              <span>{entry.from || "-"}</span>
                              <span className="text-muted-foreground">→</span>
                              <span>{entry.to || "-"}</span>
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
