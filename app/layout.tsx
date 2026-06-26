import type { Metadata, Viewport } from "next";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import Providers from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "MentorAI",
  description:
    "AI-powered learning studio with mentor chat, quizzes, summaries, notes, and RAG",
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
    <html
      lang="en"
      className={`h-full ${GeistSans.variable} ${GeistMono.variable}`}
      suppressHydrationWarning
    >
      <body
        className={`${GeistSans.className} h-dvh overflow-hidden antialiased`}
        suppressHydrationWarning
      >
        <Providers>
          <div className="flex h-dvh w-full min-w-0">{children}</div>
        </Providers>
      </body>
    </html>
  );
}
