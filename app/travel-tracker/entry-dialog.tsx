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
      <DialogContent className="sm:max-w-2xl rounded-2xl">
        <DialogHeader>
          <DialogTitle>{editingId ? "Edit travel entry" : "Add travel entry"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-5 py-2">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>From date</Label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => onFormChange({ ...form, date: e.target.value })}
                className="mt-2 h-11"
              />
            </div>
            <div>
              <Label>To date</Label>
              <Input
                type="date"
                value={form.endDate}
                onChange={(e) => onFormChange({ ...form, endDate: e.target.value })}
                className="mt-2 h-11"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Purpose</Label>
              <Input
                value={form.purpose}
                onChange={(e) => onFormChange({ ...form, purpose: e.target.value })}
                placeholder="Vacation / Work / Transit"
                className="mt-2 h-11"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>From</Label>
              <Select
                value={form.fromCountry || ""}
                onValueChange={(value) => onFormChange({ ...form, fromCountry: value })}
              >
                <SelectTrigger className="mt-2 h-11">
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
            <div>
              <Label>To</Label>
              <Select
                value={form.toCountry || ""}
                onValueChange={(value) => onFormChange({ ...form, toCountry: value })}
              >
                <SelectTrigger className="mt-2 h-11">
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

          <div>
            <Label>Notes</Label>
            <Input
              value={form.notes}
              onChange={(e) => onFormChange({ ...form, notes: e.target.value })}
              placeholder="Places visited in that country (optional)"
              className="mt-2 h-11"
            />
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
