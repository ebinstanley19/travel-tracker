"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Pencil, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useVisaRecords } from "@/app/travel-tracker/hooks/use-visa-records";
import type { VisaRecord } from "@/app/travel-tracker/hooks/use-visa-records";
import { COUNTRY_OPTIONS } from "@/app/travel-tracker/countries";
import { supabase } from "@/lib/supabase";
import { prettyDate } from "@/app/travel-tracker/utils";
import type { User } from "@supabase/supabase-js";

function daysUntil(dateStr: string): number | null {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function rowHighlight(visa: VisaRecord): string {
  if (!visa.expiryDate) return "";
  const days = daysUntil(visa.expiryDate);
  if (days === null) return "";
  if (days < 0) return "bg-red-50";
  if (days <= 30) return "bg-amber-50";
  return "";
}

function ExpiryBadge({ expiryDate }: { expiryDate: string }) {
  if (!expiryDate) return <span className="text-slate-400">—</span>;
  const days = daysUntil(expiryDate);
  if (days === null) return <span>{prettyDate(expiryDate)}</span>;
  if (days < 0) {
    return <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">Expired {prettyDate(expiryDate)}</span>;
  }
  if (days <= 30) {
    return <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">{prettyDate(expiryDate)} ({days}d left)</span>;
  }
  return <span>{prettyDate(expiryDate)}</span>;
}

function VisaModal({
  open,
  editingId,
  form,
  onClose,
  onChange,
  onSave,
}: {
  open: boolean;
  editingId: string | null;
  form: ReturnType<typeof useVisaRecords>["form"];
  onClose: () => void;
  onChange: (form: ReturnType<typeof useVisaRecords>["form"]) => void;
  onSave: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-white/60 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 p-5">
          <h2 className="text-lg font-semibold">{editingId ? "Edit visa record" : "Add visa record"}</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1 hover:bg-slate-100">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-4 p-5">
          <div className="space-y-2">
            <Label>Country</Label>
            <Select value={form.country || "none"} onValueChange={(v) => onChange({ ...form, country: v === "none" ? "" : v })}>
              <SelectTrigger className="h-10 w-full">
                <SelectValue placeholder="Select country" />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                <SelectItem value="none">Select country</SelectItem>
                {COUNTRY_OPTIONS.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Visa type</Label>
            <Input
              value={form.visaType}
              onChange={(e) => onChange({ ...form, visaType: e.target.value })}
              placeholder="e.g. Tourist, Work, Student"
            />
          </div>
          <div className="space-y-2">
            <Label>Entry date</Label>
            <Input type="date" value={form.entryDate} onChange={(e) => onChange({ ...form, entryDate: e.target.value })} className="w-full min-w-0" />
          </div>
          <div className="space-y-2">
            <Label>Exit date</Label>
            <Input type="date" value={form.exitDate} onChange={(e) => onChange({ ...form, exitDate: e.target.value })} className="w-full min-w-0" />
          </div>
          <div className="space-y-2">
            <Label>Max stay (days)</Label>
            <Input
              type="number"
              min={0}
              value={form.maxStayDays}
              onChange={(e) => onChange({ ...form, maxStayDays: e.target.value })}
              placeholder="e.g. 90"
            />
          </div>
          <div className="space-y-2">
            <Label>Visa expiry date</Label>
            <Input type="date" value={form.expiryDate} onChange={(e) => onChange({ ...form, expiryDate: e.target.value })} className="w-full min-w-0" />
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <Input value={form.notes} onChange={(e) => onChange({ ...form, notes: e.target.value })} placeholder="Any notes (optional)" />
          </div>
        </div>
        <div className="flex gap-2 border-t border-slate-100 p-5">
          <Button onClick={onSave} disabled={!form.country}>Save</Button>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </div>
  );
}

function DeleteConfirm({ visa, onConfirm, onCancel }: { visa: VisaRecord; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative z-10 w-full max-w-sm rounded-2xl border border-white/60 bg-white p-6 shadow-2xl space-y-4">
        <h2 className="text-lg font-semibold">Delete visa record?</h2>
        <p className="text-sm text-slate-600">
          Remove the <strong>{visa.visaType || "visa"}</strong> record for <strong>{visa.country}</strong>? This cannot be undone.
        </p>
        <div className="flex gap-2">
          <Button variant="destructive" onClick={onConfirm}>Delete</Button>
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
        </div>
      </div>
    </div>
  );
}

export default function VisaPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [deletingVisa, setDeletingVisa] = useState<VisaRecord | null>(null);

  const visa = useVisaRecords({ user });

  useEffect(() => {
    async function checkAuth() {
      const { data: { user: u } } = await supabase.auth.getUser();
      if (!u) { router.push("/"); return; }
      setUser(u);
      setAuthLoading(false);
    }
    void checkAuth();
  }, [router]);

  if (authLoading || visa.loading) {
    return (
      <div className="min-h-screen p-4 md:p-8">
        <div className="mx-auto max-w-4xl space-y-4">
          {[1, 2].map((i) => <div key={i} className="h-32 animate-pulse rounded-2xl bg-white/70" />)}
        </div>
      </div>
    );
  }

  const cardCls = "rounded-2xl border border-white/60 bg-white/80 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl";

  async function handleDelete(v: VisaRecord) {
    await visa.deleteVisa(v.id);
    setDeletingVisa(null);
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="mx-auto max-w-4xl space-y-6">

        <div className={`flex items-center justify-between p-5 ${cardCls}`}>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Visa Tracker</h1>
            <p className="mt-1 text-sm text-muted-foreground">Track your visas and stay limits.</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={visa.openNewModal}>
              <Plus className="mr-2 h-4 w-4" /> Add visa
            </Button>
            <Button asChild variant="outline">
              <Link href="/"><ArrowLeft className="mr-2 h-4 w-4" />Dashboard</Link>
            </Button>
          </div>
        </div>

        <Card className={cardCls}>
          <CardHeader>
            <CardTitle>Visa records</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {visa.visas.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <p className="text-sm text-slate-400">No visa records yet.</p>
                <Button className="mt-4" onClick={visa.openNewModal}><Plus className="mr-2 h-4 w-4" />Add your first visa</Button>
              </div>
            ) : (
              <div className="w-full overflow-x-auto">
                <div className="min-w-[800px]">
                  <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr_80px_1.5fr_60px] gap-3 border-b border-slate-200/80 bg-[linear-gradient(135deg,rgba(16,33,58,0.98),rgba(48,89,152,0.92))] px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-white/85">
                    <div>Country</div>
                    <div>Type</div>
                    <div>Entry</div>
                    <div>Exit</div>
                    <div>Max stay</div>
                    <div>Expiry</div>
                    <div />
                  </div>
                  {visa.visas.map((v) => (
                    <div
                      key={v.id}
                      className={`grid grid-cols-[1.5fr_1fr_1fr_1fr_80px_1.5fr_60px] gap-3 border-b border-slate-100 px-5 py-3 text-sm transition-colors hover:bg-slate-50/80 ${rowHighlight(v)}`}
                    >
                      <div className="font-medium text-slate-800">{v.country}</div>
                      <div className="text-slate-600">{v.visaType || "—"}</div>
                      <div>{v.entryDate ? prettyDate(v.entryDate) : "—"}</div>
                      <div>{v.exitDate ? prettyDate(v.exitDate) : "—"}</div>
                      <div className="tabular-nums">{v.maxStayDays !== null ? `${v.maxStayDays}d` : "—"}</div>
                      <div><ExpiryBadge expiryDate={v.expiryDate} /></div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => visa.openEditModal(v)}
                          className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                          aria-label="Edit"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingVisa(v)}
                          className="rounded-lg p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                          aria-label="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

      </div>

      <VisaModal
        open={visa.open}
        editingId={visa.editingId}
        form={visa.form}
        onClose={() => visa.setOpen(false)}
        onChange={visa.setForm}
        onSave={visa.saveVisa}
      />

      {deletingVisa && (
        <DeleteConfirm
          visa={deletingVisa}
          onConfirm={() => handleDelete(deletingVisa)}
          onCancel={() => setDeletingVisa(null)}
        />
      )}
    </div>
  );
}
