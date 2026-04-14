import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { TravelEntry } from "@/app/travel-tracker/types";
import { formatMonth, formatYear, prettyDate } from "@/app/travel-tracker/utils";

interface TableViewProps {
  entries: TravelEntry[];
}

export function TableView({ entries }: TableViewProps) {
  return (
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
            {entries.map((entry) => (
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
  );
}
