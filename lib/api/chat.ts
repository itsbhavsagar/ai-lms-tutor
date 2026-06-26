import type { ChatMessage } from "@/app/types/chat";
import { ApiError, apiPostForm, apiStreamPost, readTextStream } from "./client";
import { createSession } from "./sessions";

type TranscribeResponse = {
  text: string;
};

export function streamLessonChat(
  sessionId: string,
  messages: ChatMessage[],
  lessonId: string,
  userId: string,
) {
  return apiStreamPost(
    "/api/chat",
    { messages, sessionId, lessonId, userId },
    "Chat failed",
  );
}

export function streamDemoChat(messages: ChatMessage[]) {
  return apiStreamPost("/api/demo-chat", { messages }, "Chat failed");
}

export function streamInterviewChat(
  messages: ChatMessage[],
  lessonId: string,
  userId: string,
) {
  return apiStreamPost(
    "/api/interview",
    { messages, lessonId, userId },
    "Interview failed",
  );
}

export function transcribeRecording(blob: Blob) {
  const formData = new FormData();
  const ext = blob.type.includes("mp4")
    ? "mp4"
    : blob.type.includes("wav")
      ? "wav"
      : blob.type.includes("ogg")
        ? "ogg"
        : "webm";
  formData.append("audio", blob, `recording.${ext}`);
  return apiPostForm<TranscribeResponse>(
    "/api/transcribe",
    formData,
    "Transcription failed",
  );
}

export async function streamLessonChatWithRetry(params: {
  sessionId: string;
  messages: ChatMessage[];
  lessonId: string;
  lessonTitle: string;
  userId: string;
  onChunk: (text: string) => void;
  onSessionId: (id: string) => void;
}): Promise<string> {
  const run = async (sessionId: string) => {
    const response = await streamLessonChat(
      sessionId,
      params.messages,
      params.lessonId,
      params.userId,
    );
    await readTextStream(response, params.onChunk);
    return sessionId;
  };

  try {
    return await run(params.sessionId);
  } catch (error) {
    if (!(error instanceof ApiError && error.status === 404)) throw error;

    const { session } = await createSession(
      params.userId,
      params.lessonId,
      params.lessonTitle,
    );
    params.onSessionId(session.id);
    return run(session.id);
  }
}
