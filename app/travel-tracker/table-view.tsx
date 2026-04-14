import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { TravelEntry } from "@/app/travel-tracker/types";
import { formatMonth, formatYear, prettyDate } from "@/app/travel-tracker/utils";

interface TableViewProps {
  entries: TravelEntry[];
}

export function TableView({ entries }: TableViewProps) {
  return (
    <Card className="overflow-hidden rounded-[2rem] border-white/60 bg-white/75 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl">
      <CardContent className="p-0">
        <ScrollArea className="w-full">
          <div className="min-w-[950px]">
            <div className="grid grid-cols-8 gap-3 border-b border-slate-200/80 bg-[linear-gradient(135deg,rgba(16,33,58,0.98),rgba(48,89,152,0.92))] px-5 py-4 text-xs font-semibold uppercase tracking-[0.22em] text-white/85">
              <div>Date</div>
              <div>Year</div>
              <div>Month</div>
              <div>From</div>
              <div>To</div>
              <div>Country</div>
              <div>Purpose</div>
              <div>Notes</div>
            </div>
            {entries.map((entry) => (
              <div key={entry.id} className="grid grid-cols-8 gap-3 border-b border-slate-200/70 px-5 py-4 text-sm text-slate-700 transition-colors hover:bg-slate-50/80">
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
  );
}
