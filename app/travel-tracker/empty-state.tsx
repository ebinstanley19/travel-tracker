import { Plane, Plus, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface EmptyStateProps {
  onAdd: () => void;
  onImport: () => void;
}

export function EmptyState({ onAdd, onImport }: EmptyStateProps) {
  return (
    <Card className="overflow-hidden rounded-[2rem] border border-dashed border-slate-300/70 bg-white/65 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl">
      <CardContent className="relative py-14 text-center">
        <div className="absolute inset-x-0 top-0 h-28 bg-[radial-gradient(circle_at_top,rgba(255,191,114,0.32),transparent_60%)]" />
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-[1.4rem] bg-slate-950 text-white shadow-lg shadow-slate-900/20">
          <Plane className="h-7 w-7" />
        </div>
        <h3 className="text-2xl font-semibold tracking-[-0.03em] text-slate-950">Your runway is clear</h3>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-600">
          Add trips manually or import your existing Excel file and turn it into a cleaner timeline with filters, yearly views, and country tracking.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Button className="rounded-2xl bg-slate-950 px-5 hover:bg-slate-800" onClick={onAdd}><Plus className="mr-2 h-4 w-4" />Add travel entry</Button>
          <Button className="rounded-2xl border-slate-200 bg-white/80 px-5" variant="outline" onClick={onImport}><Upload className="mr-2 h-4 w-4" />Import Excel</Button>
        </div>
      </CardContent>
    </Card>
  );
}
