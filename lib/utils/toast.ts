import { toast } from "sonner";
import { parseJsonResponse } from "@/lib/api/client";
import { extractErrorMessage } from "./errorMessage";

export function getErrorMessage(
  data: unknown,
  fallback = "Something went wrong. Please try again.",
): string {
  return extractErrorMessage(data, fallback);
}

export function showError(message: string) {
  toast.error(extractErrorMessage(message));
}

export async function toastApiError(
  res: Response,
  fallback?: string,
): Promise<void> {
  const data = await parseJsonResponse(res);
  showError(getErrorMessage(data, fallback ?? "Something went wrong. Please try again."));
}

export { parseJsonResponse };
