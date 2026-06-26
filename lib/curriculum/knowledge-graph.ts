type KnowledgeNode = {
  lessonId: string;
  conceptChain: string[];
  prerequisiteLessonIds: string[];
};

/** Concept chains — weaker downstream concepts imply revisiting upstream lessons. */
const KNOWLEDGE_NODES: Record<string, KnowledgeNode> = {
  "prompt-engineering": {
    lessonId: "prompt-engineering",
    conceptChain: ["LLMs", "Prompts", "Few-shot", "Chain-of-thought", "Guardrails"],
    prerequisiteLessonIds: [],
  },
  rag: {
    lessonId: "rag",
    conceptChain: ["Embeddings", "Retrieval", "Chunking", "RAG pipeline", "Citations"],
    prerequisiteLessonIds: ["embeddings"],
  },
  embeddings: {
    lessonId: "embeddings",
    conceptChain: ["Vectors", "Similarity", "Embeddings", "ANN indexes"],
    prerequisiteLessonIds: [],
  },
  "ai-agents": {
    lessonId: "ai-agents",
    conceptChain: ["Tool calling", "Agent loops", "Memory", "Guardrails"],
    prerequisiteLessonIds: ["prompt-engineering"],
  },
  "react-fundamentals": {
    lessonId: "react-fundamentals",
    conceptChain: ["JavaScript", "Components", "State", "Hooks", "Reconciliation"],
    prerequisiteLessonIds: [],
  },
  "nextjs-app-router": {
    lessonId: "nextjs-app-router",
    conceptChain: ["React", "Server Components", "Routing", "Server Actions"],
    prerequisiteLessonIds: ["react-fundamentals"],
  },
  "tanstack-query": {
    lessonId: "tanstack-query",
    conceptChain: ["React", "Server state", "Caching", "Mutations"],
    prerequisiteLessonIds: ["react-fundamentals"],
  },
  "react-performance": {
    lessonId: "react-performance",
    conceptChain: ["React", "Hooks", "Rendering", "Performance", "React.memo"],
    prerequisiteLessonIds: ["react-fundamentals"],
  },
  "rest-api-design": {
    lessonId: "rest-api-design",
    conceptChain: ["HTTP", "REST", "Pagination", "API contracts"],
    prerequisiteLessonIds: [],
  },
  authentication: {
    lessonId: "authentication",
    conceptChain: ["HTTP", "Sessions", "JWT", "OAuth"],
    prerequisiteLessonIds: ["rest-api-design"],
  },
  postgresql: {
    lessonId: "postgresql",
    conceptChain: ["SQL", "Indexes", "Query plans", "Scaling reads"],
    prerequisiteLessonIds: [],
  },
  "system-design-fundamentals": {
    lessonId: "system-design-fundamentals",
    conceptChain: ["Scaling", "Caching", "Load balancing", "Reliability"],
    prerequisiteLessonIds: ["rest-api-design"],
  },
  observability: {
    lessonId: "observability",
    conceptChain: ["Logs", "Metrics", "Traces", "SLOs"],
    prerequisiteLessonIds: ["system-design-fundamentals"],
  },
};

export function getKnowledgeNode(lessonId: string): KnowledgeNode | undefined {
  return KNOWLEDGE_NODES[lessonId];
}

/** If struggling with a concept, find upstream concept or prerequisite lesson. */
export function getRevisionTarget(
  lessonId: string,
  weakConcept: string,
): { concept: string; lessonId?: string } | null {
  const node = KNOWLEDGE_NODES[lessonId];
  if (!node) return null;

  const lower = weakConcept.toLowerCase();
  const chainIndex = node.conceptChain.findIndex(
    (c) =>
      c.toLowerCase().includes(lower) || lower.includes(c.toLowerCase()),
  );

  if (chainIndex > 0) {
    return { concept: node.conceptChain[chainIndex - 1] };
  }

  if (node.prerequisiteLessonIds.length > 0) {
    return {
      concept: node.conceptChain[0],
      lessonId: node.prerequisiteLessonIds[0],
    };
  }

  return null;
}
