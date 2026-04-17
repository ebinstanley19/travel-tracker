import dynamic from "next/dynamic";
import type { TravelEntry } from "@/app/travel-tracker/types";

interface MapViewProps {
  entries: TravelEntry[];
  selectedCountry: string;
  homeCountry?: string;
  onCountrySelect: (country: string) => void;
}

const MapViewClient = dynamic(() => import("@/app/travel-tracker/map-view-client").then((mod) => mod.MapViewClient), {
  ssr: false,
});

export function MapView({ entries, selectedCountry, homeCountry, onCountrySelect }: MapViewProps) {
  return <MapViewClient entries={entries} selectedCountry={selectedCountry} homeCountry={homeCountry} onCountrySelect={onCountrySelect} />;
}
