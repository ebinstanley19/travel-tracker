import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function HelpPage() {
  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="mx-auto max-w-3xl space-y-6">

        <div className="flex items-center justify-between rounded-2xl border border-white/60 bg-white/80 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Help</h1>
            <p className="mt-1 text-sm text-muted-foreground">Everything you need to know about using Route Book.</p>
          </div>
          <Button asChild variant="outline">
            <Link href="/"><ArrowLeft className="mr-2 h-4 w-4" />Back to dashboard</Link>
          </Button>
        </div>

        <Card className="rounded-2xl border border-white/60 bg-white/80 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl">
          <CardHeader>
            <CardTitle>Adding a trip</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-700">
            <p>Click <strong>Add entry</strong> in the toolbar, or the <strong>Quick add</strong> button at the bottom-right on mobile.</p>
            <p>Fill in the form:</p>
            <ul className="space-y-1 pl-4 list-disc text-slate-600">
              <li><strong>From / To date</strong> — start and end of your trip. Same date for a one-day trip.</li>
              <li><strong>From / From country</strong> — city and country you departed from.</li>
              <li><strong>To / To country</strong> — city and country you arrived in.</li>
              <li><strong>City / location</strong> — a short label shown in map popups.</li>
              <li><strong>Purpose / notes</strong> — anything you want to remember (optional).</li>
            </ul>
            <p>Click <strong>Save</strong>. If the end date is before the start date they will be swapped automatically.</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-white/60 bg-white/80 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl">
          <CardHeader>
            <CardTitle>Editing and deleting</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-700">
            <p>In the <strong>Timeline view</strong>, each entry has an <strong>Options</strong> button. Click it to reveal Edit and Delete.</p>
            <p>In the <strong>Table view</strong>, tick the checkbox on one or more rows, then click <strong>Delete selected</strong> to remove them in bulk. To edit an entry, switch to the timeline view first.</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-white/60 bg-white/80 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl">
          <CardHeader>
            <CardTitle>Search and filters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-700">
            <p>The filters bar sits between the stats and the view tabs.</p>
            <ul className="space-y-1 pl-4 list-disc text-slate-600">
              <li><strong>Search</strong> — matches against countries, cities, locations, and notes.</li>
              <li><strong>Country</strong> — narrows to a single country across all views.</li>
              <li><strong>Year</strong> — narrows to a specific year.</li>
              <li><strong>From date / To date</strong> — filters entries that overlap a specific date range. You can set just one end of the range.</li>
            </ul>
            <p>All filters work together. Click <strong>Clear all</strong> to reset them at once, or clear each control individually.</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-white/60 bg-white/80 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl">
          <CardHeader>
            <CardTitle>Views</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 text-sm text-slate-700">
            <div className="space-y-2">
              <p className="font-semibold text-slate-800">Timeline</p>
              <p>Entries are grouped by year, then by month, newest first. The first two years are expanded by default — click any year heading to collapse or expand it. Each card shows the date range, origin, destination, city, and purpose.</p>
            </div>
            <div className="space-y-2">
              <p className="font-semibold text-slate-800">Table</p>
              <p>A scrollable table of all filtered entries. Click the <strong>From date</strong> column header to toggle sort order. Tick one or more rows and click <strong>Delete selected</strong> to remove them in bulk.</p>
            </div>
            <div className="space-y-2">
              <p className="font-semibold text-slate-800">Map</p>
              <p>Countries you have visited appear as circle markers — the larger the circle, the more visits. Click a circle to select that country and see a popup with visit count and cities. The <strong>Top countries</strong> sidebar on the right lists your most-visited countries; click any to jump to it on the map. Click the map background to clear the selection.</p>
            </div>
            <div className="space-y-2">
              <p className="font-semibold text-slate-800">Insights</p>
              <p>A summary of your travel history — total trips, countries, continents, nights abroad, trips by year, top countries, busiest months, continent breakdown, personal records, and milestone badges. Also accessible as a standalone page from <strong>Settings → Insights</strong>.</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-white/60 bg-white/80 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl">
          <CardHeader>
            <CardTitle>Importing and exporting</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-slate-700">
            <div className="space-y-2">
              <p className="font-semibold text-slate-800">Export</p>
              <p>Click <strong>Export Excel</strong> in the toolbar. A file named <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">travel-history.xlsx</code> will download with your full history.</p>
            </div>
            <div className="space-y-2">
              <p className="font-semibold text-slate-800">Import</p>
              <p>Click <strong>Import Excel</strong> and select a <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">.xlsx</code>, <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">.xls</code>, or <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">.csv</code> file up to 10 MB. The importer accepts two layouts:</p>
              <ul className="space-y-1 pl-4 list-disc text-slate-600">
                <li><strong>Flat table</strong> — a sheet named "Travel Records" with columns: Date, End Date, From, From Country, To, To Country, City, Purpose.</li>
                <li><strong>Year/month sheets</strong> — each sheet named by year (e.g. 2024), with month headings and entries listed below.</li>
              </ul>
              <p>To get a pre-filled template, go to <strong>Settings → Download template</strong>.</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-white/60 bg-white/80 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl">
          <CardHeader>
            <CardTitle>Profile and settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-slate-700">
            <div className="space-y-2">
              <p className="font-semibold text-slate-800">Theme</p>
              <p>Go to <strong>Settings → Profile → Theme</strong> and choose Sand, Ocean, Sunset, or White. Your preference is saved in the browser.</p>
            </div>
            <div className="space-y-2">
              <p className="font-semibold text-slate-800">Date format</p>
              <p>Go to <strong>Settings → Profile → Preferences</strong> and choose <strong>DD MMM YYYY</strong> (e.g. 17 Apr 2026) or <strong>MMM DD, YYYY</strong> (e.g. Apr 17, 2026). Applied across all views.</p>
            </div>
            <div className="space-y-2">
              <p className="font-semibold text-slate-800">Default view</p>
              <p>Go to <strong>Settings → Profile → Preferences</strong> and choose which tab opens by default when you sign in — Timeline, Table, Map, or Insights.</p>
            </div>
            <div className="space-y-2">
              <p className="font-semibold text-slate-800">Home country</p>
              <p>Set in <strong>Settings → Profile → Home country</strong>. It pre-fills the "From country" when adding a trip and is excluded from the Top country stat card.</p>
            </div>
            <div className="space-y-2">
              <p className="font-semibold text-slate-800">Password</p>
              <p>Go to <strong>Settings → Profile → Reset Password</strong>. Enter your current password and your new password (minimum 8 characters).</p>
            </div>
            <div className="space-y-2">
              <p className="font-semibold text-slate-800">Delete account</p>
              <p>Go to <strong>Settings → Profile → Delete Account</strong>. Confirm with your password. This permanently removes all your trips and your account and cannot be undone.</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-white/60 bg-white/80 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl">
          <CardHeader>
            <CardTitle>Visa tracker</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-700">
            <p>Access via <strong>Settings → Visa tracker</strong>. Store a record for each visa or entry permit:</p>
            <ul className="space-y-1 pl-4 list-disc text-slate-600">
              <li><strong>Country, Type</strong> — where the visa is for and what kind (Tourist, Work, etc.).</li>
              <li><strong>Entry / Exit date</strong> — when you entered and left.</li>
              <li><strong>Max stay</strong> — the maximum days permitted on that visa.</li>
              <li><strong>Expiry date</strong> — when the visa itself expires. Rows turn amber when expiry is within 30 days and red when already expired.</li>
            </ul>
            <p>Click the pencil icon to edit a record or the bin icon to delete it.</p>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
