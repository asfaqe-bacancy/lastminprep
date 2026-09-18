import type { FinalRevision } from "@/types";
import { SourceReference } from "@/components/sources/source-reference";
import { ordinal } from "@/lib/format";

/**
 * The final review: the last thing read before walking in, and the screen most
 * worth screenshotting (design-system section 15). Large numerals, short
 * lines, nothing decorative.
 */
export function RevisionCard({ revision }: { revision: FinalRevision }) {
  const sources = revision.mustRemember
    .map((point) => point.source)
    .filter((source): source is NonNullable<typeof source> => source !== null);

  const unique = [
    ...new Map(sources.map((source) => [source.chunkId, source])).values(),
  ];

  return (
    <div className="animate-rise">
      <section className="mb-12">
        <h2 className="text-[1.25rem] leading-snug font-medium sm:text-[1.5rem]">
          {revision.headline}
        </h2>

        <ol className="mt-8 space-y-7">
          {revision.mustRemember.map((point, index) => (
            <li key={index} className="flex gap-4 sm:gap-6">
              <span className="text-muted-foreground numeral w-8 shrink-0 pt-1 text-[0.9375rem] sm:text-[1.0625rem]">
                {ordinal(index)}
              </span>
              <p className="max-w-[46ch] text-[1.0625rem] leading-[1.55] sm:text-[1.1875rem]">
                {point.text}
              </p>
            </li>
          ))}
        </ol>
      </section>

      {revision.concepts.length > 0 && (
        <section className="mb-11 border-t pt-9">
          <h2 className="eyebrow mb-5">Important concepts</h2>
          <dl className="divide-y">
            {revision.concepts.map((concept) => (
              <div key={concept.title} className="py-4 first:pt-0">
                <dt className="text-[0.9375rem] font-medium">{concept.title}</dt>
                <dd className="text-muted-foreground mt-1 max-w-prose text-[0.9375rem] leading-relaxed">
                  {concept.body}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {revision.commonQuestions.length > 0 && (
        <section className="mb-11 border-t pt-9">
          <h2 className="eyebrow mb-5">Questions you&rsquo;re likely to get</h2>
          <ul className="space-y-6">
            {revision.commonQuestions.map((entry) => (
              <li key={entry.question}>
                <p className="text-[0.9375rem] font-medium">{entry.question}</p>
                <p className="text-muted-foreground mt-1.5 max-w-prose text-[0.9375rem] leading-relaxed">
                  {entry.answer}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {revision.weakAreas.length > 0 && (
        <section className="mb-9 border-t pt-9">
          <h2 className="eyebrow mb-4">Still your weakest</h2>
          <p className="text-[1.0625rem] leading-relaxed">
            {revision.weakAreas.join(" · ")}
          </p>
        </section>
      )}

      {unique.length > 0 && (
        <div className="border-t pt-6">
          <SourceReference sources={unique} className="mt-0" />
        </div>
      )}
    </div>
  );
}
