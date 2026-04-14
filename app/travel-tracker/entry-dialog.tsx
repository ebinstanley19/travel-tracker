import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl rounded-2xl">
        <DialogHeader>
          <DialogTitle>{editingId ? "Edit travel entry" : "Add travel entry"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2 md:grid-cols-2">
          <div>
            <Label>Date</Label>
            <Input type="date" value={form.date} onChange={(e) => onFormChange({ ...form, date: e.target.value })} className="mt-2" />
          </div>
          <div>
            <Label>Country</Label>
            <Input value={form.country} onChange={(e) => onFormChange({ ...form, country: e.target.value })} placeholder="e.g. Vietnam" className="mt-2" />
          </div>
          <div>
            <Label>From</Label>
            <Input value={form.from} onChange={(e) => onFormChange({ ...form, from: e.target.value })} placeholder="e.g. Singapore" className="mt-2" />
          </div>
          <div>
            <Label>To</Label>
            <Input value={form.to} onChange={(e) => onFormChange({ ...form, to: e.target.value })} placeholder="e.g. Bangkok" className="mt-2" />
          </div>
          <div>
            <Label>Purpose</Label>
            <Input value={form.purpose} onChange={(e) => onFormChange({ ...form, purpose: e.target.value })} placeholder="Vacation / Work / Transit" className="mt-2" />
          </div>
          <div>
            <Label>Notes</Label>
            <Input value={form.notes} onChange={(e) => onFormChange({ ...form, notes: e.target.value })} placeholder="Anything important" className="mt-2" />
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
