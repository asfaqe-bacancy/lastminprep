import type { Topic } from "@/types";
import { PRIORITY_META } from "@/lib/constants";
import { formatMinutes, ordinal } from "@/lib/format";
import { cn } from "@/lib/utils";

export function TopicList({
  topics,
  showPriority = false,
  className,
}: {
  topics: Topic[];
  showPriority?: boolean;
  className?: string;
}) {
  return (
    <ol className={cn("divide-y", className)}>
      {topics.map((topic, index) => (
        <li key={topic.id} className="flex gap-3 py-3.5">
          <span className="text-muted-foreground numeral w-7 shrink-0 pt-0.5 text-[0.8125rem]">
            {ordinal(index)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[0.9375rem] font-medium">{topic.name}</p>
            {topic.summary && (
              <p className="text-muted-foreground mt-0.5 text-[0.8125rem] leading-relaxed">
                {topic.summary}
              </p>
            )}
            {showPriority && (
              <p className="text-muted-foreground mt-1 text-[0.75rem]">
                {PRIORITY_META[topic.priority].label}
              </p>
            )}
          </div>
          {topic.estimatedMinutes !== null && (
            <span className="numeral text-muted-foreground shrink-0 pt-0.5 text-[0.8125rem]">
              {formatMinutes(topic.estimatedMinutes)}
            </span>
          )}
        </li>
      ))}
    </ol>
  );
}
