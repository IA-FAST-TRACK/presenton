/**
 * Flags de funcionalidades propias del fork AI Fast Track.
 *
 * Se centralizan aquí para que las diferencias con el upstream de Presenton
 * sean pequeñas y fáciles de mantener en futuros merges.
 */

/**
 * Presenton Cloud (cuenta de Presenton como proveedor de texto).
 * Desactivado por defecto: los usuarios sólo configuran sus propios
 * proveedores (OpenAI, Anthropic, Google, Ollama, personalizado...).
 * Para reactivarlo hay que construir con NEXT_PUBLIC_ENABLE_PRESENTON_CLOUD=true.
 */
export const PRESENTON_CLOUD_ENABLED =
  process.env.NEXT_PUBLIC_ENABLE_PRESENTON_CLOUD === "true";
