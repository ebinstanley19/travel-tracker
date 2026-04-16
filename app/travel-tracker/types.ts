export interface TravelEntry {
  id: string;
  date: string;
  endDate: string;
  from: string;
  to: string;
  country: string;
  purpose: string;
  notes: string;
}

export interface TravelForm {
  date: string;
  endDate: string;
  from: string;
  fromCountry: string;
  to: string;
  toCountry: string;
  purpose: string;
  notes: string;
}

export type ParsedDateResult =
  | { type: "single"; startDay: number }
  | { type: "range"; startDay: number; endDay: number };

export interface YearMonthGroup {
  year: string;
  months: { month: string; items: TravelEntry[] }[];
}
