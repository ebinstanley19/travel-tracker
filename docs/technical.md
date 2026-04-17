# Technical Reference

---

## File Structure

```
travel-tracker/
├── app/
│   ├── page.tsx                        # Main dashboard + auth gate
│   ├── layout.tsx                      # Root layout, metadata, fonts
│   ├── manifest.ts                     # PWA manifest
│   ├── icon.tsx                        # App icon (Next.js ImageResponse)
│   ├── apple-icon.tsx                  # Apple touch icon
│   ├── globals.css                     # Tailwind base + theme variables
│   │
│   ├── auth/
│   │   └── reset-password/page.tsx     # Password reset flow
│   │
│   ├── profile/
│   │   └── page.tsx                    # Profile settings page
│   │
│   ├── api/
│   │   └── delete-account/route.ts     # DELETE handler for account deletion
│   │
│   └── travel-tracker/
│       ├── hooks/
│       │   ├── use-auth.ts             # Auth state + operations
│       │   ├── use-travel-entries.ts   # CRUD for travel records
│       │   ├── use-filters.ts          # Search, filter, group, stats
│       │   └── use-country-coordinates.ts  # Geocoding + coordinate cache
│       │
│       ├── auth-card.tsx               # Login/signup form
│       ├── entry-dialog.tsx            # Add/edit trip modal
│       ├── filters-card.tsx            # Search + filter controls
│       ├── stats-cards.tsx             # Stat summary cards
│       ├── timeline-view.tsx           # Year/month grouped timeline
│       ├── table-view.tsx              # Sortable table with bulk delete
│       ├── map-view.tsx                # SSR-safe wrapper for map
│       ├── map-view-client.tsx         # Interactive Leaflet map
│       ├── empty-state.tsx             # Placeholder when no entries
│       │
│       ├── utils.ts                    # Re-exports from date-utils
│       ├── date-utils.ts               # Date/location helpers
│       ├── excel-import.ts             # Excel/CSV parser
│       ├── excel-export.ts             # Excel export + template
│       ├── countries.ts                # Country list + aliases
│       ├── brand-config.ts             # App name + logo variant
│       └── types.ts                    # Shared TypeScript types
│
├── lib/
│   ├── supabase.ts                     # Supabase client singleton
│   └── utils.ts                        # cn() utility (clsx + tailwind-merge)
│
├── components/
│   └── ui/                             # shadcn/ui components
│
├── next.config.ts                      # Next.js config + security headers
├── tailwind.config.ts                  # Tailwind config
├── tsconfig.json
└── package.json
```

---

## Data Model

### TravelEntry

The core record representing a single trip.

```typescript
interface TravelEntry {
  id: string;         // UUID
  date: string;       // ISO 8601 start date (YYYY-MM-DD)
  endDate: string;    // ISO 8601 end date — may equal date for same-day trips
  from: string;       // Stored as "City | Country" e.g. "London | United Kingdom"
  to: string;         // Stored as "City | Country" e.g. "Paris | France"
  country: string;    // Legacy fallback country field
  purpose: string;    // City/location label — shown in map popups
  notes: string;      // Free-form notes or trip purpose
}
```

### TravelForm

Used to drive the add/edit dialog. Has separate city and country fields, which are combined into the `from`/`to` strings on save.

```typescript
interface TravelForm {
  date: string;
  endDate: string;
  from: string;          // City (without country)
  fromCountry: string;   // Country only
  to: string;            // City (without country)
  toCountry: string;     // Country only
  purpose: string;
  notes: string;
}
```

### Location string format

Locations are stored as `"City | Country"` using `LOCATION_SEPARATOR = " | "` (defined in `date-utils.ts`). Parsing helpers:

- `getCountryFromLocation(value)` — extracts the country portion
- `displayLocation(value)` — formats as `"City (Country)"` for display
- `getEntryCountries(entry)` — returns all unique countries touched by an entry

---

## Hooks

### `useAuth`

Manages all authentication state and operations. Used exclusively in `app/page.tsx`.

```
useAuth() → {
  user: User | null
  authLoading: boolean
  authMode: "login" | "signup"
  authFullName, authEmail, authPassword: string
  authError, authInfo: string
  authPending: boolean
  setAuthMode, setAuthFullName, setAuthEmail, setAuthPassword
  handleAuthSubmit()      — sign up or log in
  handleForgotPassword()  — send password reset email
  handleSignOut()         — sign out globally
}
```

Bootstrap sequence on mount:
1. `supabase.auth.getSession()` — reads existing session
2. `supabase.auth.onAuthStateChange()` — subscribes to future changes
3. Both update `user` state; `authLoading` is set to false when either resolves

---

### `useTravelEntries`

Fetches and manages the user's travel records from Supabase.

```
useTravelEntries({ user, homeCountry }) → {
  entries: TravelEntry[]
  entriesLoading: boolean
  open: boolean
  editingId: string | null
  form: TravelForm
  deletingSelected: boolean
  setOpen(open)
  setForm(form)
  openNewModal()            — open dialog pre-filled with home country
  openEditModal(entry)      — open dialog with existing entry data
  saveEntry()               — insert or update in Supabase
  deleteEntry(id)           — delete a single entry
  deleteSelectedEntries(ids[]) — batch delete
  importEntries(file)       — parse Excel/CSV and bulk insert
}
```

All Supabase queries include `.eq("user_id", user.id)` — data is always scoped to the authenticated user. RLS in Supabase provides the server-side enforcement.

---

### `useFilters`

Applies search, country, and year filters to entries. Also computes stats and the grouped structure for the timeline.

```
useFilters({ entries, homeCountry }) → {
  search: string
  countryFilter: string     — "all" or a country name
  yearFilter: string        — "all" or a 4-digit year string
  countries: string[]       — unique countries across all entries
  years: string[]           — unique years, descending
  filtered: TravelEntry[]   — entries matching all active filters
  groupedByYearMonth: YearMonthGroup[]
  stats: {
    totalTrips: number
    uniqueCountries: number
    yearsCovered: number
    topCountry: string
    topCountryVisits: number
  }
  setSearch, setCountryFilter, setYearFilter
}
```

Stats exclude `homeCountry` from the top country calculation. All derived values are memoised with `useMemo`.

---

### `useCountryCoordinates`

Resolves `{ lat, lng }` coordinates for a set of countries. Used by the map.

```
useCountryCoordinates(countryCounts: Record<string, number>) → {
  coordinates: Record<string, { lat: number, lng: number }>
  resolving: boolean
}
```

Lookup sequence for each country:
1. Check localStorage cache (`routebook-country-coordinates-v1`)
2. Try `restcountries.com` with full-text match
3. Try `restcountries.com` with loose match
4. Check `MAP_SEARCH_ALIASES` variants
5. Each fetch has a 5-second timeout and falls through on failure

Results are merged back into the cache after each batch.

---

## Components

### `AuthCard`

Renders the login/signup form. Switches between modes via a toggle link. Exposes all form values and callbacks as props — all state lives in `useAuth`.

### `EntryDialog`

A shadcn `Dialog` wrapping the add/edit form. Renders two date pickers, city/country inputs for both origin and destination, and notes. All state is passed in via `form` and `onFormChange`.

### `FiltersCard`

A horizontal bar with a text search input and two `Select` dropdowns (country, year). Updates are pushed up immediately via callbacks.

### `StatsCards`

Four static cards. Purely presentational — receives all values as props from `useFilters`.

### `TimelineView`

Groups entries by year → month. Each year section has a toggle to collapse/expand. Entry cards show the date range, from/to, city, and purpose. The **Options** popover on each card reveals Edit and Delete.

### `TableView`

A scrollable table with column headers. The **From date** column is sortable. Rows have checkboxes; selected rows can be deleted in bulk. State (sort direction, selected IDs) lives inside the component.

### `MapView` + `MapViewClient`

`MapView` is a thin SSR-safe wrapper that dynamically imports `MapViewClient` to avoid Leaflet's `window` dependency at server render time.

`MapViewClient` renders a Leaflet map with:
- Circle markers per country, radius proportional to visit count
- Click handler to select a country and zoom the map
- A sidebar listing the top 10 countries
- Popups showing visit count and list of cities visited

### `EmptyState`

Shown inside the timeline and table views when the filtered result is empty. Offers Add and Import actions.

---

## Utilities

### `date-utils.ts`

Core helpers shared across hooks and components:

| Export | Description |
|--------|-------------|
| `LOCATION_SEPARATOR` | `" \| "` — delimiter for stored location strings |
| `formatMonth(date)` | `"2024-03-14"` → `"March"` |
| `formatYear(date)` | `"2024-03-14"` → `"2024"` |
| `prettyDate(date)` | `"2024-03-14"` → `"14 Mar 2024"` |
| `prettyDateRange(start, end)` | Formats a range, collapses if same day |
| `sortEntries(entries)` | Descending by start date |
| `monthOrder` | Array of month names Jan–Dec |
| `displayLocation(value)` | `"Paris \| France"` → `"Paris (France)"` |
| `getCountryFromLocation(value)` | Extracts country from stored location string |
| `getEntryCountries(entry)` | Returns all unique countries in an entry |

### `excel-import.ts`

`parseWorkbook(file, onLoad)` reads an uploaded file and calls `onLoad` with a `TravelEntry[]`.

Supported formats:
1. **Flat table** — a sheet named "Travel Records" with columns: Date, End Date, From, From Country, To, To Country, City, Purpose
2. **Year sheets** — sheets named by year (e.g., `2024`) with month subheadings and entries under each

### `excel-export.ts`

- `exportToExcel(entries)` — exports full history as `travel-history.xlsx`
- `downloadImportTemplate()` — generates and downloads a pre-filled import template with instructions

### `countries.ts`

- `COUNTRY_OPTIONS` — alphabetical list of ~200 country names used in dropdowns
- `normalizeCountryName(value)` — maps short codes and aliases to canonical names (`"SG"` → `"Singapore"`)
- `COUNTRY_ALIASES` — two-letter code → canonical name
- `MAP_SEARCH_ALIASES` — canonical name → variants tried when querying restcountries API

---

## Theming

Three themes are available: `sand`, `ocean`, `sunset`. The active theme is stored in localStorage under `routebook-theme` and applied as a `data-theme` attribute on `<html>`. CSS variables in `globals.css` map each theme to a set of colours consumed by Tailwind.

---

## Client/Server Boundary

All data fetching uses the Supabase JS client and runs client-side. The only server-side code is `app/api/delete-account/route.ts`, which requires the `SUPABASE_SERVICE_ROLE_KEY` to call the Supabase admin API.

The Leaflet map is dynamically imported (`next/dynamic`) to avoid SSR errors from its use of `window`.
