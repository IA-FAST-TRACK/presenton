export interface ApiErrorResponse {
  detail?: unknown;
  message?: string;
  error?: unknown;
}

export interface ApiErrorMetadata {
  code?: string;
  retryable: boolean;
  requestId?: string;
}

const INVALID_API_KEY_MESSAGE =
  "Clave de API no válida. Comprueba tu clave de API e inténtalo de nuevo.";
const SAFETY_BLOCK_MESSAGE =
  "El sistema de seguridad del proveedor ha bloqueado la solicitud. Revísala e inténtalo de nuevo.";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function extractApiErrorMetadata(
  errorData: unknown,
  status?: number
): ApiErrorMetadata {
  const root = isRecord(errorData) ? errorData : null;
  const detail = root && isRecord(root.detail) ? root.detail : null;
  const error = root && isRecord(root.error) ? root.error : null;
  const metadata = { ...root, ...error, ...detail };
  const code =
    metadata && typeof metadata.code === "string" && metadata.code.trim()
      ? metadata.code.trim()
      : undefined;
  const retryable =
    metadata && typeof metadata.retryable === "boolean"
      ? metadata.retryable
      : Boolean(status && [408, 425, 429, 500, 502, 503, 504].includes(status));

  const requestId = typeof metadata.request_id === "string" ? metadata.request_id : undefined;
  return { code, retryable, requestId };
}

function nestedMessage(value: unknown, depth = 0): string | null {
  if (depth > 8) return null;
  if (!value) return null;
  if (typeof value === "string") return value;
  if (!isRecord(value)) return null;

  for (const key of ["message", "detail", "error"]) {
    const nested = value[key];
    if (typeof nested === "string" && nested.trim()) {
      return nested;
    }
    const message = nestedMessage(nested, depth + 1);
    if (message) {
      return message;
    }
  }

  return null;
}

export function normalizeApiErrorDetail(detail: unknown): string | null {
  if (!detail) return null;

  if (typeof detail === "string") {
    return detail;
  }

  if (Array.isArray(detail)) {
    const parts = detail
      .map((item) => {
        if (typeof item === "string") return item;
        if (isRecord(item)) {
          const maybeMsg = item.msg;
          const maybeLoc = item.loc;
          const locPath = Array.isArray(maybeLoc)
            ? maybeLoc
                .filter(
                  (value) =>
                    typeof value === "string" || typeof value === "number"
                )
                .join(".")
            : "";
          if (typeof maybeMsg === "string") {
            return locPath ? `${locPath}: ${maybeMsg}` : maybeMsg;
          }
          return nestedMessage(item);
        }
        return null;
      })
      .filter((value): value is string => Boolean(value));

    return parts.length ? parts.join("; ") : null;
  }

  if (isRecord(detail)) {
    return nestedMessage(detail);
  }

  return String(detail);
}

function looksLikeProviderAuthError(message: string, status?: number): boolean {
  const text = message.toLowerCase();
  return (
    /invalid[_\s-]*api[_\s-]*key/.test(text) ||
    /incorrect\s+api\s+key/.test(text) ||
    /api\s+key\s+(?:is\s+)?invalid/.test(text) ||
    text.includes("authentication_error") ||
    text.includes("invalid_api_key") ||
    Boolean(status === 401 && text.includes("api key"))
  );
}

function looksLikeSafetyBlock(message: string): boolean {
  const text = message.toLowerCase();
  return text.includes("moderation_blocked") || text.includes("safety system");
}

function looksLikeRawPayload(message: string): boolean {
  const text = message.trim();
  return (
    text.startsWith("{") ||
    text.startsWith("[") ||
    text.toLowerCase().startsWith("<!doctype") ||
    text.toLowerCase().startsWith("<html") ||
    text.includes("{'error'") ||
    text.includes('"error"') ||
    text.includes("Error code:") ||
    text.length > 1500 ||
    /https?:\/\/|traceback|sqlalchemy|cannot read properties|\b(?:authorization|api[_-]?key|password|bearer)\s*[:=]/i.test(text)
  );
}

export function statusErrorMessage(status: number, fallback: string): string {
  switch (status) {
    case 400: return "Revisa los datos introducidos e inténtalo de nuevo.";
    case 401: return "Tu sesión ha caducado. Vuelve a iniciar sesión.";
    case 403: return "No tienes permiso para realizar esta acción. Ponte en contacto con tu administrador si necesitas acceso.";
    case 404: return "No se ha encontrado el elemento solicitado. Es posible que se haya eliminado o movido.";
    case 409: return "Este elemento ha cambiado o ya existe. Actualiza la página e inténtalo de nuevo.";
    case 413: return "La solicitud es demasiado grande. Prueba con un archivo o una solicitud más pequeños.";
    case 415: return "El formato de este archivo o solicitud no es compatible.";
    case 422: return "Revisa los campos resaltados e inténtalo de nuevo.";
    case 428: return "Esta instalación necesita una configuración inicial. Pide a un administrador que la complete.";
    case 429: return "Demasiadas solicitudes. Espera un momento e inténtalo de nuevo.";
    case 500: return "El servidor no ha podido completar la solicitud. Inténtalo de nuevo.";
    case 502: return "Fast Track Presentaciones ha recibido una respuesta no válida de un servicio. Inténtalo de nuevo en unos instantes.";
    case 503: return "El servicio no está disponible temporalmente. Inténtalo de nuevo en unos instantes.";
    case 408:
    case 504: return "La solicitud ha tardado demasiado en completarse. Inténtalo de nuevo.";
    default: return fallback;
  }
}

export function sanitizeApiErrorMessage(
  message: string,
  fallbackMessage: string,
  status?: number
): string {
  const trimmed = message.trim();
  if (!trimmed) return fallbackMessage;
  if ([401, 403, 428].includes(status || 0) && /^(unauthorized|not authenticated|forbidden|admin browser session required|login setup is required)$/i.test(trimmed)) {
    return statusErrorMessage(status!, fallbackMessage);
  }

  if (looksLikeProviderAuthError(trimmed, status)) {
    return INVALID_API_KEY_MESSAGE;
  }
  if (looksLikeSafetyBlock(trimmed)) {
    return SAFETY_BLOCK_MESSAGE;
  }
  if (looksLikeRawPayload(trimmed)) {
    return fallbackMessage;
  }

  return trimmed;
}

export function extractApiErrorMessage(
  errorData: unknown,
  fallbackMessage: string,
  status?: number
): string {
  let message: string | null = null;

  if (isRecord(errorData)) {
    const apiError = errorData as ApiErrorResponse;
    message =
      normalizeApiErrorDetail(apiError.detail) ||
      (typeof apiError.message === "string" ? apiError.message : null) ||
      normalizeApiErrorDetail(apiError.error);
  } else {
    message = normalizeApiErrorDetail(errorData);
  }

  return sanitizeApiErrorMessage(message || fallbackMessage, fallbackMessage, status);
}
