export type EditorShortcutKey =
  | "Mod"
  | "Shift"
  | "Alt"
  | "Click"
  | "Backspace"
  | "Delete"
  | "ArrowLeft"
  | "ArrowRight"
  | "ArrowUp"
  | "ArrowDown"
  | "C"
  | "G"
  | "J"
  | "K"
  | "V"
  | "Y"
  | "Z"
  | "?";

export type EditorShortcut = {
  id:
    | "multi-select"
    | "group"
    | "delete"
    | "copy"
    | "paste"
    | "undo"
    | "redo"
    | "bring-forward"
    | "bring-to-front"
    | "send-backward"
    | "send-to-back"
    | "previous-slide"
    | "next-slide"
    | "shortcut-help";
  label: string;
  description: string;
  chords: EditorShortcutKey[][];
};

export type EditorShortcutSection = {
  id: "selection" | "editing" | "arrange" | "navigation" | "help";
  title: string;
  description: string;
  shortcuts: EditorShortcut[];
};

const ARROW_KEY_LABELS: Partial<Record<EditorShortcutKey, string>> = {
  ArrowLeft: "←",
  ArrowRight: "→",
  ArrowUp: "↑",
  ArrowDown: "↓",
};

export const EDITOR_SHORTCUT_SECTIONS: EditorShortcutSection[] = [
  {
    id: "selection",
    title: "Selección",
    description: "Selecciona y organiza objetos en la diapositiva activa.",
    shortcuts: [
      {
        id: "multi-select",
        label: "Añadir a la selección",
        description: "Mantén pulsada Mayús al hacer clic para añadir o quitar un objeto.",
        chords: [["Shift", "Click"]],
      },
      {
        id: "group",
        label: "Agrupar objetos",
        description: "Combina dos o más objetos seleccionados en un grupo.",
        chords: [["Mod", "G"]],
      },
      {
        id: "delete",
        label: "Eliminar selección",
        description: "Quita de la diapositiva el objeto u objetos seleccionados.",
        chords: [["Backspace"], ["Delete"]],
      },
    ],
  },
  {
    id: "editing",
    title: "Edición",
    description: "Comandos de edición habituales para los objetos de la diapositiva.",
    shortcuts: [
      {
        id: "undo",
        label: "Deshacer",
        description: "Deshace el último cambio realizado en la diapositiva activa.",
        chords: [["Mod", "Z"]],
      },
      {
        id: "redo",
        label: "Rehacer",
        description: "Restaura el último cambio deshecho en la diapositiva.",
        chords: [["Mod", "Shift", "Z"], ["Mod", "Y"]],
      },
      {
        id: "copy",
        label: "Copiar selección",
        description: "Copia el objeto u objetos seleccionados.",
        chords: [["Mod", "C"]],
      },
      {
        id: "paste",
        label: "Pegar",
        description: "Pega los objetos copiados con un pequeño desplazamiento.",
        chords: [["Mod", "V"]],
      },
    ],
  },
  {
    id: "arrange",
    title: "Organizar",
    description: "Cambia la posición de capa del objeto seleccionado.",
    shortcuts: [
      {
        id: "bring-forward",
        label: "Traer adelante",
        description: "Adelanta una capa el objeto seleccionado.",
        chords: [["Alt", "K"]],
      },
      {
        id: "bring-to-front",
        label: "Traer al frente",
        description: "Coloca el objeto seleccionado por encima de todos los demás.",
        chords: [["Shift", "Alt", "K"]],
      },
      {
        id: "send-backward",
        label: "Enviar atrás",
        description: "Retrasa una capa el objeto seleccionado.",
        chords: [["Alt", "J"]],
      },
      {
        id: "send-to-back",
        label: "Enviar al fondo",
        description: "Coloca el objeto seleccionado detrás de todos los demás.",
        chords: [["Shift", "Alt", "J"]],
      },
    ],
  },
  {
    id: "navigation",
    title: "Navegación entre diapositivas",
    description: "Muévete entre diapositivas sin salir del lienzo.",
    shortcuts: [
      {
        id: "previous-slide",
        label: "Diapositiva anterior",
        description: "Abre la diapositiva anterior a la activa.",
        chords: [["ArrowLeft"], ["ArrowUp"]],
      },
      {
        id: "next-slide",
        label: "Diapositiva siguiente",
        description: "Abre la diapositiva posterior a la activa.",
        chords: [["ArrowRight"], ["ArrowDown"]],
      },
    ],
  },
  {
    id: "help",
    title: "Ayuda",
    description: "Vuelve rápidamente a esta referencia.",
    shortcuts: [
      {
        id: "shortcut-help",
        label: "Atajos de teclado",
        description: "Abre esta guía de atajos de teclado.",
        chords: [["?"]],
      },
    ],
  },
];

export function editorShortcutById(id: EditorShortcut["id"]) {
  return EDITOR_SHORTCUT_SECTIONS.flatMap(
    (section) => section.shortcuts,
  ).find((shortcut) => shortcut.id === id);
}

export function shortcutKeyLabel(
  key: EditorShortcutKey,
  applePlatform: boolean,
) {
  const arrowLabel = ARROW_KEY_LABELS[key];
  if (arrowLabel) return arrowLabel;
  if (key === "Click") return "Clic";

  if (!applePlatform) {
    if (key === "Mod") return "Ctrl";
    if (key === "Shift") return "Mayús";
    if (key === "Delete") return "Supr";
    return key;
  }

  switch (key) {
    case "Mod":
      return "⌘";
    case "Shift":
      return "⇧";
    case "Alt":
      return "⌥";
    case "Backspace":
      return "⌫";
    default:
      return key;
  }
}
