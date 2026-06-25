import { extractErrorMessage } from "@/lib/utils/errorMessage";

export class ApiError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function parseJsonResponse(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

function resolveErrorMessage(data: unknown, fallback: string): string {
  return extractErrorMessage(data, fallback);
}

async function throwIfNotOk(res: Response, fallback: string): Promise<void> {
  if (res.ok) return;
  const data = await parseJsonResponse(res);
  throw new ApiError(resolveErrorMessage(data, fallback), res.status);
}

export function getClientErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) return error.message;
  return extractErrorMessage(error, fallback);
}

export async function apiGet<T>(url: string, fallback: string): Promise<T> {
  const res = await fetch(url);
  await throwIfNotOk(res, fallback);
  return res.json() as Promise<T>;
}

export async function apiPost<T>(
  url: string,
  body: unknown,
  fallback: string,
): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  await throwIfNotOk(res, fallback);
  return res.json() as Promise<T>;
}

export async function apiPatch<T>(
  url: string,
  body: unknown,
  fallback: string,
): Promise<T> {
  const res = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  await throwIfNotOk(res, fallback);
  return res.json() as Promise<T>;
}

export async function apiDelete<T>(url: string, fallback: string): Promise<T> {
  const res = await fetch(url, { method: "DELETE" });
  await throwIfNotOk(res, fallback);
  return res.json() as Promise<T>;
}

export async function apiPostForm<T>(
  url: string,
  formData: FormData,
  fallback: string,
): Promise<T> {
  const res = await fetch(url, { method: "POST", body: formData });
  await throwIfNotOk(res, fallback);
  return res.json() as Promise<T>;
}

export async function apiStreamPost(
  url: string,
  body: unknown,
  fallback: string,
): Promise<Response> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  await throwIfNotOk(res, fallback);
  return res;
}

export async function readTextStream(
  response: Response,
  onChunk: (text: string) => void,
): Promise<string> {
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let scheduled = false;
  let rafId = 0;

  const flush = () => {
    scheduled = false;
    onChunk(buffer);
  };

  const scheduleFlush = () => {
    if (scheduled) return;
    scheduled = true;
    rafId = requestAnimationFrame(flush);
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    scheduleFlush();
  }

  if (scheduled) {
    cancelAnimationFrame(rafId);
  }
  onChunk(buffer);

  return buffer;
}
