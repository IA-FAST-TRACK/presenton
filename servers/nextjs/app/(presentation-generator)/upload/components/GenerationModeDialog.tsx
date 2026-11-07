"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import type { GenerationMode, PresentationGenerationMode } from "@/utils/presentationGenerationMode";
import { isGenerationModeAvailable } from "@/utils/presentationGenerationMode";
import { X } from "lucide-react";

const modes = [
  { id: "standard" as const, title: "TU CONTENIDO, TU PLANTILLA", label: "Modo estándar", video: "/Standard.mp4", description: "coloca tu texto y tus imágenes en la plantilla que elijas. El diseño de las diapositivas se mantiene coherente aunque cambie tu contenido.", features: ["Usa plantillas integradas o personalizadas", "Sigue el diseño fijo de la plantilla"] },
  { id: "smart" as const, title: "DISEÑADO EN TORNO A TU CONTENIDO", label: "Modo inteligente", video: "/Smart.mp4", description: "organiza tu texto y tus imágenes para adaptarlos a cada diapositiva. El diseño puede cambiar según lo que quieras presentar.", features: ["Crea diseños en torno a tu contenido", "Adapta la colocación del texto y las imágenes"] },
];

export default function GenerationModeDialog({ open, onOpenChange, onSelect, availableMode = "both" }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (mode: GenerationMode) => void;
  availableMode?: PresentationGenerationMode;
}) {
  const [activeMode, setActiveMode] = useState<GenerationMode | null>(null);
  const videos = useRef<Partial<Record<GenerationMode, HTMLVideoElement | null>>>({});

  useEffect(() => {
    for (const mode of modes) {
      const video = videos.current[mode.id];
      if (!video) continue;
      if (!open || (activeMode !== null && activeMode !== mode.id)) video.pause();
      else void video.play().catch(() => {});
    }
  }, [activeMode, open]);

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => { setActiveMode(null); onOpenChange(nextOpen); }}>
      <DialogContent hideDefaultClose overlayClassName="bg-black/30 backdrop-blur-none" className="max-h-[calc(100dvh-32px)] w-[calc(100%-32px)] max-w-[820px] gap-5 overflow-y-auto border-0 bg-transparent p-0 shadow-none sm:rounded-none">
        <DialogTitle className="sr-only">Elige un modo de presentación</DialogTitle>
        <DialogDescription className="sr-only">Compara las vistas previas de los modos Estándar e Inteligente y selecciona uno. Pasa el cursor o el foco por una tarjeta para pausar la otra vista previa.</DialogDescription>
        <DialogClose aria-label="Cerrar modos de presentación" className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-[#666666] hover:bg-white focus-visible:ring-2 focus-visible:ring-[#0A0A0A]"><X className="h-4 w-4" /></DialogClose>
        <div className="grid gap-5 md:grid-cols-2" onMouseLeave={() => setActiveMode(null)} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setActiveMode(null); }}>
          {modes.map((mode) => {
            const dimmed = activeMode !== null && activeMode !== mode.id;
            const available = isGenerationModeAvailable(availableMode, mode.id);
            return (
              <button key={mode.id} type="button" disabled={!available} aria-label={`Seleccionar ${mode.label}`} onMouseEnter={() => setActiveMode(mode.id)} onFocus={() => setActiveMode(mode.id)} onClick={() => { setActiveMode(null); onSelect(mode.id); onOpenChange(false); }} className={`overflow-hidden rounded-xl bg-white text-left transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A0A0A] disabled:cursor-not-allowed disabled:opacity-40 ${activeMode === mode.id ? "shadow-[0_4px_18px_rgba(0,0,0,0.37)]" : ""}`}>
                <div className={`transition-opacity ${dimmed ? "opacity-70" : "opacity-100"}`}>
                  <video ref={(element) => { videos.current[mode.id] = element; }} src={mode.video} autoPlay muted loop playsInline aria-label={`Vista previa: ${mode.label}`} className="aspect-[4/3] w-full object-cover" />
                  <div className="space-y-[18px] p-[22px] font-manrope">
                    <p className="text-xs font-semibold tracking-[1.2px] text-[#666666]">{mode.title}</p>
                    <p className="text-sm font-medium leading-[22px] tracking-[0.28px] text-[#333333]">
                      <span className={`mr-2 inline-block rounded-full px-3 py-0.5 text-xs font-semibold leading-4 ${mode.id === "smart" ? "bg-[#FFFADC] text-[#0A0A0A]" : "bg-[#F4FBFE] text-[#01A8F2]"}`}>{mode.label}</span>
                      {mode.description}
                    </p>
                    <ul className="divide-y divide-[#EDEEEF] font-syne text-[13px] leading-5 text-[#333333]">
                      {mode.features.map((feature) => <li key={feature} className="flex items-center gap-1 py-2 first:pt-0 last:pb-0"><Image src={`/generate/${mode.id}-check.svg`} alt="" width={14} height={14} />{feature}</li>)}
                    </ul>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
