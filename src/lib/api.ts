/**
 * Robust API fetch helper with automatic retry, HTTP status code extraction,
 * and detailed error logging for full transparency.
 */

export interface ApiError extends Error {
  status?: number;
  statusText?: string;
  responseData?: any;
}

export async function fetchApi<T = any>(
  url: string,
  options: RequestInit = {},
  retriesLeft = 1
): Promise<T> {
  try {
    const res = await fetch(url, options);

    if (!res.ok) {
      let errorBody: any = null;
      let rawText = "";
      try {
        rawText = await res.text();
        errorBody = JSON.parse(rawText);
      } catch (e) {
        errorBody = { message: rawText || res.statusText };
      }

      const errorMessage =
        errorBody?.error ||
        errorBody?.message ||
        errorBody?.details ||
        `HTTP Request failed with status ${res.status} (${res.statusText})`;

      const apiErr: ApiError = new Error(`[HTTP ${res.status}] ${errorMessage}`);
      apiErr.status = res.status;
      apiErr.statusText = res.statusText;
      apiErr.responseData = errorBody;

      if (res.status >= 500) {
        console.error(`[API Error Response ${res.status} - ${url}]:`, {
          url,
          status: res.status,
          statusText: res.statusText,
          errorBody,
          rawText,
        });
      } else {
        console.warn(`[API Notice ${res.status} - ${url}]:`, errorMessage);
      }

      throw apiErr;
    }

    const data = await res.json().catch((err) => {
      console.warn(`[API JSON Parse Warning - ${url}]:`, err);
      return {};
    });

    return data as T;
  } catch (err: any) {
    if (!err?.status || err.status >= 500) {
      console.error(`[API Network/Fetch Error - ${url}]:`, {
        url,
        options,
        errorName: err?.name,
        errorMessage: err?.message,
        status: err?.status,
        responseData: err?.responseData,
        stack: err?.stack,
        rawError: err,
      });
    }

    // Requirement 8: Retry recoverable requests once before showing an error
    if (retriesLeft > 0 && (!err?.status || err.status >= 500)) {
      console.warn(`[API Retry] Retrying request to ${url} (retries left: ${retriesLeft})...`);
      await new Promise((resolve) => setTimeout(resolve, 600));
      return fetchApi<T>(url, options, retriesLeft - 1);
    }

    throw err;
  }
}
