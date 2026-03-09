"use client";
import { useState } from "react";
import { Lesson } from "../data/lessons";

type Question = {
  question: string;
  options: string[];
  correct: number;
};

export default function QuizTab({ lesson }: { lesson: Lesson }) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);

  async function generateQuiz() {
    setLoading(true);
    setSelected({});
    setSubmitted(false);
    setQuestions([]);

    const res = await fetch("/api/quiz", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lessonContent: lesson.content,
        lessonTitle: lesson.title,
      }),
    });

    const data = await res.json();
    setQuestions(data.questions);
    setLoading(false);
  }

  function selectOption(qIndex: number, oIndex: number) {
    if (submitted) return;
    setSelected((prev) => ({ ...prev, [qIndex]: oIndex }));
  }

  function getScore() {
    return questions.filter((q, i) => selected[i] === q.correct).length;
  }

  return (
    <div className="flex flex-col flex-1 overflow-y-auto">
      {/* Generate Button */}
      <div className="mb-6">
        <button
          onClick={generateQuiz}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-3 rounded-lg text-sm font-medium transition-all"
        >
          {loading
            ? "Generating Quiz..."
            : questions.length > 0
              ? "🔄 Regenerate Quiz"
              : "✨ Generate Quiz"}
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-gray-400 text-sm animate-pulse">
          AI is generating your quiz...
        </div>
      )}

      {/* Questions */}
      {!loading && questions.length > 0 && (
        <div className="space-y-6">
          {questions.map((q, qIndex) => (
            <div
              key={qIndex}
              className="bg-gray-900 rounded-xl p-5 border border-gray-800"
            >
              <p className="text-sm font-semibold text-white mb-4">
                {qIndex + 1}. {q.question}
              </p>
              <div className="space-y-2">
                {q.options.map((option, oIndex) => {
                  const isSelected = selected[qIndex] === oIndex;
                  const isCorrect = q.correct === oIndex;

                  let style =
                    "bg-gray-800 text-gray-300 hover:bg-gray-700 border-gray-700";
                  if (submitted) {
                    if (isCorrect)
                      style = "bg-green-900 text-green-300 border-green-700";
                    else if (isSelected && !isCorrect)
                      style = "bg-red-900 text-red-300 border-red-700";
                    else style = "bg-gray-800 text-gray-500 border-gray-700";
                  } else if (isSelected) {
                    style = "bg-blue-700 text-white border-blue-500";
                  }

                  return (
                    <button
                      key={oIndex}
                      onClick={() => selectOption(qIndex, oIndex)}
                      className={`w-full text-left px-4 py-2 rounded-lg text-sm border transition-all ${style}`}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Submit / Score */}
          {!submitted ? (
            <button
              onClick={() => setSubmitted(true)}
              disabled={Object.keys(selected).length < questions.length}
              className="bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white px-6 py-3 rounded-lg text-sm font-medium transition-all"
            >
              Submit Quiz
            </button>
          ) : (
            <div className="bg-gray-900 border border-gray-700 rounded-xl p-5 text-center">
              <p className="text-2xl font-bold text-white mb-1">
                {getScore()} / {questions.length}
              </p>
              <p className="text-gray-400 text-sm">
                {getScore() === questions.length
                  ? "🎉 Perfect score!"
                  : getScore() >= questions.length / 2
                    ? "👍 Good job! Review the wrong answers."
                    : "📖 Study more and try again."}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
