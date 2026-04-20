import { useEffect, useState } from "react";
import { CalendarDays, ChevronDown, MapPin, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/app/travel-tracker/empty-state";
import { useDateFormat } from "@/app/travel-tracker/hooks/use-date-format";
import type { TravelEntry, YearMonthGroup } from "@/app/travel-tracker/types";
import { displayLocation, prettyDateWithFormat } from "@/app/travel-tracker/utils";

interface TimelineViewProps {
  filteredEntries: TravelEntry[];
  groupedByYearMonth: YearMonthGroup[];
  onAdd: () => void;
  onImport: () => void;
  onEdit: (entry: TravelEntry) => void;
  onDelete: (id: string) => void;
}

function isCrossMonthTrip(entry: TravelEntry): boolean {
  if (!entry.date || !entry.endDate) return false;
  const start = new Date(entry.date);
  const end = new Date(entry.endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return false;
  return start.getMonth() !== end.getMonth() || start.getFullYear() !== end.getFullYear();
}

interface TimelineEntryCardProps {
  entry: TravelEntry;
  yearIndex: number;
  monthIndex: number;
  itemIndex: number;
  activeOptionsId: string | null;
  dateFormat: "dmy" | "mdy";
  setActiveOptionsId: (id: string | null) => void;
  onEdit: (entry: TravelEntry) => void;
  onDelete: (id: string) => void;
}

function TimelineEntryCard({
  entry,
  yearIndex,
  monthIndex,
  itemIndex,
  activeOptionsId,
  dateFormat,
  setActiveOptionsId,
  onEdit,
  onDelete,
}: TimelineEntryCardProps) {
  const nights =
    entry.endDate && entry.endDate !== entry.date
      ? Math.round(
          (new Date(entry.endDate).getTime() - new Date(entry.date).getTime()) /
            (1000 * 60 * 60 * 24),
        )
      : 0;
  return (
    <Card
      className="timeline-entry-card relative rounded-[1.5rem] border border-white bg-[linear-gradient(145deg,rgba(255,255,255,0.98),rgba(248,250,252,0.95))] shadow-none transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_30px_rgba(15,23,42,0.1)]"
      style={{ animationDelay: `${yearIndex * 120 + monthIndex * 90 + itemIndex * 60}ms` }}
    >
      <div className="timeline-entry-dot pointer-events-none absolute -left-[1.6rem] top-1/2 hidden h-3.5 w-3.5 -translate-y-1/2 rounded-full border border-white bg-slate-400 shadow-[0_0_0_5px_rgba(241,245,249,0.95)] md:block" />
      <CardContent className="p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-slate-800" variant="outline">
                From {prettyDateWithFormat(entry.date, dateFormat)}
              </Badge>
              {entry.endDate ? (
                <Badge className="rounded-full border border-slate-200 bg-white px-3 py-1 text-slate-700" variant="outline">
                  To {prettyDateWithFormat(entry.endDate, dateFormat)}
                </Badge>
              ) : null}
              {entry.endDate && entry.endDate === entry.date ? (
                <Badge className="rounded-full border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-700" variant="outline">
                  Same-day trip
                </Badge>
              ) : null}
              {nights > 0 && (
                <Badge className="rounded-full border-violet-200 bg-violet-50 px-3 py-1 text-violet-700" variant="outline">
                  {nights} night{nights !== 1 ? "s" : ""}
                </Badge>
              )}
              {isCrossMonthTrip(entry) ? (
                <Badge className="rounded-full border-blue-200 bg-blue-50 px-3 py-1 text-blue-700" variant="outline">
                  Cross-month trip
                </Badge>
              ) : null}
              {entry.purpose && (
                <Badge className="rounded-full border-amber-200 bg-amber-50 px-3 py-1 text-amber-800" variant="outline">
                  City: {entry.purpose}
                </Badge>
              )}
            </div>
            <div className="grid gap-2 text-slate-950 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">From</p>
                <p className="text-sm font-semibold tracking-[-0.01em]">{displayLocation(entry.from)}</p>
              </div>
              <div className="hidden items-center gap-1.5 text-slate-400 sm:flex">
                <div className="h-px w-5 bg-slate-300" />
                <MapPin className="h-3.5 w-3.5" />
                <div className="h-px w-5 bg-slate-300" />
              </div>
              <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">To</p>
                <p className="text-sm font-semibold tracking-[-0.01em]">{displayLocation(entry.to)}</p>
              </div>
            </div>
            {entry.notes && (
              <p className="text-sm leading-6 text-slate-600">
                <span className="font-semibold text-slate-700">Purpose:</span> {entry.notes}
              </p>
            )}
          </div>
          <div className="relative" data-timeline-options-menu>
            <Button
              className="rounded-xl border-slate-200 bg-white/90"
              variant="outline"
              size="sm"
              onClick={() => setActiveOptionsId(activeOptionsId === entry.id ? null : entry.id)}
            >
              Options <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
            {activeOptionsId === entry.id ? (
              <div className="absolute right-0 bottom-full z-30 mb-2 w-36 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg sm:bottom-auto sm:top-full sm:mb-0 sm:mt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-10 w-full justify-start rounded-none px-3"
                  onClick={() => { setActiveOptionsId(null); onEdit(entry); }}
                >
                  <Pencil className="mr-2 h-4 w-4" /> Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-10 w-full justify-start rounded-none px-3 text-red-600 hover:text-red-700"
                  onClick={() => { setActiveOptionsId(null); onDelete(entry.id); }}
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function TimelineView({
  filteredEntries,
  groupedByYearMonth,
  onAdd,
  onImport,
  onEdit,
  onDelete,
}: TimelineViewProps) {
  const [expandedYears, setExpandedYears] = useState<Record<string, boolean>>({});
  const [activeOptionsId, setActiveOptionsId] = useState<string | null>(null);
  const dateFormat = useDateFormat();

  useEffect(() => {
    setExpandedYears((prev) => {
      const next: Record<string, boolean> = {};
      groupedByYearMonth.forEach((yearBlock, index) => {
        if (yearBlock.year in prev) {
          next[yearBlock.year] = prev[yearBlock.year];
          return;
        }
        next[yearBlock.year] = index < 2;
      });
      return next;
    });
  }, [groupedByYearMonth]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      const target = event.target as HTMLElement;
      if (!target.closest("[data-timeline-options-menu]")) {
        setActiveOptionsId(null);
      }
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  if (filteredEntries.length === 0) {
    return <EmptyState onAdd={onAdd} onImport={onImport} />;
  }

  return (
    <div className="space-y-6">
      {groupedByYearMonth.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {groupedByYearMonth.map((yearBlock) => (
            <button
              key={yearBlock.year}
              type="button"
              onClick={() => {
                setExpandedYears((prev) => ({ ...prev, [yearBlock.year]: true }));
                setTimeout(() => {
                  document.getElementById(`year-${yearBlock.year}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
                }, 50);
              }}
              className="rounded-full border border-slate-200 bg-white/90 px-3.5 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:border-slate-300 hover:bg-white hover:text-slate-900"
            >
              {yearBlock.year}
            </button>
          ))}
        </div>
      )}
      {groupedByYearMonth.map((yearBlock, yearIndex) => {
        const isExpanded = expandedYears[yearBlock.year] ?? yearIndex < 2;
        const yearEntryCount = yearBlock.months.reduce((total, month) => total + month.items.length, 0);
        const yearNights = yearBlock.months.reduce((total, month) =>
          total + month.items.reduce((t, entry) => {
            if (!entry.endDate || entry.endDate === entry.date) return t + 1;
            return t + Math.max(1, Math.round((new Date(entry.endDate).getTime() - new Date(entry.date).getTime()) / 86400000));
          }, 0), 0);

        return (
          <Card
            key={yearBlock.year}
            id={`year-${yearBlock.year}`}
            className="timeline-year-card overflow-hidden rounded-[2rem] border-white/60 bg-white/75 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl"
            style={{ animationDelay: `${yearIndex * 80}ms` }}
          >
            <CardHeader className={`bg-[linear-gradient(135deg,rgba(16,33,58,0.98),rgba(48,89,152,0.92))] text-white ${isExpanded ? "border-b border-border/60" : ""}`}>
              <button
                type="button"
                onClick={() => setExpandedYears((prev) => ({ ...prev, [yearBlock.year]: !isExpanded }))}
                className="flex w-full items-center justify-between gap-3 text-left"
                aria-expanded={isExpanded}
                aria-label={`Toggle ${yearBlock.year}`}
              >
                <CardTitle className="flex items-center gap-2 text-3xl font-semibold tracking-[-0.04em]">
                  <CalendarDays className="h-5 w-5" /> {yearBlock.year}
                </CardTitle>
                <div className="flex items-center gap-3">
                  <Badge className="rounded-full border-white/30 bg-white/10 px-3 py-1 text-white" variant="outline">
                    {yearEntryCount} entr{yearEntryCount > 1 ? "ies" : "y"}
                  </Badge>
                  <Badge className="rounded-full border-white/30 bg-white/10 px-3 py-1 text-white" variant="outline">
                    {yearNights} night{yearNights !== 1 ? "s" : ""}
                  </Badge>
                  <span className={`text-lg transition-transform duration-300 ${isExpanded ? "rotate-180" : "rotate-0"}`}>⌃</span>
                </div>
              </button>
            </CardHeader>
            <div
              className="grid overflow-hidden transition-[grid-template-rows] duration-300 ease-out"
              style={{ gridTemplateRows: isExpanded ? "1fr" : "0fr" }}
            >
              <CardContent className="space-y-6 overflow-hidden">
                {yearBlock.months.map((monthBlock, monthIndex) => (
                  <div
                    key={`${yearBlock.year}-${monthBlock.month}`}
                    className="timeline-month-block rounded-[1.6rem] border border-slate-200/70 bg-slate-50/70 p-4 md:p-5"
                    style={{ animationDelay: `${yearIndex * 110 + monthIndex * 70}ms` }}
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-xl font-semibold tracking-[-0.03em] text-slate-950">{monthBlock.month}</h3>
                      <div className="flex items-center gap-2">
                        <Badge className="rounded-full bg-white px-3 py-1 text-slate-700 shadow-none" variant="secondary">
                          {monthBlock.items.length} entr{monthBlock.items.length > 1 ? "ies" : "y"}
                        </Badge>
                      </div>
                    </div>
                    <div className="relative grid gap-3 md:pl-8">
                      <div className="timeline-rail pointer-events-none absolute bottom-2 left-2 top-2 hidden w-px bg-[linear-gradient(180deg,rgba(148,163,184,0),rgba(100,116,139,0.45),rgba(148,163,184,0))] md:block" />
                      {monthBlock.items.map((entry, itemIndex) => (
                        <TimelineEntryCard
                          key={entry.id}
                          entry={entry}
                          yearIndex={yearIndex}
                          monthIndex={monthIndex}
                          itemIndex={itemIndex}
                          activeOptionsId={activeOptionsId}
                          dateFormat={dateFormat}
                          setActiveOptionsId={setActiveOptionsId}
                          onEdit={onEdit}
                          onDelete={onDelete}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
