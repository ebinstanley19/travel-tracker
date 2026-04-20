# Route Book — Documentation

Route Book is a private travel history tracker. It lets you log every trip you've taken, then search and explore that history by country, year, date range, and more — across a timeline view, a table, and an interactive map.

---

## Table of Contents

- [User Guide](./user-guide.md) — how to use the app day-to-day
- [Technical Reference](./technical.md) — architecture, file structure, hooks, components
- [API & Database](./api-database.md) — Supabase schema, RLS policies, API routes
- [Deployment Guide](./deployment.md) — setting up and deploying from scratch

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Auth & Database | Supabase (PostgreSQL + GoTrue) |
| Maps | Leaflet + react-leaflet |
| Excel | xlsx (SheetJS) |
| Icons | lucide-react |
| Hosting | Vercel |

---

## Key Features

- Add, edit, and delete trip entries with date ranges, origin, destination, and notes
- Timeline view grouped by year and month — current year auto-expands
- Table view with multi-select batch delete and date sorting; compact card layout on mobile
- Interactive map with country bubbles sized by visit count
- Insights tab with statistics and 25 milestone badges (trips, countries, continents, nights, years, long trips)
- Upcoming trips section showing future entries with countdown and options
- Currently traveling banner when today falls within an active trip's date range
- Notification bell for milestones, upcoming reminders (≤ 7 days), long trips (≥ 14 nights), data gaps, and travel anniversaries
- Filter by country, year, date range, or free-text search
- Import trips from Excel (.xlsx) or CSV
- Export full history to Excel
- Four visual themes: Sand, Ocean, Sunset, White
- Password reset via email
- Account deletion with full data cleanup
- Monthly automated email backup (Excel attachment via Mailjet)
- PWA — installable on iOS and Android
- Web Push Notifications — daily trip reminders delivered to your device even when the app is closed (iOS 16.4+, Android)
