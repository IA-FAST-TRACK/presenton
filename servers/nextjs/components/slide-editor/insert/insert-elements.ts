import type { TemplateV2InsertComponent } from "@/components/slide-editor/events/events";
import { normalizeChartTypeName } from "@/components/slide-editor/charts/chart-data";
import {
  measureNoWrapTextWidth,
  rawFont,
} from "@/components/slide-editor/text/template-v2-text";
import { measureMathLatex } from "@/lib/math";
import type {
  BorderRadius,
  ChartType,
  Fill,
  Font,
  InfographicType,
  Marker,
  SlideElement,
  Stroke,
  TableCell,
} from "@/components/slide-editor/types";
import { INFOGRAPHIC_EXAMPLE_ICON_URLS } from "@/components/slide-editor/infographics/infographic-icons";
import { fitInfographicElementToData } from "@/components/slide-editor/infographics/infographic-sizing";
import {
  DEFAULT_TEMPLATE_THEME,
  templateThemeGraphColors,
  type TemplateTheme,
} from "@/lib/template-theme";

const DEFAULT_CHART_INSERT_POSITION = { x: 128, y: 115 };
const DEFAULT_CHART_INSERT_SIZE = { width: 717, height: 410 };
const DEFAULT_INFOGRAPHIC_INSERT_POSITION = { x: 128, y: 170 };
const DEFAULT_IMAGE_PLACEHOLDER_SRC =
  "/figma/presentation-actions/image-placeholder.svg";
const IMAGE_PREVIEW_ASSETS = [
  DEFAULT_IMAGE_PLACEHOLDER_SRC,
  DEFAULT_IMAGE_PLACEHOLDER_SRC,
  DEFAULT_IMAGE_PLACEHOLDER_SRC,
  DEFAULT_IMAGE_PLACEHOLDER_SRC,
] as const;
const DEFAULT_MATH_INSERT_CENTER_X = 640;
const DEFAULT_MATH_INSERT_CENTER_Y = 325;
const TEXT_INSERT_HORIZONTAL_PADDING_PX = 8;
const TEXT_INSERT_VERTICAL_PADDING_PX = 14;
const IMAGE_RADIUS = { tl: 10, tr: 10, bl: 10, br: 10 };
const MATH_INSERT_PRESETS: Record<
  string,
  { latex: string; name: string; fontSize?: number }
> = {
  equation: { latex: String.raw`E = mc^2`, name: "equation" },
  "equation-quadratic": {
    latex: String.raw`x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}`,
    name: "quadratic_formula",
    fontSize: 38,
  },
  "equation-summation": {
    latex: String.raw`\sum_{i=1}^{n} i = \frac{n(n+1)}{2}`,
    name: "summation_formula",
    fontSize: 40,
  },
  "equation-integral": {
    latex: String.raw`\int_{-\infty}^{\infty} e^{-x^2}\,dx = \sqrt{\pi}`,
    name: "integral_formula",
    fontSize: 38,
  },
  "equation-matrix": {
    latex: String.raw`A = \begin{bmatrix} a & b \\ c & d \end{bmatrix}`,
    name: "matrix_formula",
    fontSize: 38,
  },
};

export type EditorInsertContent = {
  elements?: SlideElement[];
  components?: TemplateV2InsertComponent[];
};

function fittedTextHeight(
  lineCount: number,
  fontSize: number,
  lineHeight: number,
) {
  return Math.ceil(
    lineCount * fontSize * lineHeight + TEXT_INSERT_VERTICAL_PADDING_PX,
  );
}

function makeTextElement({
  name,
  text,
  x,
  y,
  width,
  height,
  size,
  color = "101323",
  bold = false,
  italic = false,
  lineHeight = 1.1,
  horizontal = "left",
}: {
  name: string;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  size: number;
  color?: string;
  bold?: boolean;
  italic?: boolean;
  lineHeight?: number;
  horizontal?: "left" | "center" | "right";
}): SlideElement {
  const maxLength = Math.max(1, text.trim().length);

  return {
    type: "text",
    position: { x, y },
    size: { width, height },
    alignment: { horizontal, vertical: "top" },
    runs: [{ text }],
    font: {
      family: "Arial",
      size,
      color,
      bold,
      italic,
      line_height: lineHeight,
    },
    decorative: false,
    name,
    max_length: maxLength,
    min_length: Math.ceil(maxLength / 2),
  };
}

function makeLatexTextElement({
  latex,
  name,
  fontSize = 44,
}: {
  latex: string;
  name: string;
  fontSize?: number;
}): SlideElement {
  const measured = measureMathLatex(latex, fontSize, true);
  const width = Math.max(
    1,
    Math.ceil(measured.width) + TEXT_INSERT_HORIZONTAL_PADDING_PX,
  );
  const height = Math.max(1, Math.ceil(measured.height));

  return {
    type: "text",
    position: {
      x: Math.round(DEFAULT_MATH_INSERT_CENTER_X - width / 2),
      y: Math.round(DEFAULT_MATH_INSERT_CENTER_Y - height / 2),
    },
    size: { width, height },
    alignment: { horizontal: "center", vertical: "middle" },
    font: {
      family: "KaTeX_Main",
      size: fontSize,
      color: "101323",
    },
    runs: [{ type: "latex", latex, display_mode: true }],
    decorative: false,
    name,
    max_length: 4000,
    min_length: 1,
  };
}

function makeTableCell({
  text,
  font,
  color,
  alignment = "left",
}: {
  text: string;
  font: Font;
  color?: Fill;
  alignment?: TableCell["alignment"];
}): TableCell {
  return {
    alignment,
    color,
    runs: [{ text, font }],
  };
}

function makeBulletListElement(marker: Marker): SlideElement {
  const baseFont = {
    size: 18,
    family: "Manrope",
    color: "#111111",
    bold: false,
    italic: false,
    line_height: 1.4,
    letter_spacing: 0,
    ellipsis: false,
  };
  const items = [
    [
      {
        text: "Aclara el objetivo y la audiencia",
        font: { ...baseFont, bold: true },
      },
    ],
    [{ text: "Muestra el argumento de apoyo más sólido", font: { ...baseFont } }],
    [
      {
        text: "Cierra con la siguiente acción",
        font: { ...baseFont, italic: true },
      },
    ],
  ];
  const renderFont = rawFont({ font: baseFont });
  const fittedWidth = Math.ceil(
    Math.max(
      ...items.map((item, index) => {
        const prefix =
          marker === "bullet"
            ? "• "
            : marker === "number"
              ? `${index + 1}. `
              : "";
        const text = item.map((run) => run.text).join("");
        return measureNoWrapTextWidth(`${prefix}${text}`, renderFont);
      }),
    ) + TEXT_INSERT_HORIZONTAL_PADDING_PX,
  );

  return {
    type: "text-list",
    position: { x: 122, y: 128 },
    size: {
      width: fittedWidth,
      height: fittedTextHeight(
        items.length,
        baseFont.size,
        baseFont.line_height,
      ),
    },
    rotation: 0,
    font: baseFont,

    marker,
    items,
    decorative: false,
    name:
      marker === "bullet"
        ? "bullet_list"
        : marker === "number"
          ? "numbered_list"
          : "list_item",
    max_items: 6,
    min_items: 3,
    max_item_length: 60,
    min_item_length: 30,
  };
}

function createDefaultTextInsertElements(kind?: string): SlideElement[] {
  const mathPreset = kind ? MATH_INSERT_PRESETS[kind] : undefined;
  if (mathPreset) return [makeLatexTextElement(mathPreset)];

  switch (kind) {
    case "title-block":
      return [
        makeTextElement({
          name: "slide_title",
          text: "Añade un título claro para la diapositiva",
          x: 109,
          y: 109,
          width: 986,
          height: fittedTextHeight(1, 38, 1.1),
          size: 38,
          bold: true,
        }),
      ];
    case "subtitle":
      return [
        makeTextElement({
          name: "slide_subtitle",
          text: "Añade un subtítulo breve de apoyo",
          x: 122,
          y: 154,
          width: 870,
          height: fittedTextHeight(1, 24, 1.2),
          size: 24,
          color: "344054",
          lineHeight: 1.2,
        }),
      ];
    case "bullet-list":
      return [makeBulletListElement("bullet")];
    case "numbered-list":
      return [makeBulletListElement("number")];
    case "list-item":
      return [makeBulletListElement("none")];
    case "quote":
      return [
        makeTextElement({
          name: "quote",
          text: '"Añade aquí una cita memorable o la opinión de un cliente."',
          x: 122,
          y: 147,
          width: 858,
          height: fittedTextHeight(2, 24, 1.25),
          size: 24,
          color: "101323",
          italic: true,
          lineHeight: 1.25,
        }),
      ];
    case "body-text":
      return [
        makeTextElement({
          name: "body_text",
          text: "Añade aquí el texto principal. Usa este espacio para un párrafo breve o un detalle de apoyo.",
          x: 122,
          y: 154,
          width: 858,
          height: fittedTextHeight(2, 18, 1.28),
          size: 18,
          color: "344054",
          lineHeight: 1.28,
        }),
      ];
    default:
      return [];
  }
}

function chartTypeFromPaletteId(id?: string): ChartType | null {
  const normalized = normalizeChartTypeName(id);
  switch (normalized) {
    case "area":
    case "bar":
    case "donut":
    case "horizontal_bar":
    case "line":
    case "pie":
    case "polar_area":
    case "radar":
    case "scatter":
      return normalized as ChartType;
    case "stackedbar":
    case "stacked_bar":
      return "stacked_bar";
    case "horizontalstackbar":
    case "horizontalstackedbar":
    case "horizontal_stack_bar":
    case "horizontal_stacked_bar":
      return "horizontal_stacked_bar";
    default:
      return null;
  }
}

function chartData(
  categories: string[],
  values: number[],
  colors: string[],
) {
  return categories.map((category, index) => ({
    label: category,
    value: values[index] ?? 0,
    color: colors[index % colors.length] ?? colors[0],
  }));
}

function chartExample(chartType: ChartType) {
  switch (chartType) {
    case "donut":
      return {
        title: "Cuota de ingresos por segmento",
        categories: ["Grandes empresas", "Mediana empresa", "Pequeña empresa", "Consumidor"],
        values: [42, 28, 18, 12],
        seriesName: "Cuota de ingresos",
        colors: ["7F22FE", "155DFC", "F59E0B", "12B76A"],
      };
    case "horizontal_bar":
      return {
        title: "Leads cualificados por canal",
        categories: ["Correo electrónico", "Búsqueda", "Redes sociales", "Recomendación"],
        values: [68, 54, 47, 38],
        seriesName: "Leads cualificados",
        colors: ["7F22FE", "155DFC", "F59E0B", "12B76A"],
      };
    case "polar_area":
      return {
        title: "Incidencias de soporte por prioridad",
        categories: ["Crítica", "Alto", "Media", "Bajo"],
        values: [18, 32, 46, 24],
        seriesName: "Volumen de incidencias",
        colors: ["7F22FE", "155DFC", "F59E0B", "12B76A"],
      };
    case "radar":
      return {
        title: "Nivel de preparación del producto",
        categories: ["Diseño", "Fiabilidad", "Velocidad", "Seguridad", "Usabilidad"],
        values: [82, 74, 88, 69, 91],
        seriesName: "Nivel de preparación",
        colors: ["7F22FE", "155DFC", "F59E0B", "12B76A", "06B6D4"],
      };
    case "scatter":
      return {
        title: "Resultados de conversión por campaña",
        categories: ["Campaña A", "Campaña B", "Campaña C", "Campaña D"],
        values: [42, 57, 63, 76],
        seriesName: "Conversiones",
        colors: ["7F22FE", "155DFC", "F59E0B", "12B76A"],
      };
    default:
      return {
        title: "Tendencia trimestral de ingresos",
        categories: ["Q1", "Q2", "Q3", "Q4"],
        values: [38, 54, 47, 68],
        seriesName: "Ingresos",
        colors: ["7F22FE", "155DFC", "F59E0B", "12B76A"],
      };
  }
}

function makeChartElement(chartType: ChartType): SlideElement {
  const schema = {
    decorative: false,
    name: `${chartType}_chart`,
  };

  if (chartType === "bar") {
    const categories = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
    const values = [70, 120, 45, 145, 105, 105, 45];
    const colors = [
      "4D20C5",
      "155DFC",
      "F59E0B",
      "12B76A",
      "EF4444",
      "06B6D4",
      "8B5CF6",
    ];

    return {
      type: "chart",
      position: { ...DEFAULT_CHART_INSERT_POSITION },
      size: { ...DEFAULT_CHART_INSERT_SIZE },
      chart_type: "bar",
      title: "Visitas semanales al sitio web\n10-16 jun",
      color: "4D20C5",
      axis_color: "D8D8D8",
      grid_color: "D8D8D8",
      data_labels: "top",
      x_axis_grid: true,
      y_axis_grid: true,
      x_axis: true,
      y_axis: true,
      categories,
      series: [{ name: "Visitas", values }],
      colors,
      data: chartData(categories, values, colors),
      ...schema,
    };
  }

  if (chartType === "line") {
    const categories = ["2021", "2022", "2023", "2024", "2025", "2026"];
    const values = [15, 45, 85, 50, 75, 95];
    const colors = [
      "4D20C5",
      "155DFC",
      "F59E0B",
      "12B76A",
      "EF4444",
      "06B6D4",
    ];

    return {
      type: "chart",
      position: { ...DEFAULT_CHART_INSERT_POSITION },
      size: { ...DEFAULT_CHART_INSERT_SIZE },
      chart_type: "line",
      title: "Crecimiento de ingresos\n2021-2026",
      color: "4D20C5",
      axis_color: "D8D8D8",
      grid_color: "D8D8D8",
      data_labels: null,
      x_axis_grid: true,
      y_axis_grid: true,
      x_axis: true,
      y_axis: false,
      categories,
      series: [{ name: "Ingresos", values }],
      colors,
      data: chartData(categories, values, colors),
      ...schema,
    };
  }

  if (chartType === "area") {
    const categories = ["2021", "2022", "2023", "2024", "2025", "2026"];
    const values = [25, 48, 46, 57, 62, 78];
    const colors = [
      "4D20C5",
      "155DFC",
      "F59E0B",
      "12B76A",
      "EF4444",
      "06B6D4",
    ];

    return {
      type: "chart",
      position: { ...DEFAULT_CHART_INSERT_POSITION },
      size: { ...DEFAULT_CHART_INSERT_SIZE },
      chart_type: "area",
      title: "Usuarios activos mensuales\n2021-2026",
      color: "7555F6",
      axis_color: "D8D8D8",
      grid_color: "D8D8D8",
      data_labels: null,
      x_axis_grid: true,
      y_axis_grid: true,
      x_axis: true,
      y_axis: false,
      categories,
      series: [{ name: "Usuarios activos", values }],
      colors,
      data: chartData(categories, values, colors),
      ...schema,
    };
  }

  if (chartType === "pie") {
    const categories = ["Producto", "Servicios", "Soporte", "Formación"];
    const values = [45, 30, 15, 10];
    const colors = ["7555F6", "155DFC", "F59E0B", "12B76A"];

    return {
      type: "chart",
      position: { ...DEFAULT_CHART_INSERT_POSITION },
      size: { ...DEFAULT_CHART_INSERT_SIZE },
      chart_type: "pie",
      title: "Ingresos por línea de oferta",
      color: "7555F6",
      axis_color: "D8D8D8",
      grid_color: "D8D8D8",
      data_labels: "top",
      categories,
      series: [{ name: "Cuota de ingresos", values }],
      colors,
      data: chartData(categories, values, colors),
      ...schema,
    };
  }

  if (chartType === "stacked_bar" || chartType === "horizontal_stacked_bar") {
    const categories = ["Q1", "Q2", "Q3", "Q4"];
    const values = [38, 54, 47, 68];
    const secondaryValues = [24, 36, 31, 42];
    const colors = ["7F22FE", "155DFC"];

    return {
      type: "chart",
      position: { ...DEFAULT_CHART_INSERT_POSITION },
      size: { width: 538, height: 410 },
      chart_type: chartType,
      title: "Ingresos trimestrales por segmento",
      color: "7F22FE",
      axis_color: "D0D5DD",
      grid_color: "D0D5DD",
      data_labels: "top",
      legend: true,
      x_axis_grid: true,
      y_axis_grid: true,
      categories,
      series: [
        { name: "Nuevo negocio", values },
        { name: "Expansión", values: secondaryValues },
      ],
      colors,
      data: chartData(categories, values, colors),
      ...schema,
    };
  }

  const { title, categories, values, seriesName, colors } =
    chartExample(chartType);

  return {
    type: "chart",
    position: { ...DEFAULT_CHART_INSERT_POSITION },
    size: { width: 538, height: 410 },
    chart_type: chartType,
    title,
    color: "7F22FE",
    axis_color: "D0D5DD",
    grid_color: "D0D5DD",
    data_labels: "top",
    x_axis_grid: true,
    y_axis_grid: true,
    categories,
    series: [{ name: seriesName, values }],
    colors,
    data: chartData(categories, values, colors),
    ...schema,
  };
}

function createDefaultChartInsertElements(kind?: string): SlideElement[] {
  const chartType = chartTypeFromPaletteId(kind);
  return chartType ? [makeChartElement(chartType)] : [];
}

function infographicTypeFromPaletteId(id?: string): InfographicType | null {
  switch (id) {
    case "progress_bar":
    case "progress-bar":
      return "progress_bar";
    case "gauge":
    case "gauge-chart":
      return "gauge";
    case "gantt":
    case "gantt-chart":
      return "gantt";
    case "timeline":
      return "timeline";
    case "roadmap":
    case "road-map":
      return "roadmap";
    case "milestone_timeline":
    case "milestone-timeline":
      return "milestone_timeline";
    case "staircase":
    case "staircase-steps":
      return "staircase";
    case "supply_chain":
    case "supply-chain":
      return "supply_chain";
    case "stair_step_blocks":
    case "stair-step-blocks":
      return "stair_step_blocks";
    case "maturity_model":
    case "maturity-model":
      return "maturity_model";
    case "pillar_framework":
    case "pillar-framework":
      return "pillar_framework";
    case "transformation_hub":
    case "transformation-hub":
      return "transformation_hub";
    case "diagonal_circles":
    case "diagonal-circles":
      return "diagonal_circles";
    case "risk_matrix":
    case "risk-matrix":
      return "risk_matrix";
    case "chevron_process":
    case "chevron-process":
      return "chevron_process";
    case "radial_cycle":
    case "radial-cycle":
      return "radial_cycle";
    case "conversion_funnel":
    case "conversion-funnel":
      return "conversion_funnel";
    case "vertical_funnel":
    case "vertical-funnel":
      return "vertical_funnel";
    case "pyramid":
      return "pyramid";
    case "segmented_wheel":
    case "segmented-wheel":
      return "segmented_wheel";
    case "customer_journey":
    case "customer-journey":
      return "customer_journey";
    case "before_after":
    case "before-after":
      return "before_after";
    case "impact_effort_matrix":
    case "impact-effort-matrix":
      return "impact_effort_matrix";
    case "comparison_matrix":
    case "comparison-matrix":
      return "comparison_matrix";
    case "org_chart":
    case "org-chart":
      return "org_chart";
    case "decision_tree":
    case "decision-tree":
      return "decision_tree";
    case "mind_map":
    case "mind-map":
      return "mind_map";
    default:
      return null;
  }
}

function makeInfographicElement(infographicType: InfographicType): SlideElement {
  if (infographicType === "progress_bar") {
    return {
      type: "infographic",
      position: { ...DEFAULT_INFOGRAPHIC_INSERT_POSITION },
      size: { width: 420, height: 74 },
      data: {
        type: "progress_bar",
        min_value: 0,
        max_value: 100,
        value: 68,
      },
      colors: ["E5E7EB", "2563EB"],
      text_color: "111111",
      decorative: false,
      name: "progress_bar",
    };
  }

  if (infographicType === "gantt") {
    return {
      type: "infographic",
      position: { ...DEFAULT_INFOGRAPHIC_INSERT_POSITION },
      size: { width: 720, height: 300 },
      data: {
        type: "gantt",
        columns: ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago"].map((label) => ({
          label,
        })),
        rows: [
          {
            label: "Investigación y descubrimiento",
            items: [
              {
                name: "Investigación y descubrimiento",
                start: { column: 0, offset: 0 },
                end: { column: 2, offset: 0.5 },
              },
            ],
          },
          {
            label: "Planificación de contenidos",
            items: [
              {
                name: "Planificación de contenidos",
                start: { column: 1, offset: 0.14 },
                end: { column: 2, offset: 0.88 },
              },
            ],
          },
          {
            label: "Desarrollo de la estrategia",
            items: [
              {
                name: "Desarrollo de la estrategia",
                start: { column: 2, offset: 0.34 },
                end: { column: 4, offset: 0.86 },
              },
            ],
          },
          {
            label: "Diseño y producción",
            items: [{
              name: "Diseño y producción",
              start: { column: 4, offset: 0 },
              end: { column: 6, offset: 0.38 },
            }],
          },
          {
            label: "Creación de contenidos",
            items: [{
              name: "Creación de contenidos",
              start: { column: 5, offset: 0 },
              end: { column: 7, offset: 1 },
            }],
          },
          {
            label: "Lanzamiento de la campaña",
            items: [{
              name: "Lanzamiento de la campaña",
              start: { column: 5, offset: 0.52 },
              end: { column: 7, offset: 0.68 },
            }],
          },
          {
            label: "Seguimiento del rendimiento",
            items: [{
              name: "Seguimiento del rendimiento",
              start: { column: 4, offset: 0.3 },
              end: { column: 7, offset: 1 },
            }],
          },
          {
            label: "Optimización",
            items: [{
              name: "Optimización",
              start: { column: 6, offset: 0.9 },
              end: { column: 7, offset: 1 },
            }],
          },
          {
            label: "Revisión final",
            items: [{
              name: "Revisión final",
              start: { column: 6, offset: 0.56 },
              end: { column: 7, offset: 1 },
            }],
          },
        ],
      },
      colors: [
        "FFFFFF",
        "102E79",
        "24468E",
        "385EAA",
        "4D73BE",
        "6388D0",
        "7CA2E5",
        "9AC8ED",
        "B5DCF4",
        "CBEAF7",
      ],
      text_color: "111111",
      decorative: false,
      name: "gantt_chart",
    };
  }

  if (infographicType === "timeline") {
    return {
      type: "infographic",
      position: { ...DEFAULT_INFOGRAPHIC_INSERT_POSITION },
      size: { width: 720, height: 260 },
      data: {
        type: "timeline",
        items: [
          {
            icon: {
              url: INFOGRAPHIC_EXAMPLE_ICON_URLS.discover,
              color: "FFFFFF",
            },
            heading: "Descubrir",
            description: "Investiga el reto e identifica las necesidades clave.",
          },
          {
            icon: {
              url: INFOGRAPHIC_EXAMPLE_ICON_URLS.define,
              color: "FFFFFF",
            },
            heading: "Definir",
            description: "Establece objetivos, prioridades y una dirección claros.",
          },
          {
            icon: {
              url: INFOGRAPHIC_EXAMPLE_ICON_URLS.plan,
              color: "FFFFFF",
            },
            heading: "Planificar",
            description: "Elabora la estrategia, el calendario y el plan de acción.",
          },
          {
            icon: {
              url: INFOGRAPHIC_EXAMPLE_ICON_URLS.execute,
              color: "FFFFFF",
            },
            heading: "Ejecutar",
            description: "Pon en marcha el plan y haz seguimiento del progreso.",
          },
          {
            icon: {
              url: INFOGRAPHIC_EXAMPLE_ICON_URLS.measure,
              color: "FFFFFF",
            },
            heading: "Medir",
            description: "Revisa los resultados frente a los indicadores clave de rendimiento.",
          },
        ],
      },
      colors: ["FFFFFF", "102E79", "24468E", "385EAA", "4D73BE", "6388D0"],
      text_color: "111111",
      decorative: false,
      name: "timeline",
    };
  }

  if (infographicType === "roadmap") {
    return {
      type: "infographic",
      position: { ...DEFAULT_INFOGRAPHIC_INSERT_POSITION },
      size: { width: 720, height: 252 },
      data: {
        type: "roadmap",
        items: [
          {
            heading: "Descubrir",
            description: "Investiga el reto e identifica las necesidades clave.",
          },
          {
            heading: "Definir",
            description: "Establece objetivos, prioridades y una dirección claros.",
          },
          {
            heading: "Planificar",
            description: "Elabora la estrategia, el calendario y el plan de acción.",
          },
          {
            heading: "Ejecutar",
            description: "Pon en marcha el plan y haz seguimiento del progreso.",
          },
          {
            heading: "Medir",
            description: "Revisa los resultados frente a los indicadores clave de rendimiento.",
          },
          {
            heading: "Revisar",
            description: "Recoge los aprendizajes y decide los siguientes pasos.",
          },
        ],
      },
      colors: ["FFFFFF", "102E79", "24468E", "385EAA", "4D73BE", "6388D0", "7CA2E5"],
      text_color: null,
      decorative: false,
      name: "roadmap",
    };
  }

  if (infographicType === "milestone_timeline") {
    return {
      type: "infographic",
      position: { ...DEFAULT_INFOGRAPHIC_INSERT_POSITION },
      size: { width: 720, height: 260 },
      data: {
        type: "milestone_timeline",
        items: Array.from({ length: 7 }, (_, index) => ({
          heading: String(2020 + index),
          description: "Se definieron la visión, los objetivos y la dirección estratégica del proyecto.",
        })),
      },
      colors: ["FFFFFF", "102E79", "24468E", "385EAA", "4D73BE", "6388D0", "7CA2E5", "D6D6D6"],
      text_color: null,
      decorative: false,
      name: "milestone_timeline",
    };
  }

  if (infographicType === "staircase") {
    return {
      type: "infographic",
      position: { ...DEFAULT_INFOGRAPHIC_INSERT_POSITION },
      size: { width: 720, height: 340 },
      data: {
        type: "staircase",
        items: [
          {
            icon: { url: INFOGRAPHIC_EXAMPLE_ICON_URLS.discover, color: "FFFFFF" },
            heading: "Impulsar el crecimiento",
            description: "Amplía el alcance de clientes, mejora la interacción y aumenta los ingresos.",
          },
          {
            icon: { url: INFOGRAPHIC_EXAMPLE_ICON_URLS.define, color: "FFFFFF" },
            heading: "Entrar en el mercado",
            description: "Lanza de forma estratégica y consolida una presencia sólida en el mercado.",
          },
          {
            icon: { url: INFOGRAPHIC_EXAMPLE_ICON_URLS.plan, color: "FFFFFF" },
            heading: "Construir la solución",
            description: "Desarrolla productos, servicios y experiencias.",
          },
          {
            icon: { url: INFOGRAPHIC_EXAMPLE_ICON_URLS.execute, color: "FFFFFF" },
            heading: "Entender el mercado",
            description: "Identifica las necesidades de los clientes, las tendencias del mercado y los huecos competitivos.",
          },
          {
            icon: { url: INFOGRAPHIC_EXAMPLE_ICON_URLS.measure, color: "FFFFFF" },
            heading: "Definir la visión",
            description: "Establece objetivos y prioridades claros y una dirección a largo plazo.",
          },
        ],
      },
      colors: ["FFFFFF", "102E79", "24468E", "385EAA", "4D73BE", "6388D0"],
      text_color: null,
      decorative: false,
      name: "staircase",
    };
  }

  if (infographicType === "supply_chain") {
    const entries = [
      ["ABASTECIMIENTO", "Materias primas\nRed de proveedores"],
      ["COMPRAS", "Adquisiciones\nCalidad y coste"],
      ["PRODUCCIÓN", "Fabricación\nControl de calidad"],
      ["DISTRIBUCIÓN", "Almacenaje\nLogística y entrega"],
      ["MERCADO FINAL", "Minorista / B2B\nEntrega al cliente"],
    ] as const;
    return { type: "infographic", position: { ...DEFAULT_INFOGRAPHIC_INSERT_POSITION }, size: { width: 720, height: 300 }, data: { type: "supply_chain", items: entries.map(([heading, description], index) => ({ icon: { url: Object.values(INFOGRAPHIC_EXAMPLE_ICON_URLS)[index % 5], color: "FFFFFF" }, heading, description })) }, colors: ["FFFFFF", "102E79", "24468E", "385EAA", "4D73BE", "6388D0", "D6D6D6"], text_color: null, decorative: false, name: "supply_chain" };
  }

  if (infographicType === "stair_step_blocks") {
    const entries = [
      ["Base", "Establece capacidades clave, procesos claros, recursos y estructuras operativas."],
      ["Optimizar", "Agiliza los flujos de trabajo, mejora la eficiencia, reduce los cuellos de botella y refuerza el rendimiento."],
      ["Escalar", "Amplía la capacidad, el alcance de clientes, la tecnología y las capacidades operativas para sostener el crecimiento."],
      ["Acelerar", "Invierte en innovación, nuevas oportunidades, alianzas e iniciativas de crecimiento de alto impacto."],
      ["Liderar", "Consolida el liderazgo en el mercado mediante la mejora continua y la diferenciación."],
    ] as const;
    return { type: "infographic", position: { ...DEFAULT_INFOGRAPHIC_INSERT_POSITION }, size: { width: 720, height: 350 }, data: { type: "stair_step_blocks", items: entries.map(([heading, description], index) => ({ icon: { url: Object.values(INFOGRAPHIC_EXAMPLE_ICON_URLS)[index % 5], color: "FFFFFF" }, heading, description })) }, colors: ["FFFFFF", "102E79", "24468E", "385EAA", "4D73BE", "6388D0"], text_color: null, decorative: false, name: "stair_step_blocks" };
  }

  if (infographicType === "maturity_model") {
    const entries = [
      ["Inicial", "Las capacidades se perfeccionan de forma continua mediante automatización, innovación, analítica avanzada y una gestión proactiva del rendimiento."],
      ["En desarrollo", "El rendimiento se mide activamente con KPI y datos, lo que permite a los equipos detectar carencias y gestionar resultados."],
      ["Definido", "Los procesos clave están estandarizados, documentados y se aplican de forma coherente, con roles y gobernanza más claros."],
      ["Gestionado", "Empiezan a surgir procesos y responsabilidades básicos, pero la ejecución varía entre equipos."],
      ["Optimizado", "Los procesos son en gran medida informales y reactivos, con poca estandarización y sin responsables claros."],
    ] as const;
    return { type: "infographic", position: { ...DEFAULT_INFOGRAPHIC_INSERT_POSITION }, size: { width: 720, height: 390 }, data: { type: "maturity_model", items: entries.map(([heading, description], index) => ({ icon: { url: Object.values(INFOGRAPHIC_EXAMPLE_ICON_URLS)[index % 5], color: "FFFFFF" }, heading, description })) }, colors: ["FFFFFF", "102E79", "24468E", "385EAA", "4D73BE", "6388D0"], text_color: null, decorative: false, name: "maturity_model" };
  }

  if (infographicType === "pillar_framework") {
    const entries = [
      ["Cliente", "Refuerza la relación con los clientes, mejora la experiencia y aporta más valor en los puntos de contacto clave.", "Experiencia y valor"],
      ["Crecimiento", "Amplía la presencia en el mercado, desarrolla nuevas oportunidades y crea fuentes de ingresos sostenibles.", "Ingresos y mercado"],
      ["Operaciones", "Simplifica procesos, mejora la productividad y crea capacidades operativas escalables.", "Eficiencia y escala"],
      ["Innovación", "Aprovecha la tecnología, los datos y la innovación para crear nuevas soluciones y diferenciarte.", "Digital y nuevas ideas"],
      ["Personas", "Desarrolla capacidades, refuerza el liderazgo y crea una cultura de responsabilidad y mejora continua.", "Talento y cultura"],
    ] as const;
    return { type: "infographic", position: { ...DEFAULT_INFOGRAPHIC_INSERT_POSITION }, size: { width: 720, height: 380 }, data: { type: "pillar_framework", title: "Marco de crecimiento y transformación", items: entries.map(([heading, description, focus], index) => ({ icon: { url: Object.values(INFOGRAPHIC_EXAMPLE_ICON_URLS)[index % 5], color: "FFFFFF" }, heading, description, focus })) }, colors: ["FFFFFF", "102E79", "24468E", "385EAA", "4D73BE", "6388D0", "D6D6D6"], text_color: null, decorative: false, name: "pillar_framework" };
  }

  if (infographicType === "transformation_hub") {
    return { type: "infographic", position: { ...DEFAULT_INFOGRAPHIC_INSERT_POSITION }, size: { width: 720, height: 300 }, data: { type: "transformation_hub", center_label: "Transformación\nempresarial", items: ["Estrategia", "Cliente", "Personas", "Procesos", "Tecnología", "Datos"].map((heading) => ({ heading })) }, colors: ["FFFFFF", "102E79", "24468E", "385EAA", "4D73BE", "6388D0", "D6D6D6"], text_color: null, decorative: false, name: "transformation_hub" };
  }

  if (infographicType === "diagonal_circles") {
    const entries = [
      ["Estrategia", "Define la dirección, las prioridades, los objetivos y el foco de inversión de la organización."],
      ["Personas", "Desarrolla las habilidades, el liderazgo, la responsabilidad y la cultura necesarios para ejecutar la estrategia."],
      ["Cliente", "Se centra en las necesidades del cliente, la experiencia, la interacción y la creación de valor."],
      ["Procesos", "Mejora los flujos de trabajo, la estandarización, la eficiencia y la gobernanza."],
      ["Tecnología", "Hace posible la transformación digital mediante sistemas, automatización, integración y capacidades basadas en datos."],
    ] as const;
    return { type: "infographic", position: { ...DEFAULT_INFOGRAPHIC_INSERT_POSITION }, size: { width: 720, height: 430 }, data: { type: "diagonal_circles", items: entries.map(([heading, description], index) => ({ icon: { url: Object.values(INFOGRAPHIC_EXAMPLE_ICON_URLS)[index % 5], color: "FFFFFF" }, heading, description })) }, colors: ["FFFFFF", "102E79", "24468E", "385EAA", "4D73BE", "6388D0", "D6D6D6"], text_color: null, decorative: false, name: "diagonal_circles" };
  }

  if (infographicType === "risk_matrix") {
    const entries = [
      ["Identificar", "Detecta riesgos potenciales en operaciones, tecnología, finanzas, personas y factores externos."],
      ["Priorizar", "Ordena los riesgos por gravedad para centrar la atención y los recursos en las áreas más críticas."],
      ["Evaluar", "Valora la probabilidad, el impacto y la exposición para entender cada riesgo."],
      ["Responder", "Define acciones de mitigación, controles, responsables y planes de contingencia para los riesgos prioritarios."],
    ] as const;
    return { type: "infographic", position: { ...DEFAULT_INFOGRAPHIC_INSERT_POSITION }, size: { width: 720, height: 370 }, data: { type: "risk_matrix", center_label: "RISK", items: entries.map(([heading, description], index) => ({ icon: { url: Object.values(INFOGRAPHIC_EXAMPLE_ICON_URLS)[index % 5], color: "FFFFFF" }, heading, description })) }, colors: ["FFFFFF", "102E79", "24468E", "385EAA", "4D73BE", "6388D0", "D6D6D6"], text_color: null, decorative: false, name: "risk_matrix" };
  }

  if (infographicType === "chevron_process") {
    return {
      type: "infographic",
      position: { ...DEFAULT_INFOGRAPHIC_INSERT_POSITION },
      size: { width: 720, height: 360 },
      data: {
        type: "chevron_process",
        items: [
          {
            heading: "Descubrir",
            description: "Comprende el negocio, el mercado y los retos clave.",
          },
          {
            heading: "Analizar",
            description: "Evalúa datos, tendencias, competidores y oportunidades.",
          },
          {
            heading: "Definir",
            description: "Prioriza los asuntos estratégicos y define los objetivos.",
          },
          {
            heading: "Diseño",
            description: "Desarrolla soluciones, iniciativas y prioridades estratégicas.",
          },
          {
            heading: "Implementar",
            description: "Elabora la hoja de ruta, las acciones, los responsables y los siguientes pasos.",
          },
        ],
      },
      colors: ["FFFFFF", "102E79", "24468E", "385EAA", "4D73BE", "6388D0"],
      text_color: null,
      decorative: false,
      name: "chevron_process",
    };
  }

  if (infographicType === "radial_cycle") {
    return {
      type: "infographic",
      position: { x: 250, y: 100 },
      size: { width: 560, height: 520 },
      data: {
        type: "radial_cycle",
        center_image:
          "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=900&q=80",
        items: [
          {
            heading: "Descubrir",
            description: "Comprende el negocio, el mercado y los retos clave.",
          },
          {
            heading: "Analizar",
            description: "Revisa los datos, identifica patrones y evalúa oportunidades.",
          },
          {
            heading: "Planificar",
            description: "Define prioridades, desarrolla el enfoque y establece acciones claras.",
          },
          {
            heading: "Ejecutar",
            description: "Aplica las acciones recomendadas y haz seguimiento del progreso.",
          },
          {
            heading: "Optimizar",
            description: "Mide el rendimiento y mejora el plan.",
          },
          {
            heading: "Cerrar",
            description: "Recoge resultados, decisiones y siguientes pasos.",
          },
        ],
      },
      colors: ["FFFFFF", "102E79", "24468E", "385EAA", "4D73BE", "6388D0", "7CA2E5"],
      text_color: null,
      decorative: false,
      name: "radial_cycle",
    };
  }

  if (infographicType === "conversion_funnel") {
    return {
      type: "infographic",
      position: { ...DEFAULT_INFOGRAPHIC_INSERT_POSITION },
      size: { width: 720, height: 320 },
      data: {
        type: "conversion_funnel",
        items: [
          {
            value: 57,
            heading: "Reconocimiento",
            description: "Aplica las acciones recomendadas y haz seguimiento del progreso.",
          },
          {
            value: 42,
            heading: "Interés",
            description: "Usuarios que interactúan con la oferta.",
          },
          {
            value: 36,
            heading: "Consideración",
            description: "Clientes potenciales que evalúan la solución.",
          },
          {
            value: 27,
            heading: "Intención",
            description: "Usuarios con una intención de compra clara.",
          },
        ],
      },
      colors: ["FFFFFF", "102E79", "24468E", "385EAA", "4D73BE", "6388D0", "7CA2E5"],
      text_color: null,
      decorative: false,
      name: "conversion_funnel",
    };
  }

  if (infographicType === "vertical_funnel") {
    return {
      type: "infographic",
      position: { ...DEFAULT_INFOGRAPHIC_INSERT_POSITION },
      size: { width: 720, height: 480 },
      data: {
        type: "vertical_funnel",
        items: [
          {
            value: 100,
            heading: "Reconocimiento",
            description: "Toda la audiencia que entra en el embudo.",
          },
          {
            value: 60,
            heading: "Interés",
            description: "Personas que interactúan con la oferta.",
          },
          {
            value: 35,
            heading: "Consideración",
            description: "Clientes potenciales que evalúan la solución.",
          },
          {
            value: 20,
            heading: "Conversión",
            description: "Personas que completan la acción objetivo.",
          },
        ],
      },
      colors: ["FFFFFF", "102E79", "24468E", "4D73BE", "7CA2E5"],
      text_color: null,
      decorative: false,
      name: "vertical_funnel",
    };
  }

  if (infographicType === "pyramid") {
    return {
      type: "infographic",
      position: { ...DEFAULT_INFOGRAPHIC_INSERT_POSITION },
      size: { width: 720, height: 400 },
      data: {
        type: "pyramid",
        items: [
          {
            icon: { url: INFOGRAPHIC_EXAMPLE_ICON_URLS.discover, color: "FFFFFF" },
            heading: "Base",
            description: "Establece procesos, capacidades y recursos sólidos.",
          },
          {
            icon: { url: INFOGRAPHIC_EXAMPLE_ICON_URLS.define, color: "FFFFFF" },
            heading: "Eficiencia",
            description: "Agiliza las operaciones, reduce carencias y optimiza los costes.",
          },
          {
            icon: { url: INFOGRAPHIC_EXAMPLE_ICON_URLS.plan, color: "FFFFFF" },
            heading: "Crecimiento",
            description: "Entra en nuevos mercados, refuerza la oferta y amplía el alcance.",
          },
          {
            icon: { url: INFOGRAPHIC_EXAMPLE_ICON_URLS.execute, color: "FFFFFF" },
            heading: "Innovación",
            description: "Desarrolla nuevas ideas, soluciones y ventajas competitivas.",
          },
        ],
      },
      colors: ["FFFFFF", "102E79", "24468E", "385EAA", "4D73BE"],
      text_color: null,
      decorative: false,
      name: "pyramid",
    };
  }

  if (infographicType === "segmented_wheel") {
    return {
      type: "infographic",
      position: { ...DEFAULT_INFOGRAPHIC_INSERT_POSITION },
      size: { width: 720, height: 460 },
      data: {
        type: "segmented_wheel",
        items: [
          {
            icon: { url: INFOGRAPHIC_EXAMPLE_ICON_URLS.measure, color: "FFFFFF" },
            heading: "Base",
            description: "Establece procesos, capacidades y recursos sólidos.",
          },
          {
            icon: { url: INFOGRAPHIC_EXAMPLE_ICON_URLS.define, color: "FFFFFF" },
            heading: "Eficiencia",
            description: "Agiliza las operaciones, reduce carencias y optimiza los costes.",
          },
          {
            icon: { url: INFOGRAPHIC_EXAMPLE_ICON_URLS.execute, color: "FFFFFF" },
            heading: "Crecimiento",
            description: "Entra en nuevos mercados, refuerza la oferta y amplía el alcance.",
          },
          {
            icon: { url: INFOGRAPHIC_EXAMPLE_ICON_URLS.plan, color: "FFFFFF" },
            heading: "Innovación",
            description: "Desarrolla nuevas ideas, soluciones y ventajas competitivas.",
          },
          {
            icon: { url: INFOGRAPHIC_EXAMPLE_ICON_URLS.discover, color: "FFFFFF" },
            heading: "Liderazgo",
            description: "Construye resiliencia a largo plazo, liderazgo en el mercado y creación de valor.",
          },
        ],
      },
      colors: ["FFFFFF", "24468E", "385EAA", "4D73BE", "6388D0", "102E79"],
      text_color: null,
      decorative: false,
      name: "segmented_wheel",
    };
  }

  if (infographicType === "customer_journey") {
    return {
      type: "infographic",
      position: { ...DEFAULT_INFOGRAPHIC_INSERT_POSITION },
      size: { width: 720, height: 420 },
      data: {
        type: "customer_journey",
        items: [
          {
            icon: { url: INFOGRAPHIC_EXAMPLE_ICON_URLS.discover, color: "111111" },
            heading: null,
            description: null,
          },
          {
            icon: { url: INFOGRAPHIC_EXAMPLE_ICON_URLS.measure, color: "FFFFFF" },
            heading: "Reconocimiento",
            description: "El cliente descubre la marca a través del marketing y las recomendaciones.",
          },
          {
            icon: { url: INFOGRAPHIC_EXAMPLE_ICON_URLS.discover, color: "FFFFFF" },
            heading: "Consideración",
            description: "El cliente explora opciones y compara alternativas.",
          },
          {
            icon: { url: INFOGRAPHIC_EXAMPLE_ICON_URLS.define, color: "FFFFFF" },
            heading: "Compra",
            description: "El cliente toma una decisión y completa la transacción.",
          },
          {
            icon: { url: INFOGRAPHIC_EXAMPLE_ICON_URLS.execute, color: "FFFFFF" },
            heading: "Experiencia",
            description: "El cliente usa el producto o servicio e interactúa con el soporte.",
          },
        ],
      },
      colors: ["FFFFFF", "102E79", "24468E", "385EAA", "4D73BE", "6388D0", "D6D6D6"],
      text_color: null,
      decorative: false,
      name: "customer_journey",
    };
  }

  if (infographicType === "before_after") {
    const beforeItems = [
      ["Procesos manuales", "Flujos de trabajo que consumen mucho tiempo."],
      ["Visibilidad limitada", "Es difícil acceder a los datos."],
      ["Flujos de trabajo fragmentados", "Los equipos trabajan aislados."],
    ] as const;
    const afterItems = [
      ["Procesos automatizados", "Operaciones más rápidas y ágiles."],
      ["Decisiones más rápidas", "Acciones más rápidas basadas en datos."],
      ["Flujos de trabajo conectados", "Mejor colaboración entre equipos."],
    ] as const;
    const beforeIcons = [
      INFOGRAPHIC_EXAMPLE_ICON_URLS.measure,
      INFOGRAPHIC_EXAMPLE_ICON_URLS.discover,
      INFOGRAPHIC_EXAMPLE_ICON_URLS.define,
    ];
    const afterIcons = [
      INFOGRAPHIC_EXAMPLE_ICON_URLS.plan,
      INFOGRAPHIC_EXAMPLE_ICON_URLS.execute,
      INFOGRAPHIC_EXAMPLE_ICON_URLS.measure,
    ];
    return {
      type: "infographic",
      position: { ...DEFAULT_INFOGRAPHIC_INSERT_POSITION },
      size: { width: 720, height: 460 },
      data: {
        type: "before_after",
        before_label: "Antes",
        after_label: "Después",
        items: beforeItems.flatMap(([beforeHeading, beforeDescription], index) => [
          {
            icon: { url: beforeIcons[index], color: "FFFFFF" },
            heading: beforeHeading,
            description: beforeDescription,
          },
          {
            icon: { url: afterIcons[index], color: "FFFFFF" },
            heading: afterItems[index][0],
            description: afterItems[index][1],
          },
        ]),
      },
      colors: ["FFFFFF", "102E79", "24468E", "385EAA", "4D73BE", "6388D0", "7CA2E5"],
      text_color: null,
      decorative: false,
      name: "before_after",
    };
  }

  if (infographicType === "impact_effort_matrix") {
    return {
      type: "infographic",
      position: { ...DEFAULT_INFOGRAPHIC_INSERT_POSITION },
      size: { width: 720, height: 420 },
      data: {
        type: "impact_effort_matrix",
        x_axis_label: "Impacto",
        y_axis_label: "Esfuerzo",
        low_label: "Bajo",
        high_label: "Alto",
        items: [
          {
            heading: "Victorias rápidas",
            description: "Iniciativas de alto impacto que requieren relativamente poco esfuerzo, ideales para ejecutarlas de inmediato y obtener resultados rápidos.",
          },
          {
            heading: "Prioridades estratégicas",
            description: "Iniciativas de alto impacto que requieren una inversión, planificación y recursos significativos, pero que pueden generar valor de negocio a largo plazo.",
          },
          {
            heading: "Despriorizar",
            description: "Iniciativas de bajo impacto que requieren un esfuerzo o unos recursos considerables, por lo que son menos adecuadas como foco inmediato.",
          },
          {
            heading: "Tareas de relleno",
            description: "Iniciativas de bajo impacto fáciles de implementar que pueden abordarse cuando haya recursos disponibles.",
          },
        ],
      },
      colors: ["FFFFFF", "102E79", "24468E", "385EAA", "4D73BE", "6388D0", "D6D6D6"],
      text_color: null,
      decorative: false,
      name: "impact_effort_matrix",
    };
  }

  if (infographicType === "comparison_matrix") {
    const criteria = [
      "Acceso al mercado",
      "Inversión necesaria",
      "Rapidez de lanzamiento",
      "Control",
      "Escalabilidad",
    ];
    return {
      type: "infographic",
      position: { ...DEFAULT_INFOGRAPHIC_INSERT_POSITION },
      size: { width: 720, height: 340 },
      data: {
        type: "comparison_matrix",
        criteria,
        items: [
          { icon: { url: INFOGRAPHIC_EXAMPLE_ICON_URLS.measure, color: "111111" }, heading: "Crecimiento orgánico", values: ["Moderado", "Bajo", "Lento", "Alto", "Alto"] },
          { icon: { url: INFOGRAPHIC_EXAMPLE_ICON_URLS.define, color: "111111" }, heading: "Innovación de producto", values: ["Alto", "Bajo", "Rápido", "Bajo", "Alto"] },
          { icon: { url: INFOGRAPHIC_EXAMPLE_ICON_URLS.discover, color: "111111" }, heading: "Alianza estratégica", values: ["Bajo", "Bajo", "Lento", "Rápido", "Alto"] },
          { icon: { url: INFOGRAPHIC_EXAMPLE_ICON_URLS.execute, color: "111111" }, heading: "Adquisición", values: ["Moderado", "Bajo", "Lento", "Alto", "Alto"] },
          { icon: { url: INFOGRAPHIC_EXAMPLE_ICON_URLS.plan, color: "111111" }, heading: "Expansión de mercado", values: ["Moderado", "Bajo", "Lento", "Alto", "Alto"] },
        ],
      },
      colors: ["FFFFFF", "102E79", "24468E", "385EAA", "4D73BE", "6388D0", "D6D6D6"],
      text_color: null,
      decorative: false,
      name: "comparison_matrix",
    };
  }

  if (infographicType === "org_chart") {
    return {
      type: "infographic",
      position: { ...DEFAULT_INFOGRAPHIC_INSERT_POSITION },
      size: { width: 720, height: 360 },
      data: {
        type: "org_chart",
        items: [
          { id: "ceo", parent_id: null, heading: "Aarav Sharma", description: "Director ejecutivo" },
          { id: "coo", parent_id: "ceo", heading: "Nisha Kapoor", description: "Director de operaciones" },
          { id: "cfo", parent_id: "ceo", heading: "Rohan Mehta", description: "Director financiero" },
          { id: "cmo", parent_id: "ceo", heading: "Priya Malhotra", description: "Directora de marketing" },
          { id: "operations", parent_id: "coo", heading: "Rohan Thapa", description: "Responsable de operaciones" },
          { id: "product", parent_id: "cmo", heading: "Vikram Joshi", description: "Responsable de producto" },
          { id: "finance", parent_id: "cmo", heading: "Rahul Nair", description: "Responsable de finanzas" },
          { id: "ops-executive", parent_id: "operations", heading: "Sneha Gurung", description: "Técnica de operaciones" },
          { id: "analyst", parent_id: "operations", heading: "Amit Shrestha", description: "Analista de procesos" },
          { id: "finance-executive", parent_id: "finance", heading: "Aditya Rao", description: "Técnico de finanzas" },
          { id: "accountant", parent_id: "finance", heading: "Dev Sharma", description: "Contable" },
        ],
      },
      colors: ["FFFFFF", "102E79", "24468E", "385EAA", "4D73BE", "6388D0", "D6D6D6"],
      text_color: null,
      decorative: false,
      name: "org_chart",
    };
  }

  if (infographicType === "decision_tree") {
    return {
      type: "infographic",
      position: { ...DEFAULT_INFOGRAPHIC_INSERT_POSITION },
      size: { width: 720, height: 360 },
      data: {
        type: "decision_tree",
        items: [
          { id: "decision", parent_id: null, heading: "Decisión de expansión de mercado" },
          { id: "demand", parent_id: "decision", heading: "Demanda del mercado" },
          { id: "competitive", parent_id: "decision", heading: "Posición competitiva" },
          { id: "feasibility", parent_id: "decision", heading: "Viabilidad de la inversión" },
          { id: "readiness", parent_id: "decision", heading: "Preparación operativa" },
          { id: "market-demand", parent_id: "demand", heading: "Demanda del mercado" },
          { id: "growth", parent_id: "demand", heading: "Potencial de crecimiento" },
          { id: "competition", parent_id: "competitive", heading: "Nivel de competencia" },
          { id: "saturation", parent_id: "competitive", heading: "Saturación del mercado" },
          { id: "capacity", parent_id: "feasibility", heading: "Capacidad limitada" },
          { id: "funding", parent_id: "feasibility", heading: "Requiere financiación" },
          { id: "ready", parent_id: "readiness", heading: "Totalmente preparado" },
          { id: "partial", parent_id: "readiness", heading: "Parcialmente preparado" },
        ],
      },
      colors: ["FFFFFF", "102E79", "24468E", "385EAA", "4D73BE", "6388D0", "D6D6D6"],
      text_color: null,
      decorative: false,
      name: "decision_tree",
    };
  }

  if (infographicType === "mind_map") {
    return {
      type: "infographic",
      position: { ...DEFAULT_INFOGRAPHIC_INSERT_POSITION },
      size: { width: 720, height: 380 },
      data: {
        type: "mind_map",
        items: [
          {
            icon: {
              url: INFOGRAPHIC_EXAMPLE_ICON_URLS.discover,
              color: "FFFFFF",
            },
            heading: "Descubrir",
            description: "Investiga el reto e identifica las necesidades clave.",
            items: [],
          },
          {
            icon: {
              url: INFOGRAPHIC_EXAMPLE_ICON_URLS.define,
              color: "FFFFFF",
            },
            heading: "Definir",
            description: "Establece objetivos, prioridades y una dirección claros.",
            items: [],
          },
          {
            icon: {
              url: INFOGRAPHIC_EXAMPLE_ICON_URLS.plan,
              color: "FFFFFF",
            },
            heading: "Planificar",
            description: "Elabora la estrategia, el calendario y el plan de acción.",
            items: [],
          },
          {
            icon: {
              url: INFOGRAPHIC_EXAMPLE_ICON_URLS.execute,
              color: "FFFFFF",
            },
            heading: "Ejecutar",
            description: "Pon en marcha el plan y haz seguimiento del progreso.",
            items: [],
          },
          {
            icon: {
              url: INFOGRAPHIC_EXAMPLE_ICON_URLS.measure,
              color: "FFFFFF",
            },
            heading: "Medir",
            description:
              "Revisa los resultados frente a los indicadores clave de rendimiento.",
            items: [],
          },
        ],
      },
      colors: ["FFFFFF", "536AA2", "647DB8", "7894CF", "8AA8E4", "9DC2ED"],
      text_color: "111111",
      decorative: false,
      name: "mind_map",
    };
  }

  return {
    type: "infographic",
    position: { ...DEFAULT_INFOGRAPHIC_INSERT_POSITION },
    size: { width: 320, height: 190 },
    data: {
      type: "gauge",
      min_value: 0,
      max_value: 100,
      value: 76,
    },
    colors: ["E5E7EB", "2563EB"],
    text_color: "111111",
    decorative: false,
    name: "gauge_chart",
  };
}

function createDefaultInfographicInsertElements(kind?: string): SlideElement[] {
  const infographicType = infographicTypeFromPaletteId(kind);
  return infographicType
    ? [fitInfographicElementToData(makeInfographicElement(infographicType))]
    : [];
}

type TablePreviewDefinition = {
  name: string;
  columns: string[];
  rows: string[][];
};

function makeTableElement({
  name,
  columns,
  rows,
}: TablePreviewDefinition): SlideElement {
  const baseFont: Font = {
    family: "Manrope",
    size: 14,
    color: "#344054",
    line_height: 1.2,
  };
  const headerFont: Font = {
    ...baseFont,
    color: "#101323",
    bold: true,
  };
  const headerFill: Fill = { color: "#F2F4F7", opacity: 1 };
  const bodyFill: Fill = { color: "#FFFFFF", opacity: 1 };

  return {
    type: "table",
    position: { x: 122, y: 128 },
    size: { width: 819, height: 58 + rows.length * 64 },
    columns: columns.map((text) =>
      makeTableCell({ text, font: headerFont, color: headerFill }),
    ),
    rows: rows.map((row) =>
      row.map((text) =>
        makeTableCell({ text, font: baseFont, color: bodyFill }),
      ),
    ),
    min_columns: 2,
    max_columns: 6,
    min_rows: 2,
    max_rows: 8,
    decorative: false,
    name,
  };
}

function createDefaultTableInsertElements(kind?: string): SlideElement[] {
  const definitions: Record<string, TablePreviewDefinition> = {
    "simple-table": {
      name: "simple_table",
      columns: ["Métrica", "Actual", "Objetivo"],
      rows: [
        ["Activación", "68%", "75%"],
        ["Retención", "42%", "50%"],
      ],
    },
    "comparison-table": {
      name: "comparison_table",
      columns: ["Funcionalidad", "Básico", "Pro"],
      rows: [
        ["Almacenamiento", "10 GB", "100 GB"],
        ["Colaboración", "3 puestos", "Ilimitado"],
        ["Soporte", "Correo electrónico", "Prioritario"],
      ],
    },
    "project-table": {
      name: "project_tracker_table",
      columns: ["Tarea", "Responsable", "Estado", "Fecha límite"],
      rows: [
        ["Investigación", "Maya", "Hecho", "4 jun"],
        ["Prototipo", "Leo", "En curso", "12 jun"],
        ["Lanzamiento", "Nina", "Planificado", "24 jun"],
      ],
    },
    "metrics-table": {
      name: "metrics_table",
      columns: ["KPI", "Este mes", "Variación"],
      rows: [
        ["Ingresos", "$128K", "+18%"],
        ["Conversión", "7.4%", "+1.2%"],
        ["Retención", "91%", "+4%"],
      ],
    },
  };
  const definition = kind ? definitions[kind] : undefined;
  return definition ? [makeTableElement(definition)] : [];
}

function makeImageElement({
  x,
  y,
  width,
  height,
  name = "image",
  src = DEFAULT_IMAGE_PLACEHOLDER_SRC,
  borderRadius = IMAGE_RADIUS,
  clipPath,
}: {
  x: number;
  y: number;
  width: number;
  height: number;
  name?: string;
  src?: string;
  borderRadius?: BorderRadius;
  clipPath?: string;
}): SlideElement {
  return {
    type: "image",
    position: { x, y },
    size: { width, height },
    data: src,
    fit: "cover",
    decorative: false,
    name,
    is_icon: false,
    border_radius: borderRadius,
    ...(clipPath ? { clippath: clipPath } : {}),
  };
}

const ZERO_IMAGE_RADIUS: BorderRadius = { tl: 0, tr: 0, bl: 0, br: 0 };

function makeImageInsertComponent({
  description,
  elements,
  height,
  id,
  width,
}: {
  description: string;
  elements: SlideElement[];
  height: number;
  id: string;
  width: number;
}): EditorInsertContent {
  return {
    components: [
      {
        id,
        description,
        position: {
          x: (1280 - width) / 2,
          y: (720 - height) / 2,
        },
        elements,
      },
    ],
  };
}

function makeImageFrameVector({
  fill = null,
  height,
  stroke = null,
  width,
  x = 0,
  y = 0,
}: {
  fill?: Fill | null;
  height: number;
  stroke?: Stroke | null;
  width: number;
  x?: number;
  y?: number;
}) {
  return makeVector({
    points: rectangleVectorPoints(x, y, width, height),
    fill,
    stroke,
  });
}

function makeImageFrameLine(
  points: Array<{ x: number; y: number }>,
  stroke: Stroke,
) {
  return makeVector({ points, closed: false, fill: null, stroke });
}

function createDefaultImageInsertContent(kind?: string): EditorInsertContent {
  switch (kind) {
    case "image-frame-square":
      return makeImageInsertComponent({
        id: "image_frame_square",
        description: "Square image frame",
        width: 420,
        height: 420,
        elements: [
          makeImageElement({
            x: 0,
            y: 0,
            width: 420,
            height: 420,
            borderRadius: ZERO_IMAGE_RADIUS,
            src: IMAGE_PREVIEW_ASSETS[0],
          }),
        ],
      });
    case "image-frame-rounded":
      return makeImageInsertComponent({
        id: "image_frame_rounded",
        description: "Rounded square image frame",
        width: 420,
        height: 420,
        elements: [
          makeImageElement({
            x: 0,
            y: 0,
            width: 420,
            height: 420,
            borderRadius: { tl: 72, tr: 72, bl: 72, br: 72 },
            src: IMAGE_PREVIEW_ASSETS[1],
          }),
        ],
      });
    case "image-frame-circle":
      return makeImageInsertComponent({
        id: "image_frame_circle",
        description: "Circular image frame",
        width: 420,
        height: 420,
        elements: [
          makeImageElement({
            x: 0,
            y: 0,
            width: 420,
            height: 420,
            borderRadius: { tl: 210, tr: 210, bl: 210, br: 210 },
            clipPath: "circle(50% at 50% 50%)",
            src: IMAGE_PREVIEW_ASSETS[2],
          }),
        ],
      });
    case "image-frame-pentagon":
      return makeImageInsertComponent({
        id: "image_frame_pentagon",
        description: "Pentagon image frame",
        width: 450,
        height: 430,
        elements: [
          makeImageElement({
            x: 0,
            y: 0,
            width: 450,
            height: 430,
            borderRadius: ZERO_IMAGE_RADIUS,
            clipPath:
              "polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)",
            src: IMAGE_PREVIEW_ASSETS[3],
          }),
        ],
      });
    case "image-frame-polaroid":
      return makeImageInsertComponent({
        id: "image_frame_polaroid",
        description: "Polaroid-style image frame",
        width: 440,
        height: 520,
        elements: [
          makeImageFrameVector({
            width: 440,
            height: 520,
            fill: { color: "F7F4EC", opacity: 1 },
            stroke: { color: "D0D0D0", width: 2 },
          }),
          makeImageElement({
            x: 24,
            y: 24,
            width: 392,
            height: 406,
            borderRadius: ZERO_IMAGE_RADIUS,
            src: IMAGE_PREVIEW_ASSETS[0],
          }),
        ],
      });
    case "image-frame-torn":
      return makeImageInsertComponent({
        id: "image_frame_torn",
        description: "Torn-paper image frame",
        width: 560,
        height: 410,
        elements: [
          makeImageElement({
            x: 0,
            y: 0,
            width: 560,
            height: 410,
            borderRadius: ZERO_IMAGE_RADIUS,
            clipPath:
              "polygon(0% 6%, 7% 2%, 14% 5%, 21% 1%, 29% 5%, 37% 2%, 45% 6%, 54% 2%, 63% 5%, 72% 1%, 81% 5%, 90% 2%, 100% 6%, 98% 94%, 91% 98%, 83% 95%, 74% 99%, 65% 95%, 56% 98%, 47% 94%, 38% 99%, 28% 95%, 19% 98%, 10% 94%, 2% 97%)",
            src: IMAGE_PREVIEW_ASSETS[1],
          }),
        ],
      });
    case "image-filmstrip": {
      const frameStroke: Stroke = { color: "111111", width: 1 };
      return makeImageInsertComponent({
        id: "image_filmstrip",
        description: "Three-image film strip",
        width: 850,
        height: 300,
        elements: [
          makeImageFrameVector({
            width: 850,
            height: 300,
            fill: { color: "111111", opacity: 1 },
          }),
          ...IMAGE_PREVIEW_ASSETS.slice(0, 3).map((src, index) =>
            makeImageElement({
              x: 30 + index * 275,
              y: 48,
              width: 240,
              height: 204,
              name: `film_image_${index + 1}`,
              borderRadius: ZERO_IMAGE_RADIUS,
              src,
            }),
          ),
          makeImageFrameLine(
            [
              { x: 18, y: 24 },
              { x: 832, y: 24 },
            ],
            { ...frameStroke, dash: [12, 12] },
          ),
          makeImageFrameLine(
            [
              { x: 18, y: 276 },
              { x: 832, y: 276 },
            ],
            { ...frameStroke, dash: [12, 12] },
          ),
        ],
      });
    }
    case "image-petal-grid": {
      const size = 238;
      const gap = 18;
      const petalRadii: BorderRadius[] = [
        { tl: 120, tr: 0, bl: 0, br: 120 },
        { tl: 0, tr: 120, bl: 120, br: 0 },
        { tl: 0, tr: 120, bl: 120, br: 0 },
        { tl: 120, tr: 0, bl: 0, br: 120 },
      ];
      return makeImageInsertComponent({
        id: "image_petal_grid",
        description: "Four-image petal collage",
        width: size * 2 + gap,
        height: size * 2 + gap,
        elements: IMAGE_PREVIEW_ASSETS.map((src, index) =>
          makeImageElement({
            x: (index % 2) * (size + gap),
            y: Math.floor(index / 2) * (size + gap),
            width: size,
            height: size,
            name: `petal_image_${index + 1}`,
            borderRadius: petalRadii[index],
            src,
          }),
        ),
      });
    }
    case "image-frame-clover":
      return makeImageInsertComponent({
        id: "image_frame_clover",
        description: "Clover-shaped image frame",
        width: 450,
        height: 450,
        elements: [
          makeImageElement({
            x: 0,
            y: 0,
            width: 450,
            height: 450,
            borderRadius: ZERO_IMAGE_RADIUS,
            clipPath:
              "path('M225 40 C275 0 340 0 340 90 C430 90 450 150 410 225 C450 300 430 360 340 360 C340 450 275 450 225 410 C175 450 110 450 110 360 C20 360 0 300 40 225 C0 150 20 90 110 90 C110 0 175 0 225 40 Z')",
            src: IMAGE_PREVIEW_ASSETS[2],
          }),
        ],
      });
    case "image-circle-triptych":
      return makeImageInsertComponent({
        id: "image_circle_triptych",
        description: "Three overlapping circular images",
        width: 660,
        height: 300,
        elements: IMAGE_PREVIEW_ASSETS.slice(0, 3).map((src, index) =>
          makeImageElement({
            x: index * 180,
            y: 0,
            width: 300,
            height: 300,
            name: `circle_image_${index + 1}`,
            borderRadius: { tl: 150, tr: 150, bl: 150, br: 150 },
            clipPath: "circle(50% at 50% 50%)",
            src,
          }),
        ),
      });
    case "image-triple-strip":
      return makeImageInsertComponent({
        id: "image_triple_strip",
        description: "Three equal images in a horizontal strip",
        width: 840,
        height: 360,
        elements: IMAGE_PREVIEW_ASSETS.slice(0, 3).map((src, index) =>
          makeImageElement({
            x: index * 285,
            y: 0,
            width: 270,
            height: 360,
            name: `strip_image_${index + 1}`,
            borderRadius: ZERO_IMAGE_RADIUS,
            src,
          }),
        ),
      });
    case "image-starburst":
      return makeImageInsertComponent({
        id: "image_starburst",
        description: "Starburst image frame",
        width: 480,
        height: 480,
        elements: [
          makeImageElement({
            x: 0,
            y: 0,
            width: 480,
            height: 480,
            borderRadius: ZERO_IMAGE_RADIUS,
            clipPath:
              "polygon(50% 0%, 58% 19%, 72% 6%, 74% 27%, 93% 18%, 83% 37%, 100% 50%, 81% 58%, 94% 72%, 73% 74%, 82% 93%, 63% 83%, 50% 100%, 42% 81%, 28% 94%, 26% 73%, 7% 82%, 17% 63%, 0% 50%, 19% 42%, 6% 28%, 27% 26%, 18% 7%, 37% 17%)",
            src: IMAGE_PREVIEW_ASSETS[3],
          }),
        ],
      });
    case "image-frame-stamp":
      return makeImageInsertComponent({
        id: "image_frame_stamp",
        description: "Postage-stamp image frame",
        width: 450,
        height: 540,
        elements: [
          makeImageElement({
            x: 18,
            y: 18,
            width: 414,
            height: 504,
            borderRadius: ZERO_IMAGE_RADIUS,
            src: IMAGE_PREVIEW_ASSETS[0],
          }),
          makeImageFrameVector({
            x: 8,
            y: 8,
            width: 434,
            height: 524,
            stroke: { color: "D5D8E0", width: 8, dash: [10, 8] },
          }),
        ],
      });
    case "image-vertical-stack":
      return makeImageInsertComponent({
        id: "image_vertical_stack",
        description: "Two vertically stacked images",
        width: 420,
        height: 520,
        elements: IMAGE_PREVIEW_ASSETS.slice(0, 2).map((src, index) =>
          makeImageElement({
            x: 0,
            y: index * 264,
            width: 420,
            height: 256,
            name: `stack_image_${index + 1}`,
            borderRadius: ZERO_IMAGE_RADIUS,
            src,
          }),
        ),
      });
    case "image":
      return {
        elements: [
          makeImageElement({
            x: 134,
            y: 128,
            width: 666,
            height: 397,
          }),
        ],
      };
    case "image-text":
      return {
        components: [
          {
            id: "image_text",
            description: "Image with heading and supporting text",
            position: { x: 122, y: 128 },
            elements: [
              makeImageElement({
                x: 0,
                y: 0,
                width: 486,
                height: 371,
                src: IMAGE_PREVIEW_ASSETS[1],
              }),
              makeTextElement({
                name: "image_heading",
                text: "Añade un título",
                x: 525,
                y: 15,
                width: 442,
                height: 74,
                size: 24,
                bold: true,
              }),
              makeTextElement({
                name: "image_supporting_text",
                text: "Añade un texto de apoyo que explique por qué es importante esta imagen.",
                x: 525,
                y: 108,
                width: 442,
                height: 134,
                size: 16,
                color: "475467",
                lineHeight: 1.3,
              }),
            ],
          },
        ],
      };
    case "image-grid":
      return {
        components: [
          {
            id: "image_grid",
            description: "Two-by-two image grid",
            position: { x: 128, y: 122 },
            elements: [
              makeImageElement({
                x: 0,
                y: 0,
                width: 346,
                height: 211,
                name: "image_1",
                src: IMAGE_PREVIEW_ASSETS[0],
              }),
              makeImageElement({
                x: 371,
                y: 0,
                width: 346,
                height: 211,
                name: "image_2",
                src: IMAGE_PREVIEW_ASSETS[1],
              }),
              makeImageElement({
                x: 0,
                y: 243,
                width: 346,
                height: 211,
                name: "image_3",
                src: IMAGE_PREVIEW_ASSETS[2],
              }),
              makeImageElement({
                x: 371,
                y: 243,
                width: 346,
                height: 211,
                name: "image_4",
                src: IMAGE_PREVIEW_ASSETS[3],
              }),
            ],
          },
        ],
      };
    case "image-caption":
      return {
        components: [
          {
            id: "image_caption",
            description: "Wide image with a concise caption",
            position: { x: 166, y: 112 },
            elements: [
              makeImageElement({
                x: 0,
                y: 0,
                width: 690,
                height: 338,
                src: IMAGE_PREVIEW_ASSETS[2],
              }),
              makeTextElement({
                name: "image_caption_text",
                text: "Un equipo centrado convierte el conocimiento del cliente en acción.",
                x: 0,
                y: 356,
                width: 690,
                height: 50,
                size: 16,
                color: "475467",
                lineHeight: 1.25,
              }),
            ],
          },
        ],
      };
    case "image-split":
      return {
        components: [
          {
            id: "image_split",
            description: "Two balanced images",
            position: { x: 126, y: 120 },
            elements: [
              makeImageElement({
                x: 0,
                y: 0,
                width: 350,
                height: 410,
                name: "image_left",
                src: IMAGE_PREVIEW_ASSETS[1],
              }),
              makeImageElement({
                x: 374,
                y: 0,
                width: 350,
                height: 410,
                name: "image_right",
                src: IMAGE_PREVIEW_ASSETS[3],
              }),
            ],
          },
        ],
      };
    case "image-collage":
      return {
        components: [
          {
            id: "image_collage",
            description: "One feature image with two supporting images",
            position: { x: 126, y: 120 },
            elements: [
              makeImageElement({
                x: 0,
                y: 0,
                width: 458,
                height: 410,
                name: "image_feature",
                src: IMAGE_PREVIEW_ASSETS[0],
              }),
              makeImageElement({
                x: 482,
                y: 0,
                width: 242,
                height: 193,
                name: "image_top",
                src: IMAGE_PREVIEW_ASSETS[2],
              }),
              makeImageElement({
                x: 482,
                y: 217,
                width: 242,
                height: 193,
                name: "image_bottom",
                src: IMAGE_PREVIEW_ASSETS[3],
              }),
            ],
          },
        ],
      };
    case "image-frame-ornate": {
      const frameStroke: Stroke = { color: "50545C", width: 3 };
      return makeImageInsertComponent({
        id: "image_frame_ornate",
        description: "Image with decorative corner frame",
        width: 480,
        height: 560,
        elements: [
          makeImageElement({
            x: 18,
            y: 18,
            width: 444,
            height: 524,
            borderRadius: ZERO_IMAGE_RADIUS,
            src: IMAGE_PREVIEW_ASSETS[1],
          }),
          makeImageFrameVector({
            x: 8,
            y: 8,
            width: 464,
            height: 544,
            stroke: frameStroke,
          }),
          makeImageFrameLine(
            [
              { x: 8, y: 68 },
              { x: 68, y: 8 },
            ],
            frameStroke,
          ),
          makeImageFrameLine(
            [
              { x: 412, y: 8 },
              { x: 472, y: 68 },
            ],
            frameStroke,
          ),
          makeImageFrameLine(
            [
              { x: 8, y: 492 },
              { x: 68, y: 552 },
            ],
            frameStroke,
          ),
          makeImageFrameLine(
            [
              { x: 412, y: 552 },
              { x: 472, y: 492 },
            ],
            frameStroke,
          ),
        ],
      });
    }
    case "image-frame-torn-bottom":
      return makeImageInsertComponent({
        id: "image_frame_torn_bottom",
        description: "Image frame with a torn lower edge",
        width: 500,
        height: 520,
        elements: [
          makeImageElement({
            x: 0,
            y: 0,
            width: 500,
            height: 520,
            borderRadius: ZERO_IMAGE_RADIUS,
            clipPath:
              "polygon(0% 0%, 100% 0%, 100% 88%, 92% 91%, 84% 87%, 75% 94%, 66% 89%, 57% 98%, 48% 91%, 39% 96%, 30% 88%, 21% 93%, 12% 87%, 0% 92%)",
            src: IMAGE_PREVIEW_ASSETS[2],
          }),
        ],
      });
    default:
      return {};
  }
}

const DEFAULT_VECTOR_FILL: Fill = { color: "F4F3FF", opacity: 1 };
const DEFAULT_VECTOR_STROKE: Stroke = { color: "7A5AF8", width: 1.5 };
const DEFAULT_VECTOR_LINE_STROKE: Stroke = {
  ...DEFAULT_VECTOR_STROKE,
  width: 2,
};

export const ELEMENT_INSERT_GROUPS = [
  {
    label: "Formas básicas",
    items: [
      { id: "vector-rectangle", label: "Rectángulo" },
      { id: "vector-rounded-rectangle", label: "Rectángulo redondeado" },
      { id: "vector-capsule", label: "Cápsula" },
      { id: "vector-circle", label: "Círculo" },
      { id: "vector-ellipse", label: "Elipse" },
      { id: "vector-triangle", label: "Triángulo" },
      { id: "vector-right-triangle", label: "Triángulo rectángulo" },
      { id: "vector-diamond", label: "Rombo" },
      { id: "vector-parallelogram", label: "Paralelogramo" },
      { id: "vector-trapezoid", label: "Trapecio" },
      { id: "vector-pentagon", label: "Pentágono" },
      { id: "vector-hexagon", label: "Hexágono" },
      { id: "vector-octagon", label: "Octágono" },
      { id: "vector-teardrop", label: "Lágrima" },
    ],
  },
  {
    label: "Líneas y flechas",
    items: [
      { id: "vector-line", label: "Línea" },
      { id: "vector-line-arrow", label: "Flecha" },
      { id: "vector-line-arrow-both", label: "Flecha doble" },
      { id: "vector-line-stealth", label: "Flecha estilizada" },
      { id: "vector-line-filled", label: "Flecha rellena" },
      { id: "vector-line-filled-both", label: "Doble rellena" },
      { id: "vector-line-circle-arrow", label: "Círculo + flecha" },
      { id: "vector-line-square-arrow", label: "Cuadrado + flecha" },
      { id: "vector-line-diamond-arrow", label: "Rombo + flecha" },
    ],
  },
  {
    label: "Flechas de bloque",
    items: [
      { id: "vector-arrow", label: "Flecha a la derecha" },
      { id: "vector-arrow-left", label: "Flecha a la izquierda" },
      { id: "vector-arrow-up", label: "Flecha arriba" },
      { id: "vector-arrow-down", label: "Flecha abajo" },
      { id: "vector-arrow-left-right", label: "Flecha izquierda–derecha" },
      { id: "vector-arrow-up-down", label: "Flecha arriba–abajo" },
      { id: "vector-chevron-right", label: "Cheurón" },
      { id: "vector-notched-arrow", label: "Flecha con muesca" },
      { id: "vector-bent-arrow", label: "Flecha curvada" },
      { id: "vector-four-way-arrow", label: "Flecha en cuatro direcciones" },
    ],
  },
  {
    label: "Símbolos",
    items: [
      { id: "vector-plus", label: "Más" },
      { id: "vector-cross", label: "Cruz" },
      { id: "vector-lightning", label: "Rayo" },
      { id: "vector-home", label: "Casa" },
      { id: "vector-speech-bubble", label: "Bocadillo" },
      { id: "vector-cloud", label: "Nube" },
      { id: "vector-heart", label: "Corazón" },
      { id: "vector-star", label: "Estrella" },
      { id: "vector-bookmark", label: "Marcador" },
      { id: "vector-shield", label: "Escudo" },
      { id: "vector-flag", label: "Bandera" },
      { id: "vector-moon", label: "Luna" },
      { id: "vector-sun", label: "Sol" },
      { id: "vector-play", label: "Reproducir" },
    ],
  },
] as const;

export type ElementInsertKind =
  (typeof ELEMENT_INSERT_GROUPS)[number]["items"][number]["id"];

function makeVector({
  points,
  shape,
  closed = true,
  fill = DEFAULT_VECTOR_FILL,
  stroke = DEFAULT_VECTOR_STROKE,
  curve,
  cornerRadii,
  startMarker,
  endMarker,
}: {
  points: Array<{ x: number; y: number }>;
  shape?: "polygon" | "ellipse";
  closed?: boolean;
  fill?: Fill | null;
  stroke?: Stroke | null;
  curve?: { type: "smooth"; tension?: number; segments?: number };
  cornerRadii?: number[];
  startMarker?:
    | "arrow"
    | "stealth"
    | "triangle"
    | "circle"
    | "square"
    | "diamond";
  endMarker?:
    | "arrow"
    | "stealth"
    | "triangle"
    | "circle"
    | "square"
    | "diamond";
}): SlideElement {
  return {
    type: "vector",
    ...(shape ? { shape } : {}),
    points,
    closed,
    ...(curve ? { curve } : {}),
    ...(cornerRadii ? { corner_radii: cornerRadii } : {}),
    ...(startMarker ? { start_marker: startMarker } : {}),
    ...(endMarker ? { end_marker: endMarker } : {}),
    ...(fill ? { fill } : {}),
    ...(stroke ? { stroke } : {}),
  };
}

function createDefaultElementInsertElements(kind?: string): SlideElement[] {
  switch (kind) {
    case "vector-rectangle":
      return [
        makeVector({
          points: [
            { x: 134, y: 134 },
            { x: 518, y: 134 },
            { x: 518, y: 326 },
            { x: 134, y: 326 },
          ],
        }),
      ];
    case "vector-rounded-rectangle":
      return [
        makeVector({
          points: rectangleVectorPoints(134, 134, 384, 192),
          cornerRadii: [28, 28, 28, 28],
        }),
      ];
    case "vector-capsule":
      return [
        makeVector({
          points: rectangleVectorPoints(134, 158, 440, 180),
          cornerRadii: [90, 90, 90, 90],
        }),
      ];
    case "vector-circle":
      return [
        makeVector({
          shape: "ellipse",
          points: ellipseVectorPoints(134, 134, 220, 220),
        }),
      ];
    case "vector-ellipse":
      return [
        makeVector({
          shape: "ellipse",
          points: ellipseVectorPoints(134, 134, 346, 198),
        }),
      ];
    case "vector-triangle":
      return [
        makeVector({
          points: [
            { x: 326, y: 122 },
            { x: 518, y: 354 },
            { x: 134, y: 354 },
          ],
        }),
      ];
    case "vector-right-triangle":
      return [
        makeVector({
          points: [
            { x: 134, y: 122 },
            { x: 518, y: 354 },
            { x: 134, y: 354 },
          ],
        }),
      ];
    case "vector-diamond":
      return [
        makeVector({
          points: [
            { x: 326, y: 122 },
            { x: 518, y: 238 },
            { x: 326, y: 354 },
            { x: 134, y: 238 },
          ],
        }),
      ];
    case "vector-parallelogram":
      return [
        makeVector({
          points: [
            { x: 210, y: 134 },
            { x: 574, y: 134 },
            { x: 498, y: 326 },
            { x: 134, y: 326 },
          ],
        }),
      ];
    case "vector-trapezoid":
      return [
        makeVector({
          points: [
            { x: 226, y: 134 },
            { x: 482, y: 134 },
            { x: 574, y: 326 },
            { x: 134, y: 326 },
          ],
        }),
      ];
    case "vector-pentagon":
      return [
        makeVector({
          points: regularPolygonVectorPoints(326, 248, 150, 5, -Math.PI / 2),
        }),
      ];
    case "vector-hexagon":
      return [
        makeVector({
          points: regularPolygonVectorPoints(326, 248, 166, 6),
        }),
      ];
    case "vector-octagon":
      return [
        makeVector({
          points: regularPolygonVectorPoints(
            326,
            248,
            160,
            8,
            Math.PI / 8,
          ),
        }),
      ];
    case "vector-teardrop":
      return [
        makeVector({
          points: [
            { x: 326, y: 112 },
            { x: 442, y: 240 },
            { x: 426, y: 330 },
            { x: 326, y: 386 },
            { x: 226, y: 330 },
            { x: 210, y: 240 },
          ],
          curve: { type: "smooth", tension: 0.32, segments: 16 },
        }),
      ];
    case "vector-arrow":
      return [
        makeVector({
          points: rightArrowVectorPoints(),
        }),
      ];
    case "vector-arrow-left":
      return [
        makeVector({
          points: mirrorVectorPoints(rightArrowVectorPoints(), 354),
        }),
      ];
    case "vector-arrow-up":
      return [
        makeVector({
          points: rotateVectorPoints(rightArrowVectorPoints(), 354, 248, -90),
        }),
      ];
    case "vector-arrow-down":
      return [
        makeVector({
          points: rotateVectorPoints(rightArrowVectorPoints(), 354, 248, 90),
        }),
      ];
    case "vector-arrow-left-right":
      return [
        makeVector({
          points: [
            { x: 126, y: 248 },
            { x: 224, y: 158 },
            { x: 224, y: 206 },
            { x: 484, y: 206 },
            { x: 484, y: 158 },
            { x: 582, y: 248 },
            { x: 484, y: 338 },
            { x: 484, y: 290 },
            { x: 224, y: 290 },
            { x: 224, y: 338 },
          ],
        }),
      ];
    case "vector-arrow-up-down":
      return [
        makeVector({
          points: rotateVectorPoints(
            [
              { x: 126, y: 248 },
              { x: 224, y: 158 },
              { x: 224, y: 206 },
              { x: 484, y: 206 },
              { x: 484, y: 158 },
              { x: 582, y: 248 },
              { x: 484, y: 338 },
              { x: 484, y: 290 },
              { x: 224, y: 290 },
              { x: 224, y: 338 },
            ],
            354,
            248,
            90,
          ),
        }),
      ];
    case "vector-chevron-right":
      return [
        makeVector({
          points: [
            { x: 174, y: 142 },
            { x: 320, y: 142 },
            { x: 520, y: 248 },
            { x: 320, y: 354 },
            { x: 174, y: 354 },
            { x: 374, y: 248 },
          ],
        }),
      ];
    case "vector-notched-arrow":
      return [
        makeVector({
          points: [
            { x: 134, y: 158 },
            { x: 422, y: 158 },
            { x: 422, y: 118 },
            { x: 574, y: 248 },
            { x: 422, y: 378 },
            { x: 422, y: 338 },
            { x: 134, y: 338 },
            { x: 214, y: 248 },
          ],
        }),
      ];
    case "vector-bent-arrow":
      return [
        makeVector({
          points: [
            { x: 134, y: 382 },
            { x: 134, y: 220 },
            { x: 402, y: 220 },
            { x: 402, y: 158 },
            { x: 574, y: 278 },
            { x: 402, y: 398 },
            { x: 402, y: 336 },
            { x: 218, y: 336 },
            { x: 218, y: 382 },
          ],
          cornerRadii: [14, 14, 14, 0, 0, 0, 14, 14, 14],
        }),
      ];
    case "vector-four-way-arrow":
      return [
        makeVector({
          points: [
            { x: 326, y: 104 },
            { x: 402, y: 178 },
            { x: 366, y: 178 },
            { x: 366, y: 208 },
            { x: 396, y: 208 },
            { x: 396, y: 172 },
            { x: 472, y: 248 },
            { x: 396, y: 324 },
            { x: 396, y: 288 },
            { x: 366, y: 288 },
            { x: 366, y: 318 },
            { x: 402, y: 318 },
            { x: 326, y: 392 },
            { x: 250, y: 318 },
            { x: 286, y: 318 },
            { x: 286, y: 288 },
            { x: 256, y: 288 },
            { x: 256, y: 324 },
            { x: 180, y: 248 },
            { x: 256, y: 172 },
            { x: 256, y: 208 },
            { x: 286, y: 208 },
            { x: 286, y: 178 },
            { x: 250, y: 178 },
          ],
        }),
      ];
    case "vector-plus":
      return [
        makeVector({
          points: plusVectorPoints(326, 248, 250, 250, 88),
          cornerRadii: Array(12).fill(8),
        }),
      ];
    case "vector-cross":
      return [
        makeVector({
          points: rotateVectorPoints(
            plusVectorPoints(326, 248, 250, 250, 76),
            326,
            248,
            45,
          ),
          cornerRadii: Array(12).fill(6),
        }),
      ];
    case "vector-lightning":
      return [
        makeVector({
          points: [
            { x: 354, y: 104 },
            { x: 216, y: 270 },
            { x: 314, y: 270 },
            { x: 278, y: 400 },
            { x: 454, y: 210 },
            { x: 350, y: 210 },
          ],
        }),
      ];
    case "vector-home":
      return [
        makeVector({
          points: [
            { x: 326, y: 112 },
            { x: 536, y: 254 },
            { x: 480, y: 254 },
            { x: 480, y: 382 },
            { x: 364, y: 382 },
            { x: 364, y: 286 },
            { x: 288, y: 286 },
            { x: 288, y: 382 },
            { x: 172, y: 382 },
            { x: 172, y: 254 },
            { x: 116, y: 254 },
          ],
          cornerRadii: [6, 6, 0, 10, 8, 8, 8, 8, 10, 0, 6],
        }),
      ];
    case "vector-speech-bubble":
      return [
        makeVector({
          points: [
            { x: 142, y: 130 },
            { x: 534, y: 130 },
            { x: 534, y: 318 },
            { x: 326, y: 318 },
            { x: 226, y: 394 },
            { x: 246, y: 318 },
            { x: 142, y: 318 },
          ],
          cornerRadii: [22, 22, 22, 5, 0, 0, 22],
        }),
      ];
    case "vector-cloud":
      return [
        makeVector({
          points: [
            { x: 182, y: 334 },
            { x: 132, y: 286 },
            { x: 158, y: 222 },
            { x: 232, y: 204 },
            { x: 270, y: 142 },
            { x: 360, y: 134 },
            { x: 414, y: 190 },
            { x: 486, y: 190 },
            { x: 532, y: 246 },
            { x: 514, y: 310 },
            { x: 450, y: 338 },
          ],
          curve: { type: "smooth", tension: 0.42, segments: 16 },
        }),
      ];
    case "vector-heart":
      return [
        makeVector({
          points: [
            { x: 326, y: 190 },
            { x: 270, y: 126 },
            { x: 190, y: 126 },
            { x: 142, y: 194 },
            { x: 154, y: 266 },
            { x: 220, y: 330 },
            { x: 326, y: 394 },
            { x: 432, y: 330 },
            { x: 498, y: 266 },
            { x: 510, y: 194 },
            { x: 462, y: 126 },
            { x: 382, y: 126 },
          ],
          curve: { type: "smooth", tension: 0.38, segments: 16 },
        }),
      ];
    case "vector-star":
      return [
        makeVector({
          points: regularStarVectorPoints(326, 248, 158, 72, 5),
          cornerRadii: Array(10).fill(3),
        }),
      ];
    case "vector-bookmark":
      return [
        makeVector({
          points: [
            { x: 230, y: 112 },
            { x: 422, y: 112 },
            { x: 422, y: 394 },
            { x: 326, y: 330 },
            { x: 230, y: 394 },
          ],
          cornerRadii: [12, 12, 4, 0, 4],
        }),
      ];
    case "vector-shield":
      return [
        makeVector({
          points: [
            { x: 170, y: 132 },
            { x: 482, y: 132 },
            { x: 468, y: 284 },
            { x: 410, y: 346 },
            { x: 326, y: 398 },
            { x: 242, y: 346 },
            { x: 184, y: 284 },
          ],
          cornerRadii: [18, 18, 18, 18, 12, 18, 18],
        }),
      ];
    case "vector-flag":
      return [
        makeVector({
          points: [
            { x: 154, y: 126 },
            { x: 510, y: 126 },
            { x: 450, y: 238 },
            { x: 510, y: 350 },
            { x: 154, y: 350 },
          ],
          cornerRadii: [8, 8, 4, 8, 8],
        }),
      ];
    case "vector-moon":
      return [
        makeVector({
          points: [
            { x: 382, y: 112 },
            { x: 268, y: 126 },
            { x: 188, y: 204 },
            { x: 180, y: 292 },
            { x: 250, y: 374 },
            { x: 366, y: 390 },
            { x: 302, y: 330 },
            { x: 278, y: 250 },
            { x: 310, y: 170 },
          ],
          curve: { type: "smooth", tension: 0.34, segments: 16 },
        }),
      ];
    case "vector-sun":
      return [
        makeVector({
          points: regularStarVectorPoints(326, 248, 164, 104, 16),
          cornerRadii: Array(32).fill(3),
        }),
      ];
    case "vector-play":
      return [
        makeVector({
          points: [
            { x: 226, y: 118 },
            { x: 526, y: 248 },
            { x: 226, y: 378 },
          ],
          cornerRadii: [14, 14, 14],
        }),
      ];
    case "vector-line":
      return [
        makeVector({
          points: horizontalLineVectorPoints(),
          closed: false,
          fill: null,
          stroke: DEFAULT_VECTOR_LINE_STROKE,
        }),
      ];
    case "vector-line-arrow":
      return [
        makeVector({
          points: horizontalLineVectorPoints(),
          closed: false,
          fill: null,
          stroke: DEFAULT_VECTOR_LINE_STROKE,
          endMarker: "arrow",
        }),
      ];
    case "vector-line-arrow-both":
      return [
        makeVector({
          points: horizontalLineVectorPoints(),
          closed: false,
          fill: null,
          stroke: DEFAULT_VECTOR_LINE_STROKE,
          startMarker: "arrow",
          endMarker: "arrow",
        }),
      ];
    case "vector-line-stealth":
      return [
        makeVector({
          points: horizontalLineVectorPoints(),
          closed: false,
          fill: null,
          stroke: DEFAULT_VECTOR_LINE_STROKE,
          endMarker: "stealth",
        }),
      ];
    case "vector-line-filled":
      return [
        makeVector({
          points: horizontalLineVectorPoints(),
          closed: false,
          fill: null,
          stroke: DEFAULT_VECTOR_LINE_STROKE,
          endMarker: "triangle",
        }),
      ];
    case "vector-line-filled-both":
      return [
        makeVector({
          points: horizontalLineVectorPoints(),
          closed: false,
          fill: null,
          stroke: DEFAULT_VECTOR_LINE_STROKE,
          startMarker: "triangle",
          endMarker: "triangle",
        }),
      ];
    case "vector-line-circle-arrow":
    case "vector-line-square-arrow":
    case "vector-line-diamond-arrow":
      return [
        makeVector({
          points: horizontalLineVectorPoints(),
          closed: false,
          fill: null,
          stroke: DEFAULT_VECTOR_LINE_STROKE,
          startMarker:
            kind === "vector-line-circle-arrow"
              ? "circle"
              : kind === "vector-line-square-arrow"
                ? "square"
                : "diamond",
          endMarker: "triangle",
        }),
      ];
    default:
      return [];
  }
}

function ellipseVectorPoints(
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const radiusX = width / 2;
  const radiusY = height / 2;
  const centerX = x + radiusX;
  const centerY = y + radiusY;
  return [
    { x: centerX, y },
    { x: x + width, y: centerY },
    { x: centerX, y: y + height },
    { x, y: centerY },
  ];
}

function rectangleVectorPoints(
  x: number,
  y: number,
  width: number,
  height: number,
) {
  return [
    { x, y },
    { x: x + width, y },
    { x: x + width, y: y + height },
    { x, y: y + height },
  ];
}

function rightArrowVectorPoints() {
  return [
    { x: 134, y: 206 },
    { x: 420, y: 206 },
    { x: 420, y: 158 },
    { x: 574, y: 248 },
    { x: 420, y: 338 },
    { x: 420, y: 290 },
    { x: 134, y: 290 },
  ];
}

function horizontalLineVectorPoints() {
  return [
    { x: 204, y: 248 },
    { x: 504, y: 248 },
  ];
}

function mirrorVectorPoints(
  points: Array<{ x: number; y: number }>,
  axisX: number,
) {
  return points.map((point) => ({ x: axisX * 2 - point.x, y: point.y }));
}

function rotateVectorPoints(
  points: Array<{ x: number; y: number }>,
  centerX: number,
  centerY: number,
  degrees: number,
) {
  const radians = (degrees * Math.PI) / 180;
  const cosine = Math.cos(radians);
  const sine = Math.sin(radians);
  return points.map((point) => {
    const offsetX = point.x - centerX;
    const offsetY = point.y - centerY;
    return {
      x: centerX + offsetX * cosine - offsetY * sine,
      y: centerY + offsetX * sine + offsetY * cosine,
    };
  });
}

function plusVectorPoints(
  centerX: number,
  centerY: number,
  width: number,
  height: number,
  armWidth: number,
) {
  const left = centerX - width / 2;
  const right = centerX + width / 2;
  const top = centerY - height / 2;
  const bottom = centerY + height / 2;
  const armLeft = centerX - armWidth / 2;
  const armRight = centerX + armWidth / 2;
  const armTop = centerY - armWidth / 2;
  const armBottom = centerY + armWidth / 2;
  return [
    { x: armLeft, y: top },
    { x: armRight, y: top },
    { x: armRight, y: armTop },
    { x: right, y: armTop },
    { x: right, y: armBottom },
    { x: armRight, y: armBottom },
    { x: armRight, y: bottom },
    { x: armLeft, y: bottom },
    { x: armLeft, y: armBottom },
    { x: left, y: armBottom },
    { x: left, y: armTop },
    { x: armLeft, y: armTop },
  ];
}

function regularStarVectorPoints(
  centerX: number,
  centerY: number,
  outerRadius: number,
  innerRadius: number,
  tips: number,
  rotation = -Math.PI / 2,
) {
  return Array.from({ length: tips * 2 }, (_, index) => {
    const radius = index % 2 === 0 ? outerRadius : innerRadius;
    const angle = rotation + (Math.PI * index) / tips;
    return {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    };
  });
}

function regularPolygonVectorPoints(
  centerX: number,
  centerY: number,
  radius: number,
  sides: number,
  rotation = 0,
) {
  return Array.from({ length: sides }, (_, index) => {
    const angle = rotation + (Math.PI * 2 * index) / sides;
    return {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    };
  });
}

function themeFont(
  font: Font | null | undefined,
  color: string,
  family?: string,
): Font {
  return { ...(font ?? {}), color, ...(family ? { family } : {}) };
}

function themeRuns<T extends { font?: Font | null }>(
  runs: T[],
  color: string,
  family?: string,
) {
  return runs.map((run) => ({
    ...run,
    ...(run.font ? { font: themeFont(run.font, color, family) } : {}),
  }));
}

function themeTableCell(
  cell: TableCell,
  theme: TemplateTheme,
  isHeader: boolean,
): TableCell {
  const family = theme.fonts?.textFont?.name;
  return {
    ...cell,
    color: {
      ...(cell.color ?? {}),
      color: isHeader ? theme.primary : theme.background,
    },
    font: themeFont(
      cell.font,
      isHeader ? theme.primary_text : theme.background_text,
      family,
    ),
    runs: themeRuns(
      cell.runs,
      isHeader ? theme.primary_text : theme.background_text,
      family,
    ),
  };
}

function themeInfographicIcons(value: unknown, color: string): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => themeInfographicIcons(item, color));
  }
  if (!value || typeof value !== "object") return value;

  const record = value as Record<string, unknown>;
  return Object.fromEntries(
    Object.entries(record).map(([key, entry]) => {
      if (key === "icon" && entry && typeof entry === "object") {
        return [key, { ...(entry as Record<string, unknown>), color }];
      }
      return [key, themeInfographicIcons(entry, color)];
    }),
  );
}

function applyTemplateThemeToElement(
  element: SlideElement,
  theme: TemplateTheme,
): SlideElement {
  const graphColors = templateThemeGraphColors(theme);
  const family = theme.fonts?.textFont?.name;

  switch (element.type) {
    case "text":
      return {
        ...element,
        font: themeFont(element.font, theme.background_text, family),
        runs: themeRuns(element.runs, theme.background_text, family),
      };
    case "text-list":
      return {
        ...element,
        font: themeFont(element.font, theme.background_text, family),
        items: element.items.map((item) =>
          themeRuns(item, theme.background_text, family),
        ),
      };
    case "table":
      return {
        ...element,
        font: themeFont(element.font, theme.background_text, family),
        columns: element.columns.map((cell) =>
          themeTableCell(cell, theme, true),
        ),
        rows: element.rows.map((row) =>
          row.map((cell) => themeTableCell(cell, theme, false)),
        ),
      };
    case "chart":
      return {
        ...element,
        color: graphColors[0],
        colors: graphColors,
        axis_color: theme.stroke,
        grid_color: theme.stroke,
        title_color: theme.background_text,
        legend_color: theme.background_text,
        data: (element.data ?? []).map((datum, index) => ({
          ...datum,
          color: graphColors[index % graphColors.length],
        })),
      };
    case "infographic": {
      const meter =
        element.data.type === "progress_bar" || element.data.type === "gauge";
      const themedData = themeInfographicIcons(
        element.data,
        theme.primary_text,
      ) as typeof element.data;
      const data = {
        ...themedData,
        card_color: theme.card,
        background_text_color: theme.background_text,
      };
      return {
        ...element,
        data:
          data.type === "customer_journey"
            ? { ...data, start_color: graphColors[0] }
            : data,
        colors: meter
          ? [theme.card, theme.primary]
          : [theme.background, ...graphColors, theme.card, theme.stroke],
        text_color: theme.background_text,
      };
    }
    case "vector":
      return {
        ...element,
        ...(element.fill
          ? { fill: { ...element.fill, color: theme.primary } }
          : {}),
        ...(element.stroke
          ? { stroke: { ...element.stroke, color: theme.stroke } }
          : {}),
      };
    case "image":
      return element.is_icon ? { ...element, color: theme.primary } : element;
    case "container":
      return {
        ...element,
        ...(element.fill
          ? { fill: { ...element.fill, color: theme.card } }
          : {}),
        ...(element.stroke
          ? { stroke: { ...element.stroke, color: theme.stroke } }
          : {}),
        child: element.child
          ? applyTemplateThemeToElement(element.child, theme)
          : element.child,
      };
    case "flex":
    case "grid":
    case "group":
      return {
        ...element,
        children: element.children.map((child) =>
          applyTemplateThemeToElement(child, theme),
        ),
      };
    default:
      return element;
  }
}

function themeElements(elements: SlideElement[], theme: TemplateTheme) {
  return elements.map((element) => applyTemplateThemeToElement(element, theme));
}

export function createTextInsertElements(
  kind?: string,
  theme: TemplateTheme = DEFAULT_TEMPLATE_THEME,
): SlideElement[] {
  return themeElements(createDefaultTextInsertElements(kind), theme);
}

export function createChartInsertElements(
  kind?: string,
  theme: TemplateTheme = DEFAULT_TEMPLATE_THEME,
): SlideElement[] {
  return themeElements(createDefaultChartInsertElements(kind), theme);
}

export function createInfographicInsertElements(
  kind?: string,
  theme: TemplateTheme = DEFAULT_TEMPLATE_THEME,
): SlideElement[] {
  return themeElements(createDefaultInfographicInsertElements(kind), theme);
}

export function createTableInsertElements(
  kind?: string,
  theme: TemplateTheme = DEFAULT_TEMPLATE_THEME,
): SlideElement[] {
  return themeElements(createDefaultTableInsertElements(kind), theme);
}

export function createImageInsertContent(
  kind?: string,
  theme: TemplateTheme = DEFAULT_TEMPLATE_THEME,
): EditorInsertContent {
  const content = createDefaultImageInsertContent(kind);
  return {
    ...content,
    elements: content.elements
      ? themeElements(content.elements, theme)
      : content.elements,
    components: content.components?.map((component) => ({
      ...component,
      elements: themeElements(component.elements, theme),
    })),
  };
}

export function createElementInsertElements(
  kind?: string,
  theme: TemplateTheme = DEFAULT_TEMPLATE_THEME,
): SlideElement[] {
  return themeElements(createDefaultElementInsertElements(kind), theme);
}
