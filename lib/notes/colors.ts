const NOTE_PALETTE_COUNT = 8;

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/** Stable palette index for note cards — colors live in globals.css. */
export function getNotePaletteIndex(noteId: string): number {
  return hashString(noteId) % NOTE_PALETTE_COUNT;
}
