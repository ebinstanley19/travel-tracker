import { Plane, Plus, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface EmptyStateProps {
  onAdd: () => void;
  onImport: () => void;
}

export function EmptyState({ onAdd, onImport }: EmptyStateProps) {
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
