import { API_BASE_URL } from "../config/env";
import { useAuth } from "../store/auth";

async function safeJson(res: Response) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function apiFetch<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = useAuth.getState().token;
  const url = `${API_BASE_URL}/api${path}`;

  console.log("API CALL:", url); 

  const headers = new Headers(options.headers || {});
  headers.set("Accept", "application/json");
  // En caso de que sea FormData no enviamos el Content-Type
  if (!(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(url, { ...options, headers });

  if (!res.ok) {
    const data = await safeJson(res);
    const msg =
      typeof data === "string"
        ? data
        : data?.message || `Error HTTP ${res.status}`;
    throw new Error(msg);
  }

  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    return (await res.json()) as T;
  }
  return (await res.text()) as any;
}
