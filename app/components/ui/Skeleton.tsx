import { cardClass } from "@/lib/ui/styles";

type SkeletonProps = {
  className?: string;
};

export function Skeleton({ className = "" }: SkeletonProps) {
  return <div className={`skeleton ${className}`} aria-hidden />;
}

export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <div className="flex flex-col gap-2.5">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={`h-3 rounded-md ${i === lines - 1 ? "w-[72%]" : "w-full"}`}
        />
      ))}
    </div>
  );
}

export function SkeletonQuiz() {
  return (
    <div className="flex flex-col gap-4 pb-2">
      {[0, 1].map((i) => (
        <div key={i} className={`${cardClass} flex flex-col gap-4`}>
          <Skeleton className="h-4 w-[88%] rounded-md" />
          <div className="flex flex-col gap-2">
            {[0, 1, 2, 3].map((j) => (
              <Skeleton key={j} className="h-10 w-full rounded-lg" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonSummary() {
  return (
    <div className="flex flex-col gap-4 pb-2">
      {[0, 1, 2].map((i) => (
        <div key={i} className={`${cardClass} flex flex-col gap-3`}>
          <Skeleton className="h-2.5 w-20 rounded-md" />
          <SkeletonText lines={i === 1 ? 4 : 3} />
        </div>
      ))}
    </div>
  );
}

export function SkeletonChatHistory() {
  return (
    <div className="flex w-full flex-col gap-4 py-2">
      <div className="flex justify-end">
        <Skeleton className="h-12 w-[58%] rounded-xl rounded-br-sm" />
      </div>
      <div className="flex justify-start gap-2">
        <Skeleton className="h-5 w-5 shrink-0 rounded-full" />
        <Skeleton className="h-20 w-[72%] rounded-xl rounded-bl-sm" />
      </div>
      <div className="flex justify-end">
        <Skeleton className="h-10 w-[48%] rounded-xl rounded-br-sm" />
      </div>
      <div className="flex justify-start gap-2">
        <Skeleton className="h-5 w-5 shrink-0 rounded-full" />
        <Skeleton className="h-28 w-[78%] rounded-xl rounded-bl-sm" />
      </div>
    </div>
  );
}

export function SkeletonNoteGrid({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-2 md:grid-cols-1 lg:grid-cols-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`${cardClass} flex min-h-[88px] flex-col gap-2`}>
          <Skeleton className="h-3.5 w-[55%] rounded-md" />
          <Skeleton className="h-2.5 w-full rounded-md" />
          <Skeleton className="h-2.5 w-[80%] rounded-md" />
          <Skeleton className="mt-auto h-2 w-16 rounded-md" />
        </div>
      ))}
    </div>
  );
}
