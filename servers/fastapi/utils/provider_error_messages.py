import json
import re
from typing import Any


INVALID_API_KEY_MESSAGE = "Clave API no válida. Comprueba tu clave API e inténtalo de nuevo."
IMAGE_MODERATION_MESSAGE = (
    "El sistema de seguridad del proveedor ha bloqueado una solicitud de imagen. "
    "Prueba con otra indicación."
)
GENERIC_PROVIDER_ERROR_MESSAGE = (
    "El proveedor de IA ha devuelto un error. Inténtalo de nuevo."
)


_INVALID_API_KEY_PATTERNS = (
    re.compile(r"\binvalid[_\s-]*api[_\s-]*key\b", re.IGNORECASE),
    re.compile(r"\bincorrect\s+api\s+key\b", re.IGNORECASE),
    re.compile(r"\bapi\s+key\s+(?:is\s+)?invalid\b", re.IGNORECASE),
    re.compile(r"\bapi[_\s-]*key[_\s-]*invalid\b", re.IGNORECASE),
    re.compile(r"\bno\s+api\s+key\b", re.IGNORECASE),
    re.compile(r"\bauthentication(?:_error|\s+error)?\b", re.IGNORECASE),
)


def _normalize_code(value: Any) -> str:
    return str(value or "").strip().lower().replace("-", "_").replace(" ", "_")


def _stringify_for_detection(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, str):
        return value
    if isinstance(value, (dict, list, tuple)):
        try:
            return json.dumps(value, ensure_ascii=False)
        except Exception:
            return str(value)
    return str(value)


def _combined_text(*values: Any) -> str:
    return " ".join(part for part in (_stringify_for_detection(v) for v in values) if part)


def looks_like_invalid_api_key_error(
    *,
    status_code: int | None = None,
    code: Any = None,
    error_type: Any = None,
    message: Any = None,
) -> bool:
    normalized_code = _normalize_code(code)
    normalized_type = _normalize_code(error_type)
    if normalized_code in {
        "invalid_api_key",
        "invalid_api_key_error",
        "authentication_error",
        "unauthorized",
    }:
        return True
    if normalized_type in {"authentication_error", "invalid_api_key"}:
        return True
    if status_code == 401:
        return True

    text = _combined_text(code, error_type, message)
    return any(pattern.search(text) for pattern in _INVALID_API_KEY_PATTERNS)


def _looks_like_moderation_block(
    *, code: Any = None, error_type: Any = None, message: Any = None
) -> bool:
    text = _combined_text(code, error_type, message).lower()
    return (
        _normalize_code(code) == "moderation_blocked"
        or "moderation_blocked" in text
        or ("safety system" in text and "image_generation" in text)
    )


def _looks_like_model_access_error(
    *, code: Any = None, message: Any = None
) -> bool:
    normalized_code = _normalize_code(code)
    if normalized_code in {"model_not_found", "model_not_available"}:
        return True

    text = _combined_text(code, message).lower()
    return "model" in text and (
        "not found" in text
        or "does not exist" in text
        or "do not have access" in text
        or "doesn't exist" in text
    )


def _provider_operation_prefix(provider: str, operation: str) -> str:
    provider_label = (provider or "Proveedor de IA").strip()
    operation_label = (operation or "request").strip()
    return f"{provider_label} {operation_label}"


def safe_provider_error_detail(
    provider: str,
    operation: str,
    *,
    status_code: int | None = None,
    code: Any = None,
    error_type: Any = None,
    message: Any = None,
) -> str:
    if looks_like_invalid_api_key_error(
        status_code=status_code,
        code=code,
        error_type=error_type,
        message=message,
    ):
        return INVALID_API_KEY_MESSAGE

    if _looks_like_moderation_block(
        code=code,
        error_type=error_type,
        message=message,
    ):
        if "image" in (operation or "").lower():
            return IMAGE_MODERATION_MESSAGE
        return (
            "El sistema de seguridad del proveedor ha bloqueado la solicitud. "
            "Revísala e inténtalo de nuevo."
        )

    prefix = _provider_operation_prefix(provider, operation)
    normalized_code = _normalize_code(code)
    messages = {
        "provider_dns_error": f"{provider}: no se ha podido resolver el nombre de host. Revisa la URL del proveedor y la configuración de red de Docker.",
        "provider_unreachable": f"{provider}: no se puede establecer la conexión. Comprueba que esté en ejecución y que la URL del proveedor y la red de Docker sean correctas.",
        "provider_timeout": f"{provider}: ha tardado demasiado en responder. Inténtalo de nuevo o revisa la carga y la conexión del proveedor.",
        "context_window_exceeded": "La solicitud de IA ha superado la ventana de contexto del modelo. Prueba con una edición más pequeña o usa un modelo con una ventana de contexto mayor.",
        "provider_invalid_response": f"{provider}: ha devuelto una respuesta incompleta o no válida. Inténtalo de nuevo o comprueba que la URL y el modelo configurados admitan esta operación.",
        "provider_configuration_error": "La configuración del proveedor de IA está incompleta o no es válida. Revisa la configuración del proveedor o contacta con tu administrador.",
        "provider_unavailable": f"{provider}: no está disponible temporalmente. Inténtalo de nuevo en breve o revisa el estado del proveedor.",
        "provider_tls_error": f"{provider}: no se ha podido establecer una conexión segura. Revisa el certificado HTTPS del proveedor y el almacén de confianza del sistema.",
        "provider_endpoint_not_found": f"{provider}: no se ha encontrado el endpoint. Revisa la URL de la API configurada y el modelo seleccionado.",
    }
    if normalized_code in messages:
        return messages[normalized_code]
    if normalized_code == "insufficient_quota":
        return (
            f"{prefix}: error porque no hay cuota de API disponible. "
            f"Revisa la facturación de la API de {provider} y los límites del proyecto al que pertenece esta clave API."
        )

    if status_code == 403:
        return (
            f"{provider}: se ha rechazado la solicitud porque la clave API configurada no "
            "tiene acceso. Revisa los permisos de la clave y el modelo seleccionado."
        )

    if status_code == 429 or normalized_code in {"rate_limit_exceeded", "rate_limit"}:
        return f"{prefix}: se ha alcanzado temporalmente el límite de solicitudes. Espera e inténtalo de nuevo."

    if _looks_like_model_access_error(code=code, message=message):
        return (
            f"{provider}: el modelo seleccionado no está disponible. "
            "Elige otro modelo o revisa el acceso al modelo."
        )

    if status_code in {408, 504}:
        return messages["provider_timeout"]
    if status_code is not None and status_code >= 500:
        return messages["provider_unavailable"]
    if status_code in {400, 422}:
        return f"{provider}: se ha rechazado la solicitud. Revisa el modelo seleccionado y la configuración del proveedor, o prueba con una solicitud más pequeña."

    return f"{prefix}: error. Inténtalo de nuevo."


def safe_llm_provider_error_detail(
    *,
    status_code: int | None = None,
    message: Any = None,
) -> str:
    if looks_like_invalid_api_key_error(status_code=status_code, message=message):
        return INVALID_API_KEY_MESSAGE

    text = _stringify_for_detection(message).strip()
    if not text:
        return GENERIC_PROVIDER_ERROR_MESSAGE

    looks_like_raw_provider_payload = (
        text.startswith("{")
        or text.startswith("[")
        or "{'error'" in text
        or '"error"' in text
        or "Error code:" in text
        or "http" in text.lower()
    )
    if looks_like_raw_provider_payload:
        return safe_provider_error_detail(
            "Proveedor de IA",
            "API request",
            status_code=status_code,
            message=text,
        )

    return safe_provider_error_detail(
        "Proveedor de IA", "API request", status_code=status_code, message=text,
    )
