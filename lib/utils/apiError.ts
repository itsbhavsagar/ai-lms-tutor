import { extractErrorMessage } from "./errorMessage";

export function jsonApiError(
  error: unknown,
  fallback: string,
  status = 500,
): Response {
  return Response.json(
    { error: extractErrorMessage(error, fallback) },
    { status },
  );
}
