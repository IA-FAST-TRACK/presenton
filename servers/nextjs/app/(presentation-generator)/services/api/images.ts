import { getHeaderForFormData } from "./header";
import { ApiResponseHandler, apiFetch } from "./api-error-handler";
import { ImageAssetResponse } from "./types";
import { getApiUrl } from "@/utils/api";

interface StockSearchOptions {
  provider?: string;
  apiKey?: string;
  strictApiKey?: boolean;
}

const REDACTED_SECRET_PLACEHOLDER = "__configured__";

export class ImagesApi {
  static async testProvider(
    config: Record<string, string>,
    signal?: AbortSignal,
  ): Promise<{ image_url: string }> {
    const response = await apiFetch(getApiUrl("/api/v1/ppt/images/test"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
      signal,
    });
    const result = await ApiResponseHandler.handleResponse(response, "Error en la prueba del proveedor de imágenes");
    if (typeof result?.image_url !== "string" || !result.image_url) {
      throw new Error("El proveedor no ha devuelto ninguna imagen de muestra. Revisa su configuración e inténtalo de nuevo.");
    }
    return result;
  }
 
 static async uploadImage(file: File): Promise<ImageAssetResponse> {
    try {
          const formData = new FormData();
      formData.append("file", file);
    const response = await apiFetch(getApiUrl(`/api/v1/ppt/images/upload`), {
      method: "POST",
      headers: getHeaderForFormData(),
      body: formData,
    });
    return await ApiResponseHandler.handleResponse(response, "No se ha podido subir la imagen") as ImageAssetResponse;
  } catch (error:any) {
    console.log("Upload error:", error.message);
    throw error;
  }
  }

  static async getUploadedImages(): Promise<ImageAssetResponse[]> {
    try {
    const response = await apiFetch(getApiUrl(`/api/v1/ppt/images/uploaded`), {
      cache: "no-cache",
    });
   return await ApiResponseHandler.handleResponse(response, "No se han podido obtener las imágenes subidas") as ImageAssetResponse[];
  } catch (error:any) {
    console.log("Get uploaded images error:", error);
    throw error;
  }
  }

  static async getGeneratedImages(): Promise<ImageAssetResponse[]> {
    const response = await apiFetch(getApiUrl(`/api/v1/ppt/images/generated`), {
      cache: "no-cache",
    });
    return await ApiResponseHandler.handleResponse(
      response,
      "No se han podido obtener las imágenes generadas",
    ) as ImageAssetResponse[];
  }

  static async generateImage(
    prompt: string,
    targetSize?: { width: number; height: number },
  ): Promise<string> {
    const params = new URLSearchParams({ prompt });
    if (targetSize?.width && targetSize?.height) {
      params.set("width", String(targetSize.width));
      params.set("height", String(targetSize.height));
    }
    const response = await apiFetch(
      getApiUrl(`/api/v1/ppt/images/generate?${params.toString()}`),
      { cache: "no-cache" },
    );
    return await ApiResponseHandler.handleResponse(
      response,
      "No se ha podido generar la imagen",
    ) as string;
  }

  static async deleteImage(image_id: string): Promise<{success: boolean, message?: string}> {
    try {
      const response = await apiFetch(getApiUrl(`/api/v1/ppt/images/${image_id}`), {
        method: "DELETE"
      });
      return await ApiResponseHandler.handleResponse(response, "No se ha podido eliminar la imagen") as {success: boolean, message?: string};
    } catch (error:any) {
      console.log("Delete image error:", error);
      throw error;
    }
  }

  static async searchStockImages(
    query: string,
    limit: number = 12,
    options: StockSearchOptions = {}
  ): Promise<string[]> {
    try {
      const params = new URLSearchParams({
        query,
        limit: String(limit),
      });
      const normalizedProvider = (options.provider || "").trim().toLowerCase();
      if (normalizedProvider) {
        params.set("provider", normalizedProvider);
      }
      if (options.strictApiKey) {
        params.set("strict_api_key", "true");
      }

      const headers: Record<string, string> = {};
      const trimmedApiKey = (options.apiKey || "").trim();
      if (trimmedApiKey && trimmedApiKey !== REDACTED_SECRET_PLACEHOLDER) {
        headers["X-Provider-Api-Key"] = trimmedApiKey;
      }

      const response = await apiFetch(getApiUrl(`/api/v1/ppt/images/search?${params.toString()}`), {
        method: "GET",
        headers,
      });
      return await ApiResponseHandler.handleResponse(response, "No se han podido buscar imágenes de stock") as string[];
    } catch (error:any) {
      console.log("Stock image search error:", error);
      throw error;
    }
  }
}
