import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI LMS Tutor",
  description:
    "AI-powered learning platform with RAG, quizzes, summaries and voice input",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="h-full overflow-hidden antialiased">
        <div className="flex h-full w-full">{children}</div>
      </body>
    </html>
  );
}
