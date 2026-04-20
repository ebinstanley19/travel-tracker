import Link from "next/link";
import { ArrowLeft, BookOpen, Download, Map, PlusCircle, Search, Settings, Shield, Pencil, LayoutList } from "lucide-react";
import { Button } from "@/components/ui/button";

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[11px] font-semibold text-slate-700">
      {children}
    </span>
  );
}

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/60 bg-white/80 shadow-[0_8px_30px_rgba(15,23,42,0.06)] backdrop-blur-xl">
      <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-white">
          <Icon className="h-4 w-4" />
        </div>
        <h2 className="font-semibold text-slate-900">{title}</h2>
      </div>
      <div className="px-5 py-4 text-sm text-slate-600">{children}</div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 py-2.5 border-b border-slate-100 last:border-0">
      <span className="w-32 shrink-0 font-medium text-slate-800">{label}</span>
      <span className="text-slate-600">{children}</span>
    </div>
  );
}

export default function HelpPage() {
  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="mx-auto max-w-2xl space-y-4">

        {/* Header */}
        <div className="rounded-2xl border border-white/60 bg-white/80 p-5 shadow-[0_8px_30px_rgba(15,23,42,0.06)] backdrop-blur-xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Route Book</p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">Help</h1>
              <p className="mt-1 text-sm text-slate-500">Everything you need to know about using Route Book.</p>
            </div>
            <Button asChild variant="outline" size="sm" className="shrink-0">
              <Link href="/"><ArrowLeft className="mr-1.5 h-3.5 w-3.5" />Back</Link>
            </Button>
          </div>
        </div>

        {/* Adding a trip */}
        <Section icon={PlusCircle} title="Adding a trip">
          <p className="mb-3">Tap <Kbd>Add entry</Kbd> in the toolbar or the bottom nav on mobile, then fill in the form.</p>
          <div className="rounded-xl border border-slate-100 bg-slate-50/60">
            <Row label="From / To date">Start and end of the trip. Use the same date for a one-day trip.</Row>
            <Row label="From country">Country you departed from.</Row>
            <Row label="To country">Country you arrived in.</Row>
            <Row label="City">Short label shown in map popups (optional).</Row>
            <Row label="Purpose">Anything you want to remember — Vacation, Work, Transit (optional).</Row>
          </div>
          <p className="mt-3 text-slate-500">If the end date is before the start date they are swapped automatically.</p>
        </Section>

        {/* Editing and deleting */}
        <Section icon={Pencil} title="Editing and deleting">
          <div className="space-y-3">
            <p><span className="font-medium text-slate-800">Timeline view —</span> each entry has an Options button. Click it to reveal <Kbd>Edit</Kbd> and <Kbd>Delete</Kbd>.</p>
            <p><span className="font-medium text-slate-800">Table view —</span> tick one or more rows and click <Kbd>Delete selected</Kbd> to remove them in bulk. To edit, switch to the Timeline view first.</p>
          </div>
        </Section>

        {/* Search and filters */}
        <Section icon={Search} title="Search and filters">
          <p className="mb-3">The filters panel is toggled via <Kbd>Search</Kbd> in the bottom nav on mobile, or always visible on desktop.</p>
          <div className="rounded-xl border border-slate-100 bg-slate-50/60">
            <Row label="Search">Matches countries, cities, locations, and notes.</Row>
            <Row label="Country">Narrows all views to a single country.</Row>
            <Row label="Year">Narrows to a specific year.</Row>
            <Row label="From / To date">Filters entries that overlap the chosen range. One end is enough.</Row>
          </div>
          <p className="mt-3 text-slate-500">All filters stack. Use <Kbd>Clear all</Kbd> to reset, or clear each field individually.</p>
        </Section>

        {/* Views */}
        <Section icon={Map} title="Views">
          <div className="space-y-4">
            {[
              {
                name: "Timeline",
                desc: "Entries grouped by year then month, newest first. The first two years expand by default — click any year heading to toggle it.",
              },
              {
                name: "Table",
                desc: "Scrollable table of all filtered entries. Click the From date header to toggle sort order. Tick rows to bulk-delete.",
              },
              {
                name: "Map",
                desc: "Visited countries shown as circles — larger means more visits. Click a circle to see a popup with visit count and cities. Click the map background to clear.",
              },
              {
                name: "Insights",
                desc: "Summary of your travel history — trips, countries, continents, nights abroad, top destinations, busiest months, and milestone badges.",
              },
            ].map(({ name, desc }) => (
              <div key={name} className="flex gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-600">
                  {name[0]}
                </span>
                <div>
                  <p className="font-medium text-slate-800">{name}</p>
                  <p className="mt-0.5 text-slate-500">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Import / Export */}
        <Section icon={Download} title="Importing and exporting">
          <div className="space-y-4">
            <div>
              <p className="font-medium text-slate-800">Export</p>
              <p className="mt-1 text-slate-500">Click <Kbd>Export Excel</Kbd> in the toolbar. Downloads <code className="rounded bg-slate-100 px-1 text-xs">travel-history.xlsx</code> with your full history.</p>
            </div>
            <div className="h-px bg-slate-100" />
            <div>
              <p className="font-medium text-slate-800">Import</p>
              <p className="mt-1 text-slate-500">Click <Kbd>Import Excel</Kbd> and pick a <code className="rounded bg-slate-100 px-1 text-xs">.xlsx</code>, <code className="rounded bg-slate-100 px-1 text-xs">.xls</code>, or <code className="rounded bg-slate-100 px-1 text-xs">.csv</code> file up to 10 MB. Two layouts are supported:</p>
              <ul className="mt-2 space-y-1.5 pl-4">
                <li className="flex gap-2"><span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" /><span><span className="font-medium text-slate-700">Flat table</span> — sheet named "Travel Records" with columns: Date, End Date, From, From Country, To, To Country, City, Purpose.</span></li>
                <li className="flex gap-2"><span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" /><span><span className="font-medium text-slate-700">Year sheets</span> — each sheet named by year (e.g. 2024), with month headings and entries below.</span></li>
              </ul>
              <p className="mt-2 text-slate-500">Get a pre-filled template from <Kbd>Settings → Download template</Kbd>.</p>
            </div>
          </div>
        </Section>

        {/* Profile & settings */}
        <Section icon={Settings} title="Profile and settings">
          <div className="rounded-xl border border-slate-100 bg-slate-50/60">
            <Row label="Theme">Sand, Ocean, Sunset, or White. Saved in the browser.</Row>
            <Row label="Date format">DD MMM YYYY or MMM DD, YYYY — applied across all views.</Row>
            <Row label="Default view">Which tab opens when you sign in.</Row>
            <Row label="Home country">Pre-fills "From country" and is excluded from the Top country stat.</Row>
            <Row label="Password">Change via Settings → Profile → Reset Password.</Row>
            <Row label="Delete account">Permanently removes all trips and your account. Cannot be undone.</Row>
          </div>
        </Section>

        {/* Backup */}
        <Section icon={Shield} title="Automatic backup">
          <div className="space-y-2">
            <p>On the <span className="font-medium text-slate-800">1st of every month</span> Route Book emails a backup of all your travel records as an Excel file to your account address.</p>
            <p className="text-slate-500">You can reimport it anytime via <Kbd>Import Excel</Kbd> to restore your data, or manually export at any time via <Kbd>Export Excel</Kbd>.</p>
          </div>
        </Section>

      </div>
    </div>
  );
}
