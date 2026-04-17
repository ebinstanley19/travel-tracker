import { useMemo, useState } from "react";
import { ArrowUpDown, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { TravelEntry } from "@/app/travel-tracker/types";
import { displayLocation, formatMonth, formatYear, prettyDate } from "@/app/travel-tracker/utils";

interface TableViewProps {
  entries: TravelEntry[];
  onDeleteSelected: (ids: string[]) => void;
  deletingSelected?: boolean;
}

type SortDirection = "asc" | "desc";


export function TableView({ entries, onDeleteSelected, deletingSelected = false }: TableViewProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const entryIds = useMemo(() => entries.map((entry) => entry.id), [entries]);
  const visibleSelectedIds = useMemo(
    () => selectedIds.filter((id) => entryIds.includes(id)),
    [selectedIds, entryIds]
  );
  const allSelected = entries.length > 0 && visibleSelectedIds.length === entries.length;

  const sortedEntries = useMemo(() => {
    const direction = sortDirection === "asc" ? 1 : -1;

    return [...entries].sort((a, b) => {
      const first = new Date(a.date || a.endDate).getTime();
      const second = new Date(b.date || b.endDate).getTime();
      const safeFirst = Number.isNaN(first) ? 0 : first;
      const safeSecond = Number.isNaN(second) ? 0 : second;
      return (safeFirst - safeSecond) * direction;
    });
  }, [entries, sortDirection]);

  function toggleDateSort(): void {
    setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
  }

  function dateSortLabel(): string {
    return sortDirection === "asc" ? "Sorted ascending" : "Sorted descending";
  }

  function dateSortIcon(): string {
    return sortDirection === "asc" ? "↑" : "↓";
  }

  function toggleOne(id: string): void {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  }

  function toggleAll(checked: boolean): void {
    setSelectedIds(checked ? entryIds : []);
  }

  function deleteSelected(): void {
    if (visibleSelectedIds.length === 0) return;
    onDeleteSelected(visibleSelectedIds);
    setSelectedIds((prev) => prev.filter((id) => !visibleSelectedIds.includes(id)));
  }

  return (
    <Card className="overflow-hidden rounded-[2rem] border-white/60 bg-white/75 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl">
      <CardContent className="p-0">
        <div className="flex items-center justify-between border-b border-slate-200/80 bg-slate-50/80 px-5 py-3">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={(e) => toggleAll(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300"
            />
            Select all
          </label>
          <Button
            variant="destructive"
            size="sm"
            disabled={visibleSelectedIds.length === 0 || deletingSelected}
            onClick={deleteSelected}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {deletingSelected ? "Deleting..." : `Delete selected (${visibleSelectedIds.length})`}
          </Button>
        </div>
        <div className="w-full overflow-x-auto overscroll-x-contain [scrollbar-width:thin] [-webkit-overflow-scrolling:touch]">
          <div className="min-w-[1160px]">
            <div className="grid grid-cols-[40px_repeat(8,minmax(0,1fr))] gap-3 border-b border-slate-200/80 bg-[linear-gradient(135deg,rgba(16,33,58,0.98),rgba(48,89,152,0.92))] px-5 py-4 text-xs font-semibold uppercase tracking-[0.22em] text-white/85">
              <div />
              <button type="button" onClick={toggleDateSort} className="flex items-center gap-1 text-left hover:text-white" aria-label={`Sort by From Date. ${dateSortLabel()}`}>
                <span>From Date</span>
                <ArrowUpDown className="h-3.5 w-3.5" />
                <span className="w-3 text-center">{dateSortIcon()}</span>
              </button>
              <div>To Date</div>
              <div>Year</div>
              <div>Month</div>
              <div>From</div>
              <div>To</div>
              <div>City</div>
              <div>Purpose</div>
            </div>
            {sortedEntries.map((entry) => (
              <div key={entry.id} className="grid grid-cols-[40px_repeat(8,minmax(0,1fr))] gap-3 border-b border-slate-200/70 px-5 py-4 text-sm text-slate-700 transition-colors hover:bg-slate-50/80">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(entry.id)}
                    onChange={() => toggleOne(entry.id)}
                    className="h-4 w-4 rounded border-slate-300"
                    aria-label={`Select ${entry.id}`}
                  />
                </div>
                <div>{prettyDate(entry.date)}</div>
                <div>{entry.endDate ? prettyDate(entry.endDate) : "-"}</div>
                <div>{formatYear(entry.date || entry.endDate)}</div>
                <div>{formatMonth(entry.date || entry.endDate)}</div>
                <div>{displayLocation(entry.from)}</div>
                <div>{displayLocation(entry.to)}</div>
                <div>{entry.purpose || "-"}</div>
                <div>{entry.notes || "-"}</div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
