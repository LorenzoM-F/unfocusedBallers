const API_URL = import.meta.env.VITE_API_URL ?? "";

type ApiOptions = {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
};

const getToken = () => localStorage.getItem("token");

const getApiUrl = () => {
  if (!API_URL) {
    throw new Error("VITE_API_URL is not set. Add it to your frontend .env file.");
  }
  return API_URL;
};

const request = async <T>(path: string, options: ApiOptions = {}) => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers ?? {})
  };

  const token = getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${getApiUrl()}${path}`, {
      method: options.method ?? "GET",
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined
    });
  } catch {
    throw new Error("Network error. Please try again.");
  }

  const contentType = response.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");
  const data = isJson ? await response.json() : null;

  if (!response.ok) {
    throw new Error("Network error. Please try again.");
  }

  return data as T;
};

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PATCH", body }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" })
};
