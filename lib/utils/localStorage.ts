/**
 * Local storage utilities for persistent user and session management
 */

/**
 * Get or create a persistent user ID
 * Checks localStorage for "userId", generates one if missing, stores it, and returns it
 */
export function getOrCreateUserId(): string {
  const key = "userId";
  let userId = localStorage.getItem(key);

  if (!userId) {
    userId = crypto.randomUUID();
    localStorage.setItem(key, userId);
  }

  return userId;
}
