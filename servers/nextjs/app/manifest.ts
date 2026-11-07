import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AI Fast Track Presentaciones",
    short_name: "Fast Track Presentaciones",
    description: "Generador de presentaciones con IA de AI Fast Track.",
    start_url: "/",
    display: "standalone",
    background_color: "#080808",
    theme_color: "#080808",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/aifasttrack-mark.svg", sizes: "any", type: "image/svg+xml" },
    ],
  };
}
