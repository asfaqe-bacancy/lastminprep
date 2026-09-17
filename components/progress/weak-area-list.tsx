import type { TopicPerformance } from "@/types";
import { Meter } from "@/components/progress/meter";
import { ordinal } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Editorial layout, not a traffic light. Typography carries the ranking
 * (design-system section 14).
 */
export function WeakAreaList({
  topics,
  className,
}: {
  topics: TopicPerformance[];
  className?: string;
}) {
  return (
    <ol className={cn("divide-y", className)}>
      {topics.map((topic, index) => (
        <li key={topic.name} className="flex gap-3 py-4">
          <span className="text-muted-foreground numeral w-7 shrink-0 pt-0.5 text-[0.8125rem]">
            {ordinal(index)}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-[0.9375rem] font-medium">{topic.name}</p>
              <p className="text-muted-foreground numeral text-[0.8125rem]">
                {topic.score}%
              </p>
            </div>
            <p className="text-muted-foreground mt-0.5 text-[0.8125rem]">
              {topic.note}
              {topic.questionsAnswered > 0 && (
                <>
                  {" · "}
                  {topic.questionsCorrect} of {topic.questionsAnswered} right
                </>
              )}
            </p>
            <Meter
              value={topic.score}
              tone={topic.score < 70 ? "brand" : "neutral"}
              className="mt-2.5"
            />
          </div>
        </li>
      ))}
    </ol>
  );
}
