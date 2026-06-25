export function deriveNoteTitle(
  title: string | undefined,
  content: string,
): string {
  const trimmedTitle = (title ?? "").trim();
  if (trimmedTitle) return trimmedTitle.slice(0, 120);

  const firstLine = content
    .split("\n")
    .map((line) => line.trim())
    .find(Boolean);

  if (firstLine) return firstLine.slice(0, 120);
  return "Untitled";
}
