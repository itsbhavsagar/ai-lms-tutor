import {
  User,
  ChatSession,
  Document,
  DocumentChunk,
  ChatMessage,
} from "./schema";

export interface IDatabase {
  // User operations
  getUser(userId: string): Promise<User | null>;
  createUser(email: string): Promise<User>;

  // Session operations
  getSession(sessionId: string): Promise<ChatSession | null>;
  createSession(
    userId: string,
    lessonId: string,
    title?: string,
  ): Promise<ChatSession>;
  updateSession(session: ChatSession): Promise<void>;
  getUserSessions(userId: string): Promise<ChatSession[]>;
  deleteSession(sessionId: string): Promise<void>;

  // Document operations
  getDocument(documentId: string): Promise<Document | null>;
  createDocument(
    userId: string,
    lessonId: string,
    fileName: string,
    chunks: DocumentChunk[],
  ): Promise<Document>;
  getUserDocuments(userId: string): Promise<Document[]>;
  getDocumentsByLesson(userId: string, lessonId: string): Promise<Document[]>;

  // Chunk retrieval (for RAG)
  getDocumentChunks(documentId: string): Promise<DocumentChunk[]>;
}

/**
 * Mock in-memory database
 * Perfect for development; swap with real DB service in production
 */
class MockDatabase implements IDatabase {
  private users = new Map<string, User>();
  private sessions = new Map<string, ChatSession>();
  private documents = new Map<string, Document>();

  async getUser(userId: string): Promise<User | null> {
    return this.users.get(userId) || null;
  }

  async createUser(email: string): Promise<User> {
    const user: User = {
      id: `user_${Date.now()}`,
      email,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(user.id, user);
    return user;
  }

  async getSession(sessionId: string): Promise<ChatSession | null> {
    return this.sessions.get(sessionId) || null;
  }

  async createSession(
    userId: string,
    lessonId: string,
    title = "New Chat",
  ): Promise<ChatSession> {
    const session: ChatSession = {
      id: `session_${Date.now()}`,
      userId,
      lessonId,
      title,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      tokenCount: 0,
    };
    this.sessions.set(session.id, session);
    return session;
  }

  async updateSession(session: ChatSession): Promise<void> {
    session.updatedAt = new Date();
    this.sessions.set(session.id, session);
  }

  async getUserSessions(userId: string): Promise<ChatSession[]> {
    return Array.from(this.sessions.values()).filter(
      (s) => s.userId === userId,
    );
  }

  async deleteSession(sessionId: string): Promise<void> {
    this.sessions.delete(sessionId);
  }

  async createDocument(
    userId: string,
    lessonId: string,
    fileName: string,
    chunks: DocumentChunk[],
  ): Promise<Document> {
    const doc: Document = {
      id: `doc_${Date.now()}`,
      userId,
      lessonId,
      fileName,
      chunks,
      createdAt: new Date(),
      updatedAt: new Date(),
      totalChunks: chunks.length,
    };
    this.documents.set(doc.id, doc);
    return doc;
  }

  async getDocument(documentId: string): Promise<Document | null> {
    return this.documents.get(documentId) || null;
  }

  async getUserDocuments(userId: string): Promise<Document[]> {
    return Array.from(this.documents.values()).filter(
      (d) => d.userId === userId,
    );
  }

  async getDocumentsByLesson(
    userId: string,
    lessonId: string,
  ): Promise<Document[]> {
    return Array.from(this.documents.values()).filter(
      (d) => d.userId === userId && d.lessonId === lessonId,
    );
  }

  async getDocumentChunks(documentId: string): Promise<DocumentChunk[]> {
    const doc = await this.getDocument(documentId);
    return doc?.chunks || [];
  }
}

// Singleton instance
const db = new MockDatabase();

export default db;
