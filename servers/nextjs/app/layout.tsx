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
  metadataBase: new URL("https://presenton.ai"),
  title: "Presenton - Generador de presentaciones con IA de código abierto",
  description:
    "Generador de presentaciones con IA de código abierto, con diseños personalizados, compatibilidad con varios modelos (OpenAI, Gemini, Ollama) y exportación a PDF/PPTX. Una alternativa gratuita a Gamma.",
  keywords: [
    "generador de presentaciones con IA",
    "storytelling con datos",
    "herramienta de visualización de datos",
    "presentación de datos con IA",
    "generador de presentaciones",
    "de datos a presentación",
    "presentaciones interactivas",
    "diapositivas profesionales",
  ],
  openGraph: {
    title: "Presenton - Generador de presentaciones con IA de código abierto",
    description:
      "Generador de presentaciones con IA de código abierto, con diseños personalizados, compatibilidad con varios modelos (OpenAI, Gemini, Ollama) y exportación a PDF/PPTX. Una alternativa gratuita a Gamma.",
    url: "https://presenton.ai",
    siteName: "Presenton",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Logotipo de Presenton",
      },
    ],
    type: "website",
    locale: "es_ES",
  },
  alternates: {
    canonical: "https://presenton.ai",
  },
  twitter: {
    card: "summary_large_image",
    title: "Presenton - Generador de presentaciones con IA de código abierto",
    description:
      "Generador de presentaciones con IA de código abierto, con diseños personalizados, compatibilidad con varios modelos (OpenAI, Gemini, Ollama) y exportación a PDF/PPTX. Una alternativa gratuita a Gamma.",
    images: ["https://presenton.ai/presenton-feature-graphics.png"],
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
