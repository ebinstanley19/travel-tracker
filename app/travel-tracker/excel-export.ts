import * as XLSX from "xlsx";
import { sortEntries, formatMonth, formatYear } from "@/app/travel-tracker/date-utils";
import type { TravelEntry } from "@/app/travel-tracker/types";

export function exportToExcel(entries: TravelEntry[]): void {
  const rows = sortEntries(entries).map((item) => ({
    Year: formatYear(item.date || item.endDate),
    Month: formatMonth(item.date || item.endDate),
    Date: item.date,
    "To Date": item.endDate,
    From: item.from,
    To: item.to,
    Country: item.country,
    City: item.purpose,
    Purpose: item.notes,
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Travel Records");
  XLSX.writeFile(wb, "travel-history.xlsx");
}

export function downloadImportTemplate(): void {
  const templateRows = [
    {
      "From Date": "2026-03-14",
      "To Date": "2026-03-16",
      From: "Singapore",
      To: "Malaysia",
      Country: "Malaysia",
      City: "Kuala Lumpur",
      Purpose: "Vacation",
    },
  ];

  const instructionsRows = [
    { Note: "Use this template to import trips." },
    { Note: "Required columns: From Date, From, To." },
    { Note: "Optional columns: To Date, Country, City, Purpose." },
    { Note: "Date format: YYYY-MM-DD." },
    { Note: "One row = one trip. For same-day trips, keep From Date and To Date the same." },
  ];

  const templateSheet = XLSX.utils.json_to_sheet(templateRows);
  const instructionsSheet = XLSX.utils.json_to_sheet(instructionsRows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, templateSheet, "Import Template");
  XLSX.utils.book_append_sheet(workbook, instructionsSheet, "Instructions");
  XLSX.writeFile(workbook, "route-book-import-template.xlsx");
}
