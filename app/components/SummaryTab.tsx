export default function SummaryTab({ lessonTitle }: { lessonTitle: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-gray-500">
      <p className="text-4xl mb-4">📄</p>
      <p className="text-lg font-medium text-gray-400">Summary coming soon</p>
      <p className="text-sm mt-1">for {lessonTitle}</p>
    </div>
  );
}
