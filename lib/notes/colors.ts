function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export type NoteCardColors = {
  background: string;
  backgroundActive: string;
  border: string;
  borderActive: string;
  title: string;
  muted: string;
};

/** Stable pastel HSL colors for note cards (light mode). */
export function getNoteCardColors(noteId: string): NoteCardColors {
  const hash = hashString(noteId);
  const hue = hash % 360;
  const saturation = 58 + (hash % 28);
  const lightness = 86 + (hash % 8);

  const background = `hsl(${hue} ${saturation}% ${lightness}%)`;
  const backgroundActive = `hsl(${hue} ${Math.min(saturation + 6, 90)}% ${lightness - 6}%)`;
  const border = `hsl(${hue} ${saturation - 10}% ${lightness - 16}%)`;
  const borderActive = `hsl(${hue} ${saturation}% ${lightness - 10}%)`;
  const title = `hsl(${hue} 32% 16%)`;
  const muted = `hsl(${hue} 22% 34%)`;

  return {
    background,
    backgroundActive,
    border,
    borderActive,
    title,
    muted,
  };
}
