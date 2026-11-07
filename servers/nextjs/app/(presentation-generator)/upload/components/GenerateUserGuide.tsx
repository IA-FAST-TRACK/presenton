"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { GenerationMode } from "@/utils/presentationGenerationMode";

const GUIDE_KEY = "presenton_generate_guide_v3";

export default function GenerateUserGuide({ mode, communityEnabled }: { mode: GenerationMode; communityEnabled: boolean }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const steps = [
    { target: "setup", title: "Elige cómo se diseñan tus diapositivas", description: "El modo Inteligente crea diseños en torno a tu contenido. El modo Estándar usa la plantilla que elijas. Configura el número de diapositivas, el idioma y la configuración avanzada junto al selector de modo." },
    { target: "prompt", title: "Escribe el resumen de tu presentación", description: "Describe el tema, el público y los puntos clave. Usa el clip para adjuntar documentos de apoyo. Elige un idioma cuando trabajes con documentos." },
    ...(mode === "smart" && communityEnabled ? [{ target: "designs", title: "Elige una referencia de diseño opcional", description: "Busca diseños de la comunidad, obtén una vista previa con el botón del ojo y luego elige Usar. El menú también te permite reutilizar unas instrucciones. Ver todo abre la biblioteca completa de la comunidad." }] : []),
    { target: "prompt", title: "Genera tu presentación", description: "Pulsa la flecha morada o pulsa Comando/Ctrl + Intro en tu resumen. El modo Inteligente abre la presentación generada; el modo Estándar empieza con un esquema y la selección de plantilla. Pulsa ? en esta página para volver a abrir esta guía." },
  ];
  const current = steps[Math.min(step, steps.length - 1)];

  useEffect(() => {
    try { if (localStorage.getItem(GUIDE_KEY) !== "seen") setOpen(true); } catch { /* The page remains usable without storage. */ }
    const handleKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (event.key !== "?" || target?.closest("input, textarea, [contenteditable=true], [role=dialog]") || document.querySelector("[role=dialog]")) return;
      event.preventDefault();
      setStep(0);
      setOpen(true);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  useEffect(() => {
    if (!open) return;
    const target = document.querySelector<HTMLElement>(`[data-generate-guide="${current.target}"]`);
    if (!target) return;
    const previousOutline = target.style.outline;
    const previousOffset = target.style.outlineOffset;
    target.style.outline = "2px solid #7A5AF8";
    target.style.outlineOffset = "6px";
    target.scrollIntoView({ behavior: "smooth", block: "center" });
    return () => { target.style.outline = previousOutline; target.style.outlineOffset = previousOffset; };
  }, [open, current.target]);

  const close = () => {
    try { localStorage.setItem(GUIDE_KEY, "seen"); } catch { /* Closing does not depend on storage. */ }
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) close(); }}>
      <DialogContent overlayClassName="bg-black/15 backdrop-blur-none" className="top-auto bottom-4 max-w-[440px] translate-y-0 rounded-xl border-[#EDEEEF] bg-white p-6 font-syne sm:bottom-6">
        <p className="text-xs text-[#7A5AF8]">Guía de uso · {Math.min(step + 1, steps.length)} de {steps.length}</p>
        <DialogTitle className="pr-4 text-lg text-[#191919]">{current.title}</DialogTitle>
        <DialogDescription className="text-sm leading-6 text-[#666666]">{current.description}</DialogDescription>
        <div className="flex items-center justify-between gap-3">
          <button type="button" onClick={close} className="text-xs text-[#808080] hover:text-[#191919]">Omitir guía</button>
          <div className="flex gap-2">
            {step > 0 && <Button variant="outline" onClick={() => setStep((value) => value - 1)}>Atrás</Button>}
            <Button className="bg-[#7A5AF8] text-white hover:bg-[#6847E8]" onClick={() => step >= steps.length - 1 ? close() : setStep((value) => value + 1)}>{step >= steps.length - 1 ? "Empezar" : "Siguiente"}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
