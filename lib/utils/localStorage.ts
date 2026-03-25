export function getOrCreateUserId(): string {
  const key = "userId";
  let userId = localStorage.getItem(key);

  if (!userId) {
    userId = crypto.randomUUID();
    localStorage.setItem(key, userId);
  }

  return userId;
}
