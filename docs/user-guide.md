# User Guide

---

## Signing Up & Signing In

Navigate to the app root (`/`). If you are not signed in, you will see the sign-in page.

- **Sign in** — enter your email and password and press Enter or click the button.
- **Create an account** — switch to Sign Up, fill in your full name, email, and password (minimum 8 characters). You will receive a confirmation email before you can log in.
- **Forgot password** — enter your email, click Forgot password. A reset link will arrive in your inbox and take you to the password reset page.

---

## Adding a Trip

Click **Add entry** in the top toolbar, or the **Quick add** button on mobile (bottom-right corner).

In the dialog, fill in:

| Field | Description |
|-------|-------------|
| From date | Start date of the trip |
| To date | End date (can be same as start for a one-day trip) |
| From | City or place you departed from |
| From country | Country of departure |
| To | City or place you travelled to |
| To country | Destination country |
| City / location | A label for where you were (used in map popups) |
| Purpose / notes | Optional — anything you want to remember about the trip |

Click **Save** to add the entry. If the end date is before the start date, they will be swapped automatically.

---

## Editing and Deleting a Trip

**Timeline view:** Each entry card has an **Options** button. Click it to reveal Edit and Delete.

**Table view:** Click the row's checkbox to select it, then use the **Delete selected** button for batch deletion. Individual editing is not available from the table — switch to timeline view.

---

## Searching and Filtering

The filters bar sits between the stats and the tabs.

- **Search** — matches against country names, locations, cities, and notes.
- **Country** — filters to a single country across all views.
- **Year** — filters to a specific year.

All three filters work together. Clear a filter by selecting "All" from its dropdown or clearing the search field.

---

## Views

### Timeline View

Entries are grouped by year, then by month, in descending order (newest first). The first two years are expanded by default; click any year heading to toggle it.

Each entry shows:
- Date or date range
- From → To locations
- City and purpose (if set)
- Badges for multi-day trips or trips that span month boundaries

### Table View

A sortable, scrollable table showing all filtered entries. Click the **From date** column header to toggle ascending/descending sort. Select one or more rows using the checkboxes, then click **Delete selected** to remove them in bulk.

### Map Mode

Countries you have visited appear as circle markers. The size of each circle reflects how many times you have been there.

- Click a circle to select that country and see a popup with visit count and cities visited.
- The selected country also appears highlighted in the **Top countries** sidebar on the right.
- Click the sidebar list items to jump to a country on the map.
- Click the map background to clear the selection.

---

## Importing from Excel

Click **Import Excel** in the toolbar (or the link in the empty state). Select a `.xlsx`, `.xls`, or `.csv` file up to 10 MB.

The importer recognises two formats:

**Format 1 — Flat table** (sheet named "Travel Records")

| Date | End Date | From | From Country | To | To Country | City | Purpose |
|------|----------|------|-------------|-----|-----------|------|---------|
| 2024-03-14 | 2024-03-16 | London | United Kingdom | Paris | France | Paris | Holiday |

**Format 2 — Year/month sheets**

Each sheet is named with a year (e.g., `2024`). Rows contain month headings, and entries are listed under each month.

To get a pre-filled template with instructions, go to **Settings → Download template**.

---

## Exporting to Excel

Click **Export Excel** in the toolbar. A file named `travel-history.xlsx` will download containing all your current entries (not filtered — always the full history).

---

## Settings

Click **Settings** in the top toolbar to open the settings menu.

- **Theme** — choose Sand (warm), Ocean (blue), or Sunset (warm-dark). Your preference is saved in the browser.
- **Download template** — downloads the Excel import template.
- **Profile** — opens the profile settings page.
- **Log out** — signs you out on all devices.

---

## Profile Settings

Navigate to **Settings → Profile** or go to `/profile`.

### Account

Update your full name or home country. Click **Save profile** to apply.

The home country is stored in your browser and used to:
- Pre-fill the "From country" field when adding a trip
- Exclude your home country from the "Top country" stat card

### Reset Password

Expand the **Reset Password** section. Enter your current password, then your new password (minimum 8 characters) twice. Click **Update password**.

### Delete Account

Expand **Delete Account**. Click the red button, then confirm by entering your current password. This permanently deletes all your trips and your account. It cannot be undone.

---

## Stats Cards

Four cards appear at the top of the dashboard:

| Card | What it shows |
|------|--------------|
| Movements | Total number of trip entries |
| Countries | Number of unique countries visited |
| Years active | Number of distinct years with at least one trip |
| Top country | Most-visited country (home country excluded) |

Stats reflect the currently active filters.
