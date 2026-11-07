import { DEFAULT_OPENAI_IMAGE_PROVIDER } from "@/utils/providerConstants";
import { setLLMConfig } from "@/store/slices/userConfig";
import { store } from "@/store/store";
import { LLMConfig } from "@/types/llm_config";
import { isSupportedCodexModel } from "@/utils/codexModels";

function isProvided(value: unknown): boolean {
  return value !== "" && value !== null && value !== undefined;
}

function parseOptionalBool(value: unknown): boolean | undefined {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) {
    return true;
  }
  if (["0", "false", "no", "off"].includes(normalized)) {
    return false;
  }
  return undefined;
}

export const normalizeLLMConfig = (llmConfig: LLMConfig): LLMConfig => {
  const normalizedConfig: LLMConfig = { ...llmConfig };
  if (normalizedConfig.IMAGE_PROVIDER === "dall-e-3") {
    normalizedConfig.IMAGE_PROVIDER = "gpt-image-2";
    normalizedConfig.GPT_IMAGE_2_QUALITY ||= (
      (normalizedConfig as Record<string, unknown>).DALL_E_3_QUALITY === "hd"
        ? "high" : "medium"
    );
  }
  delete (normalizedConfig as Record<string, unknown>).DALL_E_3_QUALITY;
  if (["gpt-image-1.5", "gpt-image-1.5-2025-12-16"].includes(normalizedConfig.IMAGE_PROVIDER || "")) {
    normalizedConfig.IMAGE_PROVIDER = DEFAULT_OPENAI_IMAGE_PROVIDER;
    normalizedConfig.GPT_IMAGE_2_5_QUALITY ||= normalizedConfig.GPT_IMAGE_1_5_QUALITY || "medium";
  }
  delete normalizedConfig.GPT_IMAGE_1_5_QUALITY;

  const parsedDisableImageGeneration = parseOptionalBool(
    (normalizedConfig as Record<string, unknown>).DISABLE_IMAGE_GENERATION
  );
  if (parsedDisableImageGeneration !== undefined) {
    normalizedConfig.DISABLE_IMAGE_GENERATION = parsedDisableImageGeneration;
  }
  const parsedWebGrounding = parseOptionalBool(
    (normalizedConfig as Record<string, unknown>).WEB_GROUNDING
  );
  if (parsedWebGrounding !== undefined) {
    normalizedConfig.WEB_GROUNDING = parsedWebGrounding;
  }
  for (const key of [
    "OPENROUTER_ALLOW_FALLBACKS",
    "OPENROUTER_REQUIRE_PARAMETERS",
    "OPENROUTER_ZDR",
  ] as const) {
    const parsed = parseOptionalBool(
      (normalizedConfig as Record<string, unknown>)[key]
    );
    if (parsed !== undefined) normalizedConfig[key] = parsed;
  }
  for (const key of ["LLM_MAX_OUTPUT_TOKENS"] as const) {
    const value = (normalizedConfig as Record<string, unknown>)[key];
    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value);
      if (Number.isInteger(parsed)) normalizedConfig[key] = parsed;
    }
  }
  const hasManualTokenLimit = isProvided(
    (normalizedConfig as Record<string, unknown>).LLM_MAX_OUTPUT_TOKENS
  );
  if (
    normalizedConfig.LLM_GENERATION_PROFILE !== "model_max" ||
    hasManualTokenLimit
  ) {
    // Profiles are no longer user-facing. Keep only the internal model-max
    // marker used by the checkbox and remove any legacy preset selection.
    (normalizedConfig as Record<string, unknown>).LLM_GENERATION_PROFILE = "";
  }
  // Reasoning budget is no longer exposed in the UI. Sending an empty value
  // removes any previously saved budget instead of leaving a hidden override.
  (normalizedConfig as Record<string, unknown>).LLM_REASONING_BUDGET_TOKENS = "";
  if (normalizedConfig.LLM_REASONING_EFFORT === "none") {
    (normalizedConfig as Record<string, unknown>).LLM_REASONING_EFFORT = "";
  }
  const providerOrder = (normalizedConfig as Record<string, unknown>)
    .OPENROUTER_PROVIDER_ORDER;
  if (typeof providerOrder === "string") {
    normalizedConfig.OPENROUTER_PROVIDER_ORDER = providerOrder
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);
  }

  return normalizedConfig;
};

/**
 * Returns a user-facing validation message, or null when the config is valid.
 */
export const getLLMConfigValidationError = (
  inputConfig: LLMConfig
): string | null => {
  const llmConfig = normalizeLLMConfig(inputConfig);

  if (!llmConfig.LLM) {
    return "Selecciona un proveedor de texto.";
  }

  const llm = llmConfig.LLM;
  if (llm === "presenton") {
    return null;
  }

  const maxOutputTokens = (llmConfig as Record<string, unknown>)
    .LLM_MAX_OUTPUT_TOKENS;
  if (
    isProvided(maxOutputTokens) &&
    (typeof maxOutputTokens !== "number" ||
      !Number.isInteger(maxOutputTokens) ||
      maxOutputTokens <= 0)
  ) {
    return "El número máximo de tokens de salida debe ser un número entero mayor que cero.";
  }

  if (!llmConfig.DISABLE_IMAGE_GENERATION && !llmConfig.IMAGE_PROVIDER) {
    return "Selecciona un proveedor de imágenes o desactiva la generación de imágenes.";
  }

  if (llm === "openai") {
    if (!isProvided(llmConfig.OPENAI_API_KEY)) {
      return "La clave de API de OpenAI es obligatoria.";
    }
    if (!isProvided(llmConfig.OPENAI_MODEL)) {
      return "Introduce o selecciona un ID de modelo de chat de OpenAI en la pestaña Proveedor de texto.";
    }
  } else if (llm === "deepseek") {
    if (!isProvided(llmConfig.DEEPSEEK_API_KEY)) {
      return "La clave de API de DeepSeek es obligatoria.";
    }
    if (!isProvided(llmConfig.DEEPSEEK_MODEL)) {
      return "Introduce o selecciona un ID de modelo de DeepSeek.";
    }
  } else if (llm === "google") {
    if (!isProvided(llmConfig.GOOGLE_API_KEY)) {
      return "La clave de API de Google es obligatoria.";
    }
    if (!isProvided(llmConfig.GOOGLE_MODEL)) {
      return "Introduce o selecciona un ID de modelo de Google.";
    }
  } else if (llm === "vertex") {
    const hasApiKey = isProvided(llmConfig.VERTEX_API_KEY);
    const hasProject = isProvided(llmConfig.VERTEX_PROJECT);
    const hasLocation = isProvided(llmConfig.VERTEX_LOCATION);
    if (!hasApiKey && !hasProject) {
      return "Vertex AI requiere una clave de API de Vertex o un proyecto de GCP.";
    }
    if (hasApiKey && (hasProject || hasLocation)) {
      return "Usa el modo de clave de API de Vertex o el modo de proyecto/ubicación, pero no ambos.";
    }
    if (!isProvided(llmConfig.VERTEX_MODEL)) {
      return "El modelo de Vertex es obligatorio.";
    }
  } else if (llm === "azure") {
    if (!isProvided(llmConfig.AZURE_OPENAI_API_KEY)) {
      return "La clave de API de Azure OpenAI es obligatoria.";
    }

    if (!isProvided(llmConfig.AZURE_OPENAI_ENDPOINT)) {
      return "El endpoint de Azure es obligatorio.";
    }

    if (!isProvided(llmConfig.AZURE_OPENAI_API_VERSION)) {
      return "La versión de la API de Azure OpenAI es obligatoria.";
    }

    if (!isProvided(llmConfig.AZURE_OPENAI_MODEL)) {
      return "El nombre del modelo de Azure es obligatorio.";
    }
  } else if (llm === "bedrock") {
    if (!isProvided(llmConfig.BEDROCK_MODEL)) {
      return "El modelo de Bedrock es obligatorio.";
    }
    const hasApiKey = isProvided(llmConfig.BEDROCK_API_KEY);
    const hasAwsAccess = isProvided(llmConfig.BEDROCK_AWS_ACCESS_KEY_ID);
    const hasAwsSecret = isProvided(llmConfig.BEDROCK_AWS_SECRET_ACCESS_KEY);
    if (!hasApiKey && !(hasAwsAccess && hasAwsSecret)) {
      return "Proporciona una clave de API de Bedrock, o un ID de clave de acceso de AWS + clave secreta.";
    }
  } else if (llm === "openrouter") {
    if (!isProvided(llmConfig.OPENROUTER_API_KEY)) {
      return "La clave de API de OpenRouter es obligatoria.";
    }
    if (!isProvided(llmConfig.OPENROUTER_MODEL)) {
      return "Selecciona o introduce un ID de modelo de OpenRouter.";
    }
  } else if (llm === "cerebras") {
    if (!isProvided(llmConfig.CEREBRAS_API_KEY)) {
      return "La clave de API de Cerebras es obligatoria.";
    }
    if (!isProvided(llmConfig.CEREBRAS_MODEL)) {
      return "Selecciona o introduce un ID de modelo de Cerebras.";
    }
  } else if (llm === "fireworks") {
    if (!isProvided(llmConfig.FIREWORKS_API_KEY)) {
      return "La clave de API de Fireworks es obligatoria.";
    }
    if (!isProvided(llmConfig.FIREWORKS_MODEL)) {
      return "Selecciona o introduce un ID de modelo de Fireworks.";
    }
  } else if (llm === "together") {
    if (!isProvided(llmConfig.TOGETHER_API_KEY)) {
      return "La clave de API de Together es obligatoria.";
    }
    if (!isProvided(llmConfig.TOGETHER_MODEL)) {
      return "Selecciona o introduce un ID de modelo de Together.";
    }
  } else if (llm === "anthropic") {
    if (!isProvided(llmConfig.ANTHROPIC_API_KEY)) {
      return "La clave de API de Anthropic es obligatoria.";
    }
    if (!isProvided(llmConfig.ANTHROPIC_MODEL)) {
      return "Introduce o selecciona un ID de modelo de Anthropic.";
    }
  } else if (llm === "ollama") {
    if (!isProvided(llmConfig.OLLAMA_URL?.trim())) {
      return 'La URL de Ollama es obligatoria. Introduce la URL de tu servidor de Ollama o haz clic en "Comprobar modelos" para rellenar la predeterminada disponible.';
    }
    if (!isProvided(llmConfig.OLLAMA_MODEL)) {
      return "Selecciona un modelo de Ollama. Si no aparece ninguno, comprueba que Ollama está en ejecución y es accesible.";
    }
  } else if (llm === "custom") {
    if (!isProvided(llmConfig.CUSTOM_LLM_URL)) {
      return "Introduce la URL de tu endpoint de LLM personalizado (compatible con OpenAI).";
    }
    if (!isProvided(llmConfig.CUSTOM_MODEL)) {
      return "Introduce un ID de modelo o un alias para tu endpoint personalizado.";
    }
  } else if (llm === "litellm") {
    if (!isProvided(llmConfig.LITELLM_BASE_URL)) {
      return "La URL base de LiteLLM es obligatoria.";
    }
    if (!isProvided(llmConfig.LITELLM_MODEL)) {
      return "Introduce o selecciona un ID de modelo o un alias de LiteLLM.";
    }
  } else if (llm === "lmstudio") {
    if (!isProvided(llmConfig.LMSTUDIO_MODEL)) {
      return "Introduce o selecciona un ID de modelo de LM Studio.";
    }
  } else if (llm === "codex" || llm === "chatgpt") {
    if (!isProvided(llmConfig.CODEX_MODEL)) {
      return "Selecciona un modelo de Codex.";
    }
    if (!isSupportedCodexModel(llmConfig.CODEX_MODEL)) {
      return "Selecciona un modelo de Codex compatible.";
    }
  } else {
    return "Proveedor de texto no compatible o desconocido.";
  }

  if (!llmConfig.DISABLE_IMAGE_GENERATION) {
    switch (llmConfig.IMAGE_PROVIDER) {
      case "pexels":
        if (!isProvided(llmConfig.PEXELS_API_KEY)) {
          return "La clave de API de Pexels es obligatoria.";
        }
        break;
      case "pixabay":
        if (!isProvided(llmConfig.PIXABAY_API_KEY)) {
          return "La clave de API de Pixabay es obligatoria.";
        }
        break;
      case "gpt-image-2":
        if (!isProvided(llmConfig.OPENAI_API_KEY)) {
          return "La clave de API de OpenAI es obligatoria para GPT Image 2.";
        }
        break;
      case "gpt-image-2.5-flare":
      case "gpt-image-2.5-sunburst":
        if (!isProvided(llmConfig.OPENAI_API_KEY)) {
          return "La clave de API de OpenAI es obligatoria para GPT Image 2.5.";
        }
        break;
      case "gemini_flash":
        if (!isProvided(llmConfig.GOOGLE_API_KEY)) {
          return "La clave de API de Google es obligatoria para generar imágenes con Gemini Flash.";
        }
        break;
      case "nanobanana_pro":
        if (!isProvided(llmConfig.GOOGLE_API_KEY)) {
          return "La clave de API de Google es obligatoria para NanoBanana Pro.";
        }
        break;
      case "comfyui":
        if (!isProvided(llmConfig.COMFYUI_URL)) {
          return "La URL del servidor de ComfyUI es obligatoria.";
        }
        break;
      case "open_webui":
        if (!isProvided(llmConfig.OPEN_WEBUI_IMAGE_URL)) {
          return "La URL de Open WebUI es obligatoria.";
        }
        break;
      case "openai_compatible":
        if (
          !isProvided(llmConfig.OPENAI_COMPAT_IMAGE_BASE_URL?.trim()) ||
          !isProvided(llmConfig.OPENAI_COMPAT_IMAGE_API_KEY?.trim()) ||
          !isProvided(llmConfig.OPENAI_COMPAT_IMAGE_MODEL?.trim())
        ) {
          return "La API de imágenes compatible con OpenAI requiere URL base, clave de API y modelo.";
        }
        break;
      default:
        return "Selecciona un proveedor de imágenes válido.";
    }
  }

  if (llmConfig.WEB_GROUNDING) {
    if (!isProvided(llmConfig.WEB_SEARCH_PROVIDER)) {
      return "Selecciona un proveedor de búsqueda web o desactiva la búsqueda web.";
    }
    switch (llmConfig.WEB_SEARCH_PROVIDER) {
      case "searxng":
        if (!isProvided(llmConfig.SEARXNG_BASE_URL)) {
          return "La URL base de SearXNG es obligatoria.";
        }
        break;
      case "tavily":
        if (!isProvided(llmConfig.TAVILY_API_KEY)) {
          return "La clave de API de Tavily es obligatoria.";
        }
        break;
      case "exa":
        if (!isProvided(llmConfig.EXA_API_KEY)) {
          return "La clave de API de Exa es obligatoria.";
        }
        break;
      case "brave":
        if (!isProvided(llmConfig.BRAVE_SEARCH_API_KEY)) {
          return "La clave de API de Brave Search es obligatoria.";
        }
        break;
      case "auto":
        break;
      default:
        return "Selecciona un proveedor de búsqueda web válido.";
    }
  }

  return null;
};

/** Codex is selected but no model chosen - block navigation away from Settings. */
export function isCodexMissingSelectedModel(llmConfig: LLMConfig): boolean {
  return llmConfig.LLM === "codex" && !isProvided(llmConfig.CODEX_MODEL);
}

/**
 * While on Settings with Codex selected and no model (e.g. after sign-out),
 * block leaving for non-Settings destinations.
 */
export function shouldBlockCodexOutboundNav(
  llmConfig: LLMConfig,
  destinationPath: string,
  currentPathname: string | null
): boolean {
  if (!isCodexMissingSelectedModel(llmConfig)) return false;
  const onSettings =
    currentPathname === "/settings" ||
    (currentPathname?.startsWith("/settings/") ?? false);
  if (!onSettings) return false;
  const path = destinationPath.split("?")[0] || "";
  if (path === "/settings" || path.startsWith("/settings/")) return false;
  return true;
}

/** Keep Redux in sync when Codex signs out so guards observe cleared CODEX_MODEL. */
export function syncStoreAfterCodexSignOut(): void {
  const prev = store.getState().userConfig.llm_config;
  store.dispatch(
    setLLMConfig({
      ...prev,
      LLM: "codex",
      CODEX_MODEL: "",
      CODEX_ACCESS_TOKEN: "",
      CODEX_REFRESH_TOKEN: "",
      CODEX_TOKEN_EXPIRES: "",
      CODEX_ACCOUNT_ID: "",
      CODEX_USERNAME: "",
      CODEX_EMAIL: "",
      CODEX_IS_PRO: false,
    })
  );
}

/** Clear the stale cloud selection immediately after Presenton is disconnected. */
export function syncStoreAfterPresentonDisconnect(): void {
  const prev = store.getState().userConfig.llm_config;
  store.dispatch(
    setLLMConfig({
      ...prev,
      LLM: "",
    })
  );
}

export const handleSaveLLMConfig = async (llmConfig: LLMConfig) => {
  const normalizedConfig = normalizeLLMConfig(llmConfig);
  const validationError = getLLMConfigValidationError(normalizedConfig);
  if (validationError) {
    throw new Error(validationError);
  }

  const response = await fetch("/api/user-config", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(normalizedConfig),
  });
  if (!response.ok) {
    throw new Error(`No se ha podido guardar la configuración del usuario (${response.status})`);
  }

  store.dispatch(setLLMConfig(normalizedConfig));
};

export const hasValidLLMConfig = (llmConfig: LLMConfig) =>
  getLLMConfigValidationError(llmConfig) === null;
