export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export function validateChatRequest(body: unknown): {
  message: string;
  sessionId: string;
} {
  if (!body || typeof body !== "object") {
    throw new ValidationError("Request body must be an object");
  }

  const { message, sessionId } = body as Record<string, unknown>;

  if (typeof message !== "string" || message.trim().length === 0) {
    throw new ValidationError("Message must be a non-empty string");
  }

  if (typeof sessionId !== "string" || sessionId.trim().length === 0) {
    throw new ValidationError("SessionId must be a non-empty string");
  }

  if (message.length > 4000) {
    throw new ValidationError("Message must be less than 4000 characters");
  }

  return {
    message: message.trim(),
    sessionId: sessionId.trim(),
  };
}

export function validatePdfUpload(formData: FormData): {
  file: File;
  userId: string;
  lessonId: string;
} {
  const file = formData.get("file");
  const userId = formData.get("userId");
  const lessonId = formData.get("lessonId");

  if (!(file instanceof File)) {
    throw new ValidationError("File must be provided");
  }

  if (!file.type.includes("pdf")) {
    throw new ValidationError("File must be a PDF");
  }

  if (file.size > 50 * 1024 * 1024) {
    // 50MB limit
    throw new ValidationError("File must be smaller than 50MB");
  }

  if (typeof userId !== "string" || userId.trim().length === 0) {
    throw new ValidationError("UserId must be provided");
  }

  if (typeof lessonId !== "string" || lessonId.trim().length === 0) {
    throw new ValidationError("LessonId must be provided");
  }

  return {
    file,
    userId: userId.trim(),
    lessonId: lessonId.trim(),
  };
}

export function validateSessionRequest(body: unknown): {
  userId: string;
  lessonId: string;
  title?: string;
} {
  if (!body || typeof body !== "object") {
    throw new ValidationError("Request body must be an object");
  }

  const { userId, lessonId, title } = body as Record<string, unknown>;

  if (typeof userId !== "string" || userId.trim().length === 0) {
    throw new ValidationError("UserId must be a non-empty string");
  }

  if (typeof lessonId !== "string" || lessonId.trim().length === 0) {
    throw new ValidationError("LessonId must be a non-empty string");
  }

  if (title !== undefined && typeof title !== "string") {
    throw new ValidationError("Title must be a string if provided");
  }

  return {
    userId: userId.trim(),
    lessonId: lessonId.trim(),
    title: title ? String(title).trim() : undefined,
  };
}
