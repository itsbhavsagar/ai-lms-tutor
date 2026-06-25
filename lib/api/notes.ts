import { apiGet, apiPost } from "./client";

type NoteResponse = {
  note: { id: string; content: string } | null;
};

type SaveNoteResponse = {
  note: { id: string; content: string };
};

export function fetchNotes(userId: string, lessonId: string) {
  return apiGet<NoteResponse>(
    `/api/notes?userId=${userId}&lessonId=${lessonId}`,
    "Failed to load notes",
  );
}

export function saveNote(userId: string, lessonId: string, content: string) {
  return apiPost<SaveNoteResponse>(
    "/api/notes",
    { userId, lessonId, content },
    "Failed to save notes",
  );
}
