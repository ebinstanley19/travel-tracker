import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { normalizeCountryName } from "@/app/travel-tracker/countries";
import { LOCATION_SEPARATOR, parseWorkbook, sortEntries } from "@/app/travel-tracker/utils";
import type { TravelEntry, TravelForm } from "@/app/travel-tracker/types";

const emptyForm: TravelForm = {
  date: "",
  endDate: "",
  from: "",
  fromCountry: "",
  to: "",
  toCountry: "",
  purpose: "",
  notes: "",
};

interface TravelRecordRow {
  id: string;
  date?: string | null;
  end_date?: string | null;
  from?: string | null;
  to?: string | null;
  country?: string | null;
  purpose?: string | null;
  notes?: string | null;
}

function isMissingEndDateColumn(errorMessage: string): boolean {
  return /end_date/i.test(errorMessage);
}

function normalizeStoredLocation(value: string): string {
  if (!value) return "";
  const parts = value.split(LOCATION_SEPARATOR);
  if (parts.length < 2) return normalizeCountryName(value);
  const place = parts[0]?.trim() ?? "";
  const country = normalizeCountryName(parts.slice(1).join(LOCATION_SEPARATOR).trim());
  return country ? `${place}${LOCATION_SEPARATOR}${country}` : place;
}

function normalizeRecord(item: TravelRecordRow): TravelEntry {
  return {
    id: item.id,
    date: item.date ?? "",
    endDate: item.end_date ?? "",
    from: normalizeStoredLocation(item.from ?? ""),
    to: normalizeStoredLocation(item.to ?? ""),
    country: normalizeCountryName(item.country ?? ""),
    purpose: item.purpose ?? "",
    notes: item.notes ?? "",
  };
}

function normalizeDateRange(start: string, end: string): { startDate: string; endDate: string } {
  const startDate = start || end;
  const endDate = end || start;
  if (!startDate || !endDate) return { startDate, endDate };
  const startTime = new Date(startDate).getTime();
  const endTime = new Date(endDate).getTime();
  if (Number.isNaN(startTime) || Number.isNaN(endTime) || startTime <= endTime) {
    return { startDate, endDate };
  }
  return { startDate: endDate, endDate: startDate };
}

function splitLocation(value: string): { place: string; country: string } {
  if (!value) return { place: "", country: "" };
  const parts = value.split(LOCATION_SEPARATOR);
  if (parts.length < 2) return { place: value, country: "" };
  return { place: parts[0]?.trim() ?? "", country: parts[1]?.trim() ?? "" };
}

export function useTravelEntries({ user, homeCountry = "" }: { user: User | null; homeCountry?: string }) {
  const [entries, setEntries] = useState<TravelEntry[]>([]);
  const [entriesLoading, setEntriesLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<TravelForm>(emptyForm);
  const [open, setOpen] = useState(false);
  const [deletingSelected, setDeletingSelected] = useState(false);

  useEffect(() => {
    if (!user) {
      setEntries([]);
      setOpen(false);
      setEditingId(null);
      setForm(emptyForm);
      setEntriesLoading(false);
      return;
    }

    const userId = user.id;
    let isMounted = true;
    setEntriesLoading(true);

    async function load() {
      const { data, error } = await supabase
        .from("travel_records")
        .select("*")
        .eq("user_id", userId)
        .order("date", { ascending: false });

      if (!isMounted) return;
      if (!error && data) {
        setEntries((data as TravelRecordRow[]).map(normalizeRecord));
      }
      setEntriesLoading(false);
    }

    void load();

    return () => {
      isMounted = false;
    };
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  function openNewModal(): void {
    setEditingId(null);
    setForm(emptyForm);
    setOpen(true);
  }

  function openEditModal(entry: TravelEntry): void {
    const fromLocation = splitLocation(entry.from || "");
    const toLocation = splitLocation(entry.to || "");
    setEditingId(entry.id);
    setForm({
      date: entry.date || "",
      endDate: entry.endDate || entry.date || "",
      from: fromLocation.country ? fromLocation.place : "",
      fromCountry: fromLocation.country || fromLocation.place || "",
      to: toLocation.country ? toLocation.place : "",
      toCountry: toLocation.country || toLocation.place || entry.country || "",
      purpose: entry.purpose || "",
      notes: entry.notes || "",
    });
    setOpen(true);
  }

  async function saveEntry(): Promise<void> {
    if (!user) return;
    const defaultFromCountry = (form.fromCountry || homeCountry || "").trim();

    if (!form.date && !form.endDate && !defaultFromCountry && !form.toCountry) return;

    const { startDate, endDate } = normalizeDateRange(form.date, form.endDate);
    const basePayload = {
      date: startDate,
      from: defaultFromCountry,
      to: form.toCountry.trim(),
      country: form.toCountry || defaultFromCountry,
      purpose: form.purpose || "",
      notes: form.notes || "",
    };

    if (editingId) {
      let { data, error } = await supabase
        .from("travel_records")
        .update({ ...basePayload, end_date: endDate || null })
        .eq("id", editingId)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error?.message && isMissingEndDateColumn(error.message)) {
        console.warn("travel_records.end_date column not found; falling back to single date storage.");
        const retry = await supabase
          .from("travel_records")
          .update(basePayload)
          .eq("id", editingId)
          .eq("user_id", user.id)
          .select()
          .single();
        data = retry.data;
        error = retry.error;
      }

      if (!error && data) {
        const updated = normalizeRecord(data as TravelRecordRow);
        setEntries((prev) => prev.map((e) => (e.id === editingId ? updated : e)));
      }
    } else {
      let { data, error } = await supabase
        .from("travel_records")
        .insert([{ ...basePayload, end_date: endDate || null, user_id: user.id }])
        .select()
        .single();

      if (error?.message && isMissingEndDateColumn(error.message)) {
        console.warn("travel_records.end_date column not found; falling back to single date storage.");
        const retry = await supabase
          .from("travel_records")
          .insert([{ ...basePayload, user_id: user.id }])
          .select()
          .single();
        data = retry.data;
        error = retry.error;
      }

      if (!error && data) {
        const created = normalizeRecord(data as TravelRecordRow);
        setEntries((prev) => sortEntries([created, ...prev]));
      }
    }

    setOpen(false);
  }

  async function deleteEntry(id: string): Promise<void> {
    if (!user) return;
    const { error } = await supabase
      .from("travel_records")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (!error) {
      setEntries((prev) => prev.filter((e) => e.id !== id));
    }
  }

  async function deleteSelectedEntries(ids: string[]): Promise<void> {
    if (!user || ids.length === 0) return;
    setDeletingSelected(true);
    const { error } = await supabase
      .from("travel_records")
      .delete()
      .in("id", ids)
      .eq("user_id", user.id);

    if (!error) {
      setEntries((prev) => prev.filter((e) => !ids.includes(e.id)));
    }
    setDeletingSelected(false);
  }

  function importEntries(file: File): void {
    if (!user) return;
    parseWorkbook(file, async (parsed: TravelEntry[]) => {
      const payload = parsed.map((item) => ({
        date: item.date,
        end_date: item.endDate || null,
        from: item.from,
        to: item.to,
        country: item.country,
        purpose: item.purpose,
        notes: item.notes,
        user_id: user.id,
      }));

      let { data, error } = await supabase.from("travel_records").insert(payload).select();

      if (error?.message && isMissingEndDateColumn(error.message)) {
        console.warn("travel_records.end_date column not found; falling back to single date storage for imports.");
        const fallbackPayload = parsed.map((item) => ({
          date: item.date,
          from: item.from,
          to: item.to,
          country: item.country,
          purpose: item.purpose,
          notes: item.notes,
          user_id: user.id,
        }));
        const retry = await supabase.from("travel_records").insert(fallbackPayload).select();
        data = retry.data;
        error = retry.error;
      }

      if (!error && data) {
        const normalized = (data as TravelRecordRow[]).map(normalizeRecord);
        setEntries((prev) => sortEntries([...normalized, ...prev]));
      } else if (error) {
        console.error("Import failed:", error);
      }
    });
  }

  return {
    entries,
    entriesLoading,
    editingId,
    form,
    open,
    deletingSelected,
    setOpen,
    setForm,
    openNewModal,
    openEditModal,
    saveEntry,
    deleteEntry,
    deleteSelectedEntries,
    importEntries,
  };
}
