import { apiDelete, apiGet, apiPatch, apiPost } from "./client";

export type NoteItem = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
};

type NotesListResponse = {
  notes: NoteItem[];
};

type NoteResponse = {
  note: NoteItem;
};

export function fetchNotes(userId: string, lessonId: string) {
  return apiGet<NotesListResponse>(
    `/api/notes?userId=${userId}&lessonId=${lessonId}`,
    "Failed to load notes",
  );
}

export function createNote(
  userId: string,
  lessonId: string,
  payload: { title?: string; content?: string },
) {
  return apiPost<NoteResponse>(
    "/api/notes",
    { userId, lessonId, ...payload },
    "Failed to create note",
  );
}

export function updateNote(
  noteId: string,
  payload: { title: string; content: string },
) {
  return apiPatch<NoteResponse>(
    "/api/notes",
    { noteId, ...payload },
    "Failed to save note",
  );
}

export function deleteNote(noteId: string) {
  return apiDelete<{ success: boolean }>(
    `/api/notes?noteId=${noteId}`,
    "Failed to delete note",
  );
}

export { deriveNoteTitle } from "@/lib/notes/title";

export function notePreview(content: string, maxLength = 100): string {
  const flat = content.replace(/\s+/g, " ").trim();
  if (!flat) return "No additional text";
  return flat.length > maxLength ? `${flat.slice(0, maxLength)}…` : flat;
}

export function formatNoteDate(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}
