import { getRevisionTarget } from "@/lib/curriculum/knowledge-graph";

export function getGraphRevisionHint(
  lessonId: string,
  weakConcept: string,
): string | null {
  const target = getRevisionTarget(lessonId, weakConcept);
  if (!target) return null;
  if (target.lessonId) {
    return `Consider revisiting prerequisite topic: ${target.concept}`;
  }
  return `Review upstream concept first: ${target.concept}`;
}
