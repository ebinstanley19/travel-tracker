import { Card, CardContent } from "@/components/ui/card";

interface StatsCardsProps {
  totalTrips: number;
  uniqueCountries: number;
  yearsCovered: number;
  topCountry: string;
}

export function StatsCards({ totalTrips, uniqueCountries, yearsCovered, topCountry }: StatsCardsProps) {
  const items = [
    {
      label: "Total movements",
      value: totalTrips,
      tone: "from-[#10213a] via-[#18386a] to-[#3a71b8] text-white",
      meta: "Passport entries, exits, and route points",
    },
    {
      label: "Countries touched",
      value: uniqueCountries,
      tone: "from-[#f6d7a8] via-[#f5c37f] to-[#f4b967] text-slate-950",
      meta: "Distinct destinations across your timeline",
    },
    {
      label: "Years active",
      value: yearsCovered,
      tone: "from-[#dcefe8] via-[#c7e8d9] to-[#b4dccb] text-slate-950",
      meta: "Coverage across seasons and long arcs",
    },
    {
      label: "Top country",
      value: topCountry,
      tone: "from-[#f5e8d8] via-[#f1ddd0] to-[#e7d3ea] text-slate-950",
      meta: "Your most revisited stop so far",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <Card key={item.label} className={`overflow-hidden rounded-[2rem] border-0 shadow-[0_20px_60px_rgba(15,23,42,0.08)] bg-gradient-to-br ${item.tone}`}>
          <CardContent className="relative p-6">
            <div className="absolute right-0 top-0 h-28 w-28 rounded-full bg-white/15 blur-2xl" />
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] opacity-70">{item.label}</div>
            <div className="mt-4 text-4xl font-semibold tracking-[-0.05em]">{item.value}</div>
            <p className="mt-4 max-w-[16rem] text-sm leading-6 opacity-80">{item.meta}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
