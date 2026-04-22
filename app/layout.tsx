import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI LMS Tutor",
  description:
    "AI-powered learning platform with RAG, quizzes, summaries and voice input",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="h-dvh overflow-hidden antialiased">
        <div className="flex h-dvh w-full min-w-0">{children}</div>
      </body>
    </html>
  );
}
