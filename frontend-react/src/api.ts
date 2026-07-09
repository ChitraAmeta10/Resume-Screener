const TOKEN_KEY = "sift_token";

// Base URL of the backend API. Empty in local dev (Vite proxies /v1 → :8001) and
// when the backend serves the built frontend. In a split deploy (frontend on
// Vercel, backend on Render) set VITE_API_BASE to the backend's URL at build time.
const API_BASE = (import.meta.env.VITE_API_BASE || "").replace(/\/+$/, "");

export const tokenStore = {
  get(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set(v: string | null) {
    try {
      if (v) localStorage.setItem(TOKEN_KEY, v);
      else localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* ignore */
    }
  },
};

export class ApiError extends Error {
  status: number;
  data: unknown;
  constructor(status: number, data: unknown) {
    super(`API error ${status}`);
    this.status = status;
    this.data = data;
  }
}

// Called when any request returns 401 so the app can force a logout.
let onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(fn: () => void) {
  onUnauthorized = fn;
}

interface ApiOpts {
  method?: string;
  json?: unknown;
  // FormData (file upload) or URLSearchParams (form login) — content-type auto-set
  form?: BodyInit;
  auth?: boolean;
}

export async function api<T = unknown>(path: string, opts: ApiOpts = {}): Promise<T> {
  const headers: Record<string, string> = {};
  let body: BodyInit | undefined;

  if (opts.json !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(opts.json);
  }
  if (opts.form) body = opts.form;

  const token = tokenStore.get();
  if (opts.auth !== false && token) headers["Authorization"] = "Bearer " + token;

  const res = await fetch(API_BASE + path, { method: opts.method || "GET", headers, body });
  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (res.status === 401 && opts.auth !== false) {
    tokenStore.set(null);
    onUnauthorized?.();
    throw new ApiError(401, data);
  }
  if (!res.ok) throw new ApiError(res.status, data);
  return data as T;
}

export function errorDetail(e: unknown): string {
  if (e instanceof ApiError && e.data && typeof e.data === "object") {
    const d = e.data as Record<string, unknown>;
    const detail = d.detail ?? d.message;
    if (typeof detail === "string") return detail;
  }
  return "Something went wrong. Please try again.";
}
