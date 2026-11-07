import { PRESENTON_CLOUD_ENABLED } from "@/utils/featureFlags";

export interface ModelOption {
  value: string;
  label: string;
  description?: string;
  icon?: string;
  size: string;
}

export interface ImageProviderOption {
  value: string;
  label: string;
  description?: string;
  icon?: string;
  requiresApiKey?: boolean;
  apiKeyField?: string;
  apiKeyFieldLabel?: string;
  getApiKeyUrl?: string;
}

export interface LLMProviderOption {
  value: string;
  label: string;
  description?: string;
  model_value?: string;
  model_label?: string;
  url?: string;
  icon?: string;
  getApiKeyUrl?: string;
}

export interface WebSearchProviderOption {
  value: string;
  label: string;
  description: string;
  icon?: string;
  apiKeyField?: string;
  apiKeyLabel?: string;
  urlField?: string;
  urlLabel?: string;
}

export const WEB_SEARCH_PROVIDERS: Record<string, WebSearchProviderOption> = {
  auto: {
    value: "auto",
    label: "Predeterminado (modelo)",
    description:
      "Usa la búsqueda web nativa del modelo cuando esté disponible. Si no, la búsqueda web permanece desactivada hasta que elijas un proveedor externo.",
    icon: "/providers/model-search.svg",
  },
  searxng: {
    value: "searxng",
    label: "SearXNG",
    description: "Usa una instancia de SearXNG autoalojada.",
    icon: "/providers/searxng.svg",
    urlField: "SEARXNG_BASE_URL",
    urlLabel: "URL base de SearXNG",
  },
  tavily: {
    value: "tavily",
    label: "Tavily",
    description: "API de búsqueda optimizada para aplicaciones de IA.",
    icon: "/providers/tavily.png",
    apiKeyField: "TAVILY_API_KEY",
    apiKeyLabel: "Clave de API de Tavily",
  },
  exa: {
    value: "exa",
    label: "Exa",
    description: "Búsqueda web nativa de IA con fragmentos destacados de los resultados.",
    icon: "/providers/exa.png",
    apiKeyField: "EXA_API_KEY",
    apiKeyLabel: "Clave de API de Exa",
  },
  brave: {
    value: "brave",
    label: "Brave",
    description: "API de Brave Search para obtener resultados de búsqueda web.",
    icon: "/providers/brave.svg",
    apiKeyField: "BRAVE_SEARCH_API_KEY",
    apiKeyLabel: "Clave de API de Brave Search",
  },
  // serper: {
  //   value: "serper",
  //   label: "Serper",
  //   description: "Google search results via Serper.",
  //   apiKeyField: "SERPER_API_KEY",
  //   apiKeyLabel: "Serper API key",
  // },
};

export const IMAGE_PROVIDERS: Record<string, ImageProviderOption> = {
  pexels: {
    value: "pexels",
    label: "Pexels",
    description: "Plataforma gratuita de fotos y vídeos de stock",
    icon: "/providers/pexel.png",
    requiresApiKey: true,
    apiKeyField: "PEXELS_API_KEY",
    apiKeyFieldLabel: "Clave de API de Pexels",
    getApiKeyUrl: "https://www.pexels.com/api/",
  },
  pixabay: {
    value: "pixabay",
    label: "Pixabay",
    description: "Imágenes y vídeos gratuitos",
    icon: "/providers/pixabay.png",
    requiresApiKey: true,
    apiKeyField: "PIXABAY_API_KEY",
    apiKeyFieldLabel: "Clave de API de Pixabay",
    getApiKeyUrl: "https://pixabay.com/api/docs/",
  },
  "gpt-image-2": {
    value: "gpt-image-2",
    label: "GPT Image 2",
    description: "Modelo de generación de imágenes de OpenAI",
    icon: "/providers/openai.png",
    requiresApiKey: true,
    apiKeyField: "OPENAI_API_KEY",
    apiKeyFieldLabel: "Clave de API de OpenAI",
    getApiKeyUrl: "https://www.google.com/search?q=how+to+get+openai+api+key&ie=UTF-8",
  },
  "gpt-image-2.5-flare": {
    value: "gpt-image-2.5-flare",
    label: "GPT Image 2.5 Flare",
    description: "Modelo rápido de generación de imágenes de OpenAI",
    icon: "/providers/openai.png",
    requiresApiKey: true,
    apiKeyField: "OPENAI_API_KEY",
    apiKeyFieldLabel: "Clave de API de OpenAI",
    getApiKeyUrl: "https://platform.openai.com/api-keys",
  },
  "gpt-image-2.5-sunburst": {
    value: "gpt-image-2.5-sunburst",
    label: "GPT Image 2.5 Sunburst",
    description: "Modelo de generación de imágenes y edición precisa de OpenAI",
    icon: "/providers/openai.png",
    requiresApiKey: true,
    apiKeyField: "OPENAI_API_KEY",
    apiKeyFieldLabel: "Clave de API de OpenAI",
    getApiKeyUrl: "https://platform.openai.com/api-keys",
  },
  gemini_flash: {
    value: "gemini_flash",
    label: "Gemini Flash",
    description: "Modelo rápido de generación de imágenes de Google",
    icon: "/providers/gemini-color.svg",
    requiresApiKey: true,
    apiKeyField: "GOOGLE_API_KEY",
    apiKeyFieldLabel: "Clave de API de Google",
    getApiKeyUrl: "https://www.google.com/search?q=how+to+get+google+AI+studio+api+key&sxsrf=ANbL-n5_hUGaEiG9v6k9VxZWyv0mqO0Jew%3A1776339625724",
  },
  nanobanana_pro: {
    value: "nanobanana_pro",
    label: "NanoBanana Pro",
    description: "Modelo avanzado de generación de imágenes de Google",
    icon: "/providers/gemini-color.svg",
    requiresApiKey: true,
    apiKeyField: "GOOGLE_API_KEY",
    apiKeyFieldLabel: "Clave de API de Google",
    getApiKeyUrl: "https://www.google.com/search?q=how+to+get+google+AI+studio+api+key&sxsrf=ANbL-n5_hUGaEiG9v6k9VxZWyv0mqO0Jew%3A1776339625724",
  },
  comfyui: {
    value: "comfyui",
    label: "ComfyUI",
    description: "Usa tu servidor local de ComfyUI con flujos de trabajo personalizados",
    icon: "/providers/comfyui-color.svg",
    requiresApiKey: false,
    apiKeyField: "COMFYUI_URL",
    apiKeyFieldLabel: "URL del servidor de ComfyUI",
  },
  open_webui: {
    value: "open_webui",
    label: "Open WebUI",
    description: "Usa tu servidor de Open WebUI para generar imágenes",
    icon: "/providers/open-webui.png",
    requiresApiKey: false,
    apiKeyField: "OPEN_WEBUI_IMAGE_URL",
    apiKeyFieldLabel: "URL de Open WebUI",
  },
  openai_compatible: {
    value: "openai_compatible",
    label: "Personalizado",
    description:
      "Endpoint /v1/images compatible con OpenAI (LiteLLM, Azure, vLLM, etc.)",
    icon: "/providers/custom.svg",
    requiresApiKey: false,
    apiKeyField: "OPENAI_COMPAT_IMAGE_BASE_URL",
    apiKeyFieldLabel: "URL base compatible con OpenAI",
  },
};

const ALL_LLM_PROVIDERS: Record<string, LLMProviderOption> = {
  presenton: {
    value: "presenton",
    label: "Presenton",
    description: "Genera con tu cuenta conectada de Presenton Cloud",
    icon: "/providers/presenton.png",
  },
  codex: {
    value: "codex",
    label: "ChatGPT",
    description: "ChatGPT Plus/Pro mediante OAuth",
    icon: "/providers/openai.png",
  },
  openai: {
    value: "openai",
    label: "OpenAI",
    description: "El modelo de generación de texto más reciente de OpenAI",
    url: "https://api.openai.com/v1",
    icon: "/providers/openai.png",
    getApiKeyUrl: "https://www.google.com/search?q=how+to+get+openai+api+key&ie=UTF-8",
  },
  deepseek: {
    value: "deepseek",
    label: "DeepSeek",
    description: "Modelos de DeepSeek mediante la API de DeepSeek",
    url: "https://api.deepseek.com/v1",
    icon: "/providers/deepseek-color.svg",
    getApiKeyUrl: "https://platform.deepseek.com/api_keys",
  },
  google: {
    value: "google",
    label: "Google",
    description: "Modelo principal de generación de texto de Google",
    url: "https://api.google.com/v1",
    icon: "/providers/gemini-color.svg",
    getApiKeyUrl: "https://www.google.com/search?q=how+to+get+google+AI+studio+api+key&sxsrf=ANbL-n5_hUGaEiG9v6k9VxZWyv0mqO0Jew%3A1776339625724",
  },
  vertex: {
    value: "vertex",
    label: "Vertex AI",
    description: "Modelos de Google Vertex AI",
    icon: "/providers/vertexai-color.svg",
    getApiKeyUrl: "https://www.google.com/search?q=how+to+get+vertex+ai+api+key",
  },
  azure: {
    value: "azure",
    label: "Azure OpenAI",
    description: "Implementaciones de OpenAI alojadas en Azure",
    icon: "/providers/azure-color.svg",
    getApiKeyUrl: "https://www.google.com/search?q=azure+openai+api+key",
  },
  bedrock: {
    value: "bedrock",
    label: "Amazon Bedrock",
    description: "Modelos fundacionales de AWS Bedrock",
    icon: "/providers/bedrock-color.svg",
  },
  openrouter: {
    value: "openrouter",
    label: "OpenRouter",
    description: "Numerosos modelos a través de la API de OpenRouter compatible con OpenAI",
    url: "https://openrouter.ai/api/v1",
    icon: "/providers/openrouter-color.svg",
    getApiKeyUrl: "https://openrouter.ai/keys",
  },
  cerebras: {
    value: "cerebras",
    label: "Cerebras",
    description: "Cerebras Cloud mediante una API compatible con OpenAI",
    url: "https://api.cerebras.ai/v1",
    icon: "/providers/cerebras-color.svg",
    getApiKeyUrl: "https://inference-docs.cerebras.ai",
  },
  litellm: {
    value: "litellm",
    label: "LiteLLM",
    description: "Proxy o pasarela de LiteLLM compatible con OpenAI",
    icon: "/providers/litellm-logo.svg",
  },
  fireworks: {
    value: "fireworks",
    label: "Fireworks",
    description: "Fireworks AI mediante una API compatible con OpenAI",
    url: "https://api.fireworks.ai/inference/v1",
    icon: "/providers/fireworks-color.svg",
    getApiKeyUrl: "https://fireworks.ai/account/api-keys",
  },
  together: {
    value: "together",
    label: "Together AI",
    description: "Together AI mediante una API compatible con OpenAI",
    url: "https://api.together.ai/v1",
    icon: "/providers/together-color.svg",
    getApiKeyUrl: "https://api.together.xyz/settings/api-keys",
  },
  lmstudio: {
    value: "lmstudio",
    label: "LM Studio",
    description: "Servidor local de LM Studio compatible con OpenAI",
    url: "http://localhost:1234/v1",
    icon: "/providers/lm-studio.svg",
  },
  anthropic: {
    value: "anthropic",
    label: "Anthropic",
    description: "Modelos Claude de Anthropic",
    url: "https://api.anthropic.com/v1",
    icon: "/providers/claude-color.svg",
    getApiKeyUrl: "https://www.google.com/search?q=how+to+get+anthropic+api+key&sxsrf=ANbL-n7lsueZQ88L56HhqC1ch2PGD0rbNQ%3A1776339632265",
  },
  ollama: {
    value: "ollama",
    label: "Ollama",
    description: "Modelo principal de generación de texto de Ollama",
    icon: "/providers/ollama.svg",
  },
  custom: {
    value: "custom",
    label: "Personalizado",
    description: "LLM compatible con OpenAI",
    icon: "/providers/custom.svg",
  },

};

// AI Fast Track: Presenton Cloud se oculta salvo que se active explícitamente.
export const LLM_PROVIDERS: Record<string, LLMProviderOption> =
  PRESENTON_CLOUD_ENABLED
    ? ALL_LLM_PROVIDERS
    : Object.fromEntries(
        Object.entries(ALL_LLM_PROVIDERS).filter(([key]) => key !== "presenton")
      );

export const GPT_IMAGE_2_QUALITY_OPTIONS = [
  {
    label: "Baja",
    value: "low",
    description: "La más rápida y económica",
  },
  {
    label: "Media",
    value: "medium",
    description: "Equilibrio entre calidad y velocidad",
  },
  {
    label: "Alta",
    value: "high",
    description: "La mejor calidad, con un tiempo de generación mayor",
  },
];

export const GPT_IMAGE_2_5_QUALITY_OPTIONS = [
  ...GPT_IMAGE_2_QUALITY_OPTIONS,
  { label: "Muy alta", value: "xhigh", description: "Más detalle, con un tiempo de generación mayor" },
  { label: "Máxima", value: "max", description: "La máxima calidad de renderizado" },
  { label: "Automática", value: "auto", description: "Deja que el modelo elija la calidad" },
];

export const DEFAULT_OPENAI_IMAGE_PROVIDER = "gpt-image-2.5-flare";

export const isGPTImage25Provider = (provider?: string): boolean =>
  provider === "gpt-image-2.5-flare" || provider === "gpt-image-2.5-sunburst";
