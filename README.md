# Route Book

A private travel history tracker. Log every trip you've taken and explore your history across a timeline, table, and interactive map.

> Deploy your own instance and keep your data private, or [request access](#self-hosting) to the hosted version.

If this app is useful to you, consider supporting it — any amount helps.

[![Donate via PayPal](https://img.shields.io/badge/Donate-PayPal-0070ba?logo=paypal&logoColor=white)](https://www.paypal.me/ebinstanley19)

---

## Features

- Add trips with date ranges, origin, destination, and notes
- Timeline view grouped by year and month
- Table view with sortable columns and bulk delete
- Interactive map with country bubbles sized by visit count
- Insights tab with travel statistics
- Filter by country, year, or free-text search
- Import trips from Excel (.xlsx) or CSV
- Export full history to Excel
- Four colour themes: Sand, Ocean, Sunset, White
- Password reset via email
- Account deletion with full data wipe

---

## Tech Stack

| Layer | Technology |
| ----- | ---------- |
| Framework | Next.js (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Auth & Database | Supabase |
| Maps | Leaflet + react-leaflet |
| Excel | SheetJS |
| Hosting | Vercel |

---

## Self-hosting

See [docs/deployment.md](docs/deployment.md) for full setup instructions covering Supabase, local development, and Vercel deployment.

Prefer not to self-host? You can request access to the hosted version by emailing [ebinstnly@gmail.com](mailto:ebinstnly@gmail.com).

---

## License

MIT
