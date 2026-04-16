import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Route Book",
    short_name: "RouteBook",
    description: "Private travel history timeline and route tracker.",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f4ed",
    theme_color: "#1a4f86",
    icons: [
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}