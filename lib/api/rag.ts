import { apiPost, apiPostForm, apiStreamPost } from "./client";
import type { ChatMessage } from "@/app/types/chat";

type EmbedResponse = {
  chunksCreated: number;
};

type UploadPdfResponse = {
  chunksCreated: number;
  pages: number;
};

export function embedText(text: string, lessonId: string, userId: string) {
  return apiPost<EmbedResponse>(
    "/api/embed",
    { text, lessonId, userId },
    "Failed to index text",
  );
}

export function uploadPdf(file: File, lessonId: string, userId: string) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("lessonId", lessonId);
  formData.append("userId", userId);
  return apiPostForm<UploadPdfResponse>(
    "/api/upload-pdf",
    formData,
    "Failed to upload PDF",
  );
}

export function streamRagChat(
  messages: ChatMessage[],
  lessonId: string,
  userId: string,
) {
  return apiStreamPost(
    "/api/rag-chat",
    { messages, lessonId, userId },
    "RAG chat failed",
  );
}
