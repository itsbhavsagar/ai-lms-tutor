export async function fetchQuiz(userId: string, lessonId: string) {
  const res = await fetch(`/api/quiz?userId=${userId}&lessonId=${lessonId}`);

  if (!res.ok) {
    throw new Error("Failed to fetch quiz");
  }

  return res.json();
}

export async function generateQuiz(payload: {
  lessonContent: string;
  lessonTitle: string;
  userId: string;
  lessonId: string;
}) {
  const res = await fetch("/api/quiz", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error("Failed to generate quiz");
  }

  return res.json();
}

export async function submitQuiz(payload: {
  quizId: string;
  score: number;
  total: number;
}) {
  const res = await fetch("/api/quiz/submit", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error("Failed to submit quiz");
  }

  return res.json();
}
