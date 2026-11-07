import type { ChatStreamTrace } from "../../../services/api/chat";
import type { AssistantActivity } from "./chat-types";

const TOOL_LABELS: Record<string, string> = {
  addOutline: "Añadir al esquema",
  updateOutline: "Editar el esquema",
  deleteOutline: "Eliminar del esquema",
  addNewSlide: "Añadir diapositiva en blanco",
  addNewSlideLayout: "Añadir diapositiva con diseño",
  getAvailableLayouts: "Buscar diseños",
  getTemplateSummary: "Leer la plantilla",
  readSourceDocuments: "Leer documentos de origen",
  searchSlide: "Buscar diapositivas",
  getSlideAtIndex: "Leer la diapositiva",
  saveSlide: "Guardar la diapositiva",
  updateSlide: "Actualizar la diapositiva",
  deleteSlide: "Eliminar la diapositiva",
  addElement: "Añadir elemento",
  updateElement: "Actualizar elemento",
  deleteElement: "Eliminar elemento",
  addComponent: "Añadir componente",
  createComponent: "Crear componente",
  updateComponent: "Actualizar componente",
  deleteComponent: "Eliminar componente",
  generateAssets: "Generar recursos",
};

export const MUTATING_TOOLS = new Set([
  "addOutline",
  "updateOutline",
  "deleteOutline",
  "addNewSlide",
  "addNewSlideLayout",
  "saveSlide",
  "updateSlide",
  "deleteSlide",
  "addElement",
  "updateElement",
  "deleteElement",
  "addComponent",
  "createComponent",
  "updateComponent",
  "deleteComponent",
]);

// Read/open traces can happen ahead of edits and would make follow mode jumpy.
export const SLIDE_FOCUS_TOOLS = new Set([
  "addNewSlide",
  "addNewSlideLayout",
  "saveSlide",
  "updateSlide",
  "deleteSlide",
  "addElement",
  "updateElement",
  "deleteElement",
  "addComponent",
  "createComponent",
  "updateComponent",
  "deleteComponent",
]);

export const SLIDE_FOCUS_STATUSES = new Set(["start"]);
export const MIN_SLIDE_FOCUS_DWELL_MS = 700;

const getToolLabel = (tool?: string) => {
  if (!tool) return "";
  return TOOL_LABELS[tool] ?? tool;
};

const humanizeTraceMessage = (message: string, tool?: string) => {
  const trimmed = message.trim();
  if (!trimmed) return "";

  const lower = trimmed.toLowerCase();
  const exactMessages: Record<string, string> = {
    "reading deck context": "Revisando el contexto de tu presentación.",
    "reading the presentation outline": "Leyendo el esquema de la presentación.",
    "reading the outline draft": "Leyendo el borrador del esquema.",
    "adding an outline slide": "Añadiendo una diapositiva al esquema.",
    "updating the outline slide": "Actualizando la diapositiva del esquema.",
    "deleting the outline slide": "Eliminando la diapositiva del esquema.",
    "reordering outline slides": "Reordenando las diapositivas del esquema.",
    "searching relevant slides": "Buscando contenido relevante en las diapositivas.",
    "opening the requested slide": "Abriendo la diapositiva seleccionada.",
    "checking available layouts": "Comprobando los diseños disponibles.",
    "checking the layout schema": "Validando el esquema de la diapositiva.",
    "generating slide assets": "Generando imágenes e iconos.",
    "saving the slide": "Guardando los cambios de la diapositiva.",
    "deleting the slide": "Eliminando la diapositiva.",
    "applying presentation theme": "Aplicando el tema seleccionado.",
    "reading template structure": "Leyendo la estructura de la plantilla.",
    "reading source documents": "Leyendo los documentos de origen.",
    "opening the requested template slide": "Abriendo la diapositiva de plantilla seleccionada.",
    "searching template content": "Buscando en el contenido de la plantilla.",
    "finding editable elements": "Buscando elementos editables.",
    "updating template content": "Actualizando el contenido de la plantilla.",
    "deleting the template component": "Eliminando el componente seleccionado.",
    "swapping component variant": "Cambiando la variante del componente.",
  };
  if (exactMessages[lower]) return exactMessages[lower];

  if (lower.startsWith("using tools:")) {
    const toolNames = trimmed
      .slice("using tools:".length)
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean)
      .map((entry) => getToolLabel(entry));
    return toolNames.length === 0
      ? "Planificando el siguiente paso."
      : "Eligiendo la mejor forma de ayudarte.";
  }
  if (lower.includes("found requested data")) {
    return tool === "getSlideAtIndex"
      ? "Se han encontrado los detalles de la diapositiva solicitada."
      : "Se ha encontrado la información solicitada.";
  }
  return trimmed;
};

export const inferStatusState = (
  status: string,
): AssistantActivity["state"] => {
  const normalized = status.trim().toLowerCase();
  if (
    [
      "preparing",
      "thinking",
      "reading",
      "searching",
      "opening",
      "generating",
      "processing",
      "finalizing",
      "saving",
    ].some((term) => normalized.includes(term))
  ) {
    return "running";
  }
  return "info";
};

export const isAbortError = (error: unknown) =>
  (error instanceof DOMException && error.name === "AbortError") ||
  (error instanceof Error &&
    error.message.toLowerCase().includes("aborted") &&
    error.message.toLowerCase().includes("request"));

export const stripBackendContextFromUserMessage = (rawMessage: string) => {
  const message = rawMessage ?? "";
  if (!message.startsWith("UI context:")) return message;

  const marker = "\nUser message:";
  const markerIndex = message.indexOf(marker);
  if (markerIndex === -1) return message;
  return message.slice(markerIndex + marker.length).trimStart();
};

const humanActivityForTool = (
  tool: string | undefined,
  state: "start" | "success",
) => {
  const isDone = state === "success";
  switch (tool) {
    case "searchSlide":
      return isDone
        ? "Se ha encontrado el contenido relevante."
        : "Revisando el contenido.";
    case "getSlideAtIndex":
      return isDone ? "Diapositiva revisada." : "Revisando la diapositiva.";
    case "addNewSlide":
    case "addNewSlideLayout":
    case "updateElement":
    case "updateComponent":
    case "addElement":
    case "addComponent":
    case "createComponent":
    case "updateSlide":
    case "saveSlide":
      return isDone ? "Cambio aplicado." : "Aplicando el cambio.";
    case "deleteComponent":
    case "deleteElement":
    case "deleteSlide":
      return isDone
        ? "Elemento seleccionado eliminado."
        : "Eliminando el elemento seleccionado.";
    case "generateAssets":
      return isDone
        ? "Recursos visuales preparados."
        : "Preparando los recursos visuales.";
    default:
      return isDone ? "Paso completado." : "Trabajando en ello.";
  }
};

export const formatTraceActivity = (
  trace: ChatStreamTrace,
): Omit<AssistantActivity, "id"> | null => {
  if (typeof trace.message === "string" && trace.message.trim().length > 0) {
    return {
      label: humanizeTraceMessage(trace.message, trace.tool),
      kind: trace.kind,
      round: trace.round,
      tool: trace.tool,
      state:
        trace.status === "error"
          ? "error"
          : trace.status === "success"
            ? "success"
            : trace.status === "ready" || trace.status === "info"
              ? "info"
              : "running",
    };
  }
  if (trace.tool && trace.status === "start") {
    return {
      label: humanActivityForTool(trace.tool, "start"),
      kind: trace.kind,
      round: trace.round,
      tool: trace.tool,
      state: "running",
    };
  }
  if (trace.tool && trace.status === "success") {
    return {
      label: humanActivityForTool(trace.tool, "success"),
      kind: trace.kind,
      round: trace.round,
      tool: trace.tool,
      state: "success",
    };
  }
  if (trace.tool && trace.status === "error") {
    return {
      label: "No he podido completar ese paso.",
      kind: trace.kind,
      round: trace.round,
      tool: trace.tool,
      state: "error",
    };
  }
  if (trace.kind === "tool_plan" && Array.isArray(trace.tools) && trace.tools.length) {
    return {
      label: "Planificando el siguiente paso.",
      kind: trace.kind,
      round: trace.round,
      state: "info",
    };
  }
  return null;
};

export const readTraceSlideIndex = (trace: ChatStreamTrace) => {
  if (typeof trace.slideIndex === "number" && trace.slideIndex >= 0) {
    return trace.slideIndex;
  }
  if (typeof trace.slideNumber === "number" && trace.slideNumber > 0) {
    return trace.slideNumber - 1;
  }
  return null;
};
