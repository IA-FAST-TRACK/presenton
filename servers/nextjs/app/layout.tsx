import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./motion.css";
import "katex/dist/katex.min.css";
import { Providers } from "./providers";
import MixpanelInitializer from "./MixpanelInitializer";
import { Toaster } from "@/components/ui/sonner";
import TailwindBrowserRuntime from "@/components/runtime/TailwindBrowserRuntime";
const BRAND_NAME = "AI Fast Track Presentaciones";
const BRAND_DESCRIPTION =
  "Generador de presentaciones con IA de AI Fast Track: plantillas propias, varios modelos de IA y exportación a PDF/PPTX.";
// Public URL of this deployment (optional). Used to build absolute Open Graph URLs.
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

export const metadata: Metadata = {
  ...(siteUrl ? { metadataBase: new URL(siteUrl) } : {}),
  title: BRAND_NAME,
  description: BRAND_DESCRIPTION,
  applicationName: BRAND_NAME,
  authors: [{ name: "AI Fast Track", url: "https://aifasttrack.tech" }],
  publisher: "AI Fast Track",
  keywords: [
    "AI Fast Track",
    "presentaciones con IA",
    "generador de presentaciones",
    "PPTX",
    "PDF",
  ],
  openGraph: {
    title: BRAND_NAME,
    description: BRAND_DESCRIPTION,
    siteName: BRAND_NAME,
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "AI Fast Track",
      },
    ],
    type: "website",
    locale: "es_ES",
  },
  twitter: {
    card: "summary_large_image",
    title: BRAND_NAME,
    description: BRAND_DESCRIPTION,
    images: ["/og-image.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#080808",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <html lang="es">
      <body className="antialiased">
        <Providers>
          <MixpanelInitializer>

            {children}

          </MixpanelInitializer>
        </Providers>
        <TailwindBrowserRuntime />
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
