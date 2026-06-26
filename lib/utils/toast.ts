import { toast } from "sonner";
import { extractErrorMessage } from "./errorMessage";

export function showError(message: string) {
  toast.error(extractErrorMessage(message));
}

export function showSuccess(message: string) {
  toast.success(message);
}
