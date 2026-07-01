// Centralized API Client Layer for HomeSphere AI

const DEFAULT_API_URL = typeof window !== "undefined" && window.location.hostname.includes("vercel.app")
  ? "https://homeserviceai-1.onrender.com"
  : "http://localhost:8000";

interface RequestOptions extends RequestInit {
  timeout?: number;
  retries?: number;
}

export class APIError extends Error {
  status?: number;
  info?: any;

  constructor(message: string, status?: number, info?: any) {
    super(message);
    this.name = "APIError";
    this.status = status;
    this.info = info;
  }
}

/**
 * Perform a fetch request with timeout, authorization headers, and retries.
 */
export async function apiRequest(endpoint: string, options: RequestOptions = {}): Promise<any> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_URL;
  // Ensure correct slash joining
  const url = endpoint.startsWith("http") ? endpoint : `${baseUrl.replace(/\/$/, "")}/${endpoint.replace(/^\//, "")}`;

  const {
    timeout = 10000, // 10 seconds default
    retries = 2,    // 2 retries default
    headers = {},
    ...restOptions
  } = options;

  // Add default headers and auth token
  const defaultHeaders: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (typeof window !== "undefined") {
    const token = localStorage.getItem("hs_token");
    if (token) {
      defaultHeaders["Authorization"] = `Bearer ${token}`;
    }
  }

  const combinedHeaders = {
    ...defaultHeaders,
    ...headers,
  };

  let attempt = 0;
  while (attempt <= retries) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...restOptions,
        headers: combinedHeaders,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Parse JSON safely
      let data: any = null;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        try {
          data = await response.json();
        } catch {
          // Empty or invalid JSON
        }
      } else {
        try {
          data = await response.text();
        } catch {
          // Empty text
        }
      }

      if (!response.ok) {
        throw new APIError(
          data?.detail || `HTTP error! Status: ${response.status}`,
          response.status,
          data
        );
      }

      return data;
    } catch (error: any) {
      clearTimeout(timeoutId);

      const isTimeout = error.name === "AbortError";
      const isNetworkError = error instanceof TypeError; // fetch throws TypeError on network failure

      if ((isTimeout || isNetworkError) && attempt < retries) {
        attempt++;
        const backoffMs = attempt * 1000;
        console.warn(`HomeSphere API attempt ${attempt} failed: ${error.message}. Retrying in ${backoffMs}ms...`);
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
        continue;
      }

      // Re-throw the APIError or format other errors
      if (error instanceof APIError) {
        throw error;
      }
      throw new APIError(
        isTimeout ? "Request timed out." : error.message || "Network error occurred.",
        isTimeout ? 408 : 500,
        error
      );
    }
  }
}

export const api = {
  get: (endpoint: string, options?: RequestOptions) => apiRequest(endpoint, { ...options, method: "GET" }),
  post: (endpoint: string, body: any, options?: RequestOptions) => apiRequest(endpoint, { ...options, method: "POST", body: JSON.stringify(body) }),
  put: (endpoint: string, body: any, options?: RequestOptions) => apiRequest(endpoint, { ...options, method: "PUT", body: JSON.stringify(body) }),
  delete: (endpoint: string, options?: RequestOptions) => apiRequest(endpoint, { ...options, method: "DELETE" }),
};
