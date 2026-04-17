"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export interface VisaForm {
  country: string;
  visaType: string;
  entryDate: string;
  exitDate: string;
  maxStayDays: string;
  expiryDate: string;
  notes: string;
}

export interface VisaRecord {
  id: string;
  country: string;
  visaType: string;
  entryDate: string;
  exitDate: string;
  maxStayDays: number | null;
  expiryDate: string;
  notes: string;
  createdAt: string;
}

const emptyForm: VisaForm = {
  country: "",
  visaType: "",
  entryDate: "",
  exitDate: "",
  maxStayDays: "",
  expiryDate: "",
  notes: "",
};

interface VisaRow {
  id: string;
  country: string;
  visa_type: string | null;
  entry_date: string | null;
  exit_date: string | null;
  max_stay_days: number | null;
  expiry_date: string | null;
  notes: string | null;
  created_at: string;
}

function normalizeRow(row: VisaRow): VisaRecord {
  return {
    id: row.id,
    country: row.country,
    visaType: row.visa_type ?? "",
    entryDate: row.entry_date ?? "",
    exitDate: row.exit_date ?? "",
    maxStayDays: row.max_stay_days ?? null,
    expiryDate: row.expiry_date ?? "",
    notes: row.notes ?? "",
    createdAt: row.created_at,
  };
}

export function useVisaRecords({ user }: { user: User | null }) {
  const [visas, setVisas] = useState<VisaRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<VisaForm>(emptyForm);

  useEffect(() => {
    if (!user) {
      setVisas([]);
      setLoading(false);
      return;
    }

    const userId = user.id;
    let isMounted = true;
    setLoading(true);

    async function load() {
      const { data, error } = await supabase
        .from("visa_records")
        .select("*")
        .eq("user_id", userId)
        .order("entry_date", { ascending: false });

      if (!isMounted) return;
      if (!error && data) {
        setVisas((data as VisaRow[]).map(normalizeRow));
      }
      setLoading(false);
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

  function openEditModal(visa: VisaRecord): void {
    setEditingId(visa.id);
    setForm({
      country: visa.country,
      visaType: visa.visaType,
      entryDate: visa.entryDate,
      exitDate: visa.exitDate,
      maxStayDays: visa.maxStayDays !== null ? String(visa.maxStayDays) : "",
      expiryDate: visa.expiryDate,
      notes: visa.notes,
    });
    setOpen(true);
  }

  async function saveVisa(): Promise<void> {
    if (!user) return;

    const payload = {
      country: form.country.trim(),
      visa_type: form.visaType.trim() || null,
      entry_date: form.entryDate || null,
      exit_date: form.exitDate || null,
      max_stay_days: form.maxStayDays ? Number(form.maxStayDays) : null,
      expiry_date: form.expiryDate || null,
      notes: form.notes.trim() || null,
    };

    if (editingId) {
      const { data, error } = await supabase
        .from("visa_records")
        .update(payload)
        .eq("id", editingId)
        .eq("user_id", user.id)
        .select()
        .single();

      if (!error && data) {
        const updated = normalizeRow(data as VisaRow);
        setVisas((prev) => prev.map((v) => (v.id === editingId ? updated : v)));
      }
    } else {
      const { data, error } = await supabase
        .from("visa_records")
        .insert([{ ...payload, id: crypto.randomUUID(), user_id: user.id }])
        .select()
        .single();

      if (!error && data) {
        const created = normalizeRow(data as VisaRow);
        setVisas((prev) => [created, ...prev]);
      }
    }

    setOpen(false);
  }

  async function deleteVisa(id: string): Promise<void> {
    if (!user) return;
    const { error } = await supabase
      .from("visa_records")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (!error) {
      setVisas((prev) => prev.filter((v) => v.id !== id));
    }
  }

  return {
    visas,
    loading,
    open,
    editingId,
    form,
    setOpen,
    setForm,
    openNewModal,
    openEditModal,
    saveVisa,
    deleteVisa,
  };
}
