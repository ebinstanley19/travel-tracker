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
                            <Button variant="outline" size="sm" onClick={() => onEdit(entry)}>
                              <Pencil className="mr-2 h-4 w-4" /> Edit
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => onDelete(entry.id)}>
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
