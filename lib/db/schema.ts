/**
 * Database Schema Definitions
 * Type-safe schema for all domain models
 */

export interface User {
  id: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatSession {
  id: string;
  userId: string;
  lessonId: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
  tokenCount: number; // Track token usage
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  tokens?: number; // Optional: track tokens per message
}

export interface Document {
  id: string;
  userId: string;
  lessonId: string;
  fileName: string;
  chunks: DocumentChunk[];
  createdAt: Date;
  updatedAt: Date;
  totalChunks: number;
}

export interface DocumentChunk {
  id: string;
  text: string;
  embedding: number[];
  chunkIndex: number;
  metadata?: {
    pageNumber?: number;
    section?: string;
  };
}

export interface RagRetrieval {
  chunkText: string;
  score: number;
  source: string; // lesson ID or document name
}
