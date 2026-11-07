import React from "react";
import { Metadata } from "next";
import OutlinePage from "./components/OutlinePage";

export const metadata: Metadata = {
  title: "Esquema de la presentación",
  description: "Personaliza y organiza el esquema de tu presentación. Arrastra y suelta diapositivas, añade gráficos y genera tu presentación fácilmente.",
  alternates: {
    canonical: "https://presenton.ai/create"
  },
  keywords: [
    "presentation generator",
    "AI presentations",
    "data visualization",
    "automatic presentation maker",
    "professional slides",
    "data-driven presentations",
    "document to presentation",
    "presentation automation",
    "smart presentation tool",
    "business presentations"
  ]
};

const page = () => {
  return (
    <div className="relative min-h-screen" translate="no">
      <OutlinePage />
    </div>
  );
};

export default page;
