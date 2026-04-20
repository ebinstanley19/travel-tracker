import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { COUNTRY_OPTIONS } from "@/app/travel-tracker/countries";
import type { TravelForm } from "@/app/travel-tracker/types";

interface EntryDialogProps {
  open: boolean;
  editingId: string | null;
  form: TravelForm;
  onOpenChange: (open: boolean) => void;
  onFormChange: (next: TravelForm) => void;
  onSave: () => void;
}

export function EntryDialog({
  open,
  editingId,
  form,
  onOpenChange,
  onFormChange,
  onSave,
}: EntryDialogProps) {
  const countryOptions = COUNTRY_OPTIONS as readonly string[];

  const fromCountryChoices = form.fromCountry && !countryOptions.includes(form.fromCountry)
    ? [form.fromCountry, ...COUNTRY_OPTIONS]
    : COUNTRY_OPTIONS;

  const toCountryChoices = form.toCountry && !countryOptions.includes(form.toCountry)
    ? [form.toCountry, ...COUNTRY_OPTIONS]
    : COUNTRY_OPTIONS;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl rounded-2xl overflow-hidden">
        <DialogHeader>
          <DialogTitle>{editingId ? "Edit travel entry" : "Add travel entry"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="min-w-0 space-y-1.5">
              <Label>From date</Label>
              <div className="flex min-w-0 items-center gap-1">
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) => onFormChange({ ...form, date: e.target.value })}
                  className="h-11 min-w-0 flex-1"
                />
                {form.date && (
                  <button
                    type="button"
                    onClick={() => onFormChange({ ...form, date: "" })}
                    className="shrink-0 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                    aria-label="Clear from date"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
            <div className="min-w-0 space-y-1.5">
              <Label>To date</Label>
              <div className="flex min-w-0 items-center gap-1">
                <Input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => onFormChange({ ...form, endDate: e.target.value })}
                  className="h-11 min-w-0 flex-1"
                />
                {form.endDate && (
                  <button
                    type="button"
                    onClick={() => onFormChange({ ...form, endDate: "" })}
                    className="shrink-0 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                    aria-label="Clear to date"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>From</Label>
              <Select
                value={form.fromCountry || ""}
                onValueChange={(value) => onFormChange({ ...form, fromCountry: value })}
              >
                <SelectTrigger className="h-11 w-full">
                  <SelectValue placeholder="Select departure country" />
                </SelectTrigger>
                <SelectContent className="max-h-80">
                  {fromCountryChoices.map((country) => (
                    <SelectItem key={country} value={country}>
                      {country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>To</Label>
              <Select
                value={form.toCountry || ""}
                onValueChange={(value) => onFormChange({ ...form, toCountry: value })}
              >
                <SelectTrigger className="h-11 w-full">
                  <SelectValue placeholder="Select destination country" />
                </SelectTrigger>
                <SelectContent className="max-h-80">
                  {toCountryChoices.map((country) => (
                    <SelectItem key={country} value={country}>
                      {country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>City (optional)</Label>
              <Input
                value={form.purpose}
                onChange={(e) => onFormChange({ ...form, purpose: e.target.value })}
                placeholder="e.g. Kuala Lumpur"
                className="h-11"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Purpose</Label>
              <Input
                value={form.notes}
                onChange={(e) => onFormChange({ ...form, notes: e.target.value })}
                placeholder="e.g. Vacation / Work / Transit"
                className="h-11"
              />
            </div>
          </div>
        </div>
        <Separator />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={onSave}>{editingId ? "Save changes" : "Add entry"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
