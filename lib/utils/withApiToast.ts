import { getClientErrorMessage } from "@/lib/api/client";
import { showError } from "@/lib/utils/toast";

export async function withApiToast<T>(
  fallback: string,
  action: () => Promise<T>,
): Promise<T | undefined> {
  try {
    return await action();
  } catch (error) {
    console.error(error);
    showError(getClientErrorMessage(error, fallback));
    return undefined;
  }
}
