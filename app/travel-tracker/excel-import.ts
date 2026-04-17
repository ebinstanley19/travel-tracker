import * as XLSX from "xlsx";
import { normalizeCountryName } from "@/app/travel-tracker/countries";
import { sortEntries } from "@/app/travel-tracker/date-utils";
import type { ParsedDateResult, TravelEntry } from "@/app/travel-tracker/types";

function safeText(value: unknown): string {
  return (value ?? "").toString().trim();
}

function makeId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function formatImportedDate(rawDate: unknown): string {
  if (rawDate instanceof Date && !Number.isNaN(rawDate.getTime())) {
    return rawDate.toISOString().slice(0, 10);
  }

  if (typeof rawDate === "number") {
    const parsed = XLSX.SSF.parse_date_code(rawDate);
    if (parsed) {
      return `${parsed.y}-${String(parsed.m).padStart(2, "0")}-${String(parsed.d).padStart(2, "0")}`;
    }
  }

  const text = safeText(rawDate);
  if (!text) return "";

  const parsed = new Date(text);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }

  return text;
}

function normalizeRouteCountry(value: unknown): string {
  return normalizeCountryName(safeText(value));
}

function headerIndex(headers: string[], aliases: string[]): number {
  return headers.findIndex((header) => aliases.includes(header));
}

function parseFlatRows(rows: (string | number | Date)[][]): TravelEntry[] {
  const [headerRow, ...dataRows] = rows;
  const headers = (headerRow || []).map((cell) => safeText(cell).toLowerCase());

  const dateIndex = headerIndex(headers, ["date", "from date", "start date"]);
  const endDateIndex = headerIndex(headers, ["to date", "end date", "return date"]);
  const fromIndex = headerIndex(headers, ["from", "departure", "origin"]);
  const toIndex = headerIndex(headers, ["to", "destination"]);
  const countryIndex = headerIndex(headers, ["country", "destination country"]);
  const purposeIndex = headerIndex(headers, ["city", "visited city"]);
  const notesIndex = headerIndex(headers, ["purpose", "trip purpose", "notes", "note"]);

  if (dateIndex === -1 || fromIndex === -1 || toIndex === -1) {
    return [];
  }

  return dataRows
    .map((row) => {
      const from = normalizeRouteCountry(row[fromIndex]);
      const to = normalizeRouteCountry(row[toIndex]);
      const fallbackCountry = normalizeRouteCountry(row[countryIndex]);

      return {
        id: makeId(),
        date: formatImportedDate(row[dateIndex]),
        endDate: endDateIndex === -1 ? "" : formatImportedDate(row[endDateIndex]),
        from,
        to,
        country: fallbackCountry || to || from,
        purpose: safeText(row[purposeIndex]),
        notes: safeText(row[notesIndex]),
      };
    })
    .filter((entry) => entry.date || entry.endDate || entry.from || entry.to || entry.notes || entry.purpose);
}

export function parseWorkbook(file: File, onLoad: (entries: TravelEntry[]) => void): void {
  const monthMap: Record<string, number> = {
    january: 1, february: 2, march: 3, april: 4,
    may: 5, june: 6, july: 7, august: 8,
    september: 9, october: 10, november: 11, december: 12,
  };

  function pad(n: number): string {
    return String(n).padStart(2, "0");
  }

  function makeDate(year: number, month: number, day: number): string {
    return `${year}-${pad(month)}-${pad(day)}`;
  }

  function parseDateCell(rawDate: unknown, currentMonthNumber: number): ParsedDateResult | null {
    if (rawDate === null || rawDate === undefined || rawDate === "") return null;

    if (typeof rawDate === "number") {
      return { type: "single", startDay: rawDate };
    }

    if (rawDate instanceof Date && !Number.isNaN(rawDate.getTime())) {
      const monthFromCell = rawDate.getMonth() + 1;
      const dayFromCell = rawDate.getDate();

      if (monthFromCell !== currentMonthNumber) {
        return { type: "range", startDay: monthFromCell, endDay: dayFromCell };
      }

      return { type: "single", startDay: dayFromCell };
    }

    const text = safeText(rawDate);

    if (/^\d+$/.test(text)) {
      return { type: "single", startDay: Number(text) };
    }

    const rangeMatch = text.match(/^(\d{1,2})\s*-\s*(\d{1,2})$/);
    if (rangeMatch) {
      return { type: "range", startDay: Number(rangeMatch[1]), endDay: Number(rangeMatch[2]) };
    }

    return null;
  }

  const reader = new FileReader();

  reader.onload = (e: ProgressEvent<FileReader>) => {
    const data = e.target?.result;
    if (!data) return;

    const workbook = XLSX.read(data, { type: "array", cellDates: true });
    const parsedEntries: TravelEntry[] = [];

    workbook.SheetNames.forEach((sheetName: string) => {
      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json<(string | number | Date)[]>(sheet, {
        header: 1,
        defval: "",
      });

      const normalizedSheetName = safeText(sheetName).toLowerCase();
      const looksLikeFlatSheet = rows.length > 0 && rows[0]?.some((cell) => {
        const header = safeText(cell).toLowerCase();
        return ["date", "from", "to", "country", "purpose", "notes"].includes(header);
      });

      if (normalizedSheetName === "travel records" || looksLikeFlatSheet) {
        parsedEntries.push(...parseFlatRows(rows));
        return;
      }

      const year = Number(sheetName);
      if (Number.isNaN(year)) return;

      let currentMonth = "";

      for (let i = 3; i < rows.length; i++) {
        const row: (string | number | Date)[] = rows[i] || [];

        const monthCell = safeText(row[0]);
        const dateCell = row[1];
        const fromCell = normalizeRouteCountry(row[2]);
        const toCell = normalizeRouteCountry(row[3]);

        if (monthCell) {
          currentMonth = monthCell;
        }

        if (!currentMonth) continue;
        if (!dateCell && !fromCell && !toCell) continue;

        const monthNumber = monthMap[currentMonth.toLowerCase()];
        if (!monthNumber) continue;

        const parsedDate = parseDateCell(dateCell, monthNumber);
        if (!parsedDate) continue;

        if (parsedDate.type === "single") {
          parsedEntries.push({
            id: makeId(),
            date: makeDate(year, monthNumber, parsedDate.startDay),
            endDate: "",
            from: fromCell,
            to: toCell,
            country: toCell,
            purpose: "",
            notes: "",
          });
        }

        if (parsedDate.type === "range") {
          parsedEntries.push({
            id: makeId(),
            date: makeDate(year, monthNumber, parsedDate.startDay),
            endDate: makeDate(year, monthNumber, parsedDate.endDay),
            from: fromCell,
            to: toCell,
            country: toCell,
            purpose: "",
            notes: "Auto-imported date range",
          });
        }
      }
    });

    onLoad(sortEntries(parsedEntries));
  };

  reader.readAsArrayBuffer(file);
}
