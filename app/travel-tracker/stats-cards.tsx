import { Card, CardContent } from "@/components/ui/card";

interface StatsCardsProps {
  totalTrips: number;
  uniqueCountries: number;
  yearsCovered: number;
  topCountry: string;
}

export function StatsCards({ totalTrips, uniqueCountries, yearsCovered, topCountry }: StatsCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <Card className="rounded-2xl shadow-sm">
        <CardContent className="p-5">
          <div className="text-sm text-muted-foreground">Total entries</div>
          <div className="mt-2 text-3xl font-bold">{totalTrips}</div>
        </CardContent>
      </Card>
      <Card className="rounded-2xl shadow-sm">
        <CardContent className="p-5">
          <div className="text-sm text-muted-foreground">Countries visited</div>
          <div className="mt-2 text-3xl font-bold">{uniqueCountries}</div>
        </CardContent>
      </Card>
      <Card className="rounded-2xl shadow-sm">
        <CardContent className="p-5">
          <div className="text-sm text-muted-foreground">Years covered</div>
          <div className="mt-2 text-3xl font-bold">{yearsCovered}</div>
        </CardContent>
      </Card>
      <Card className="rounded-2xl shadow-sm">
        <CardContent className="p-5">
          <div className="text-sm text-muted-foreground">Most visited country</div>
          <div className="mt-2 text-3xl font-bold">{topCountry}</div>
        </CardContent>
      </Card>
    </div>
  );
}
