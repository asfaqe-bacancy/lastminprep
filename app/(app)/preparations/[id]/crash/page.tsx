import { CrashBoard } from "@/components/preparation/crash-board";
import { GenerateButton } from "@/components/common/generate-button";
import { Timer } from "@/components/preparation/timer";
import { loadPreparationPage } from "@/lib/page-data";
import { countChunks } from "@/lib/data/chunks";
import { formatMinutes, typeLabel } from "@/lib/format";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export const metadata = { title: "Crash prep" };

export default async function CrashPage(
  props: PageProps<"/preparations/[id]/crash">,
) {
  const { id } = await props.params;
  const { preparation } = await loadPreparationPage(id);

  return (
    <>
      <header className="mb-9">
        <Link
          href={`/preparations/${id}`}
          className="text-muted-foreground hover:text-foreground -ml-1.5 inline-flex items-center gap-1 rounded-tight py-1 pr-2 pl-1 text-[0.8125rem] transition-colors"
        >
          <ChevronLeft className="size-3.5" aria-hidden />
          {preparation.title}
        </Link>

        <div className="mt-4 flex items-start justify-between gap-4">
          <div>
            <p className="eyebrow">
              {typeLabel(preparation.type)} · crash prep
            </p>
            <h1 className="numeral mt-3 text-[3rem] leading-none sm:text-[3.75rem]">
              {formatMinutes(preparation.availableMinutes)}
            </h1>
            <p className="text-muted-foreground mt-2 text-[0.9375rem]">
              Here&rsquo;s what matters most.
            </p>
          </div>
          <Timer
            availableMinutes={preparation.availableMinutes}
            startedAt={preparation.startedAt}
            className="shrink-0 pt-1"
          />
        </div>
      </header>

      {preparation.crashBoard ? (
        <>
          <CrashBoard board={preparation.crashBoard} preparationId={id} />
          <div className="mt-10 border-t pt-7">
            <GenerateButton
              endpoint={`/api/preparations/${id}/crash`}
              label="Triage it again"
              workingLabel="Re-sorting"
              variant="quiet"
            />
          </div>
        </>
      ) : (
        <CrashPrompt id={id} minutes={preparation.availableMinutes} />
      )}
    </>
  );
}

async function CrashPrompt({ id, minutes }: { id: string; minutes: number }) {
  const chunks = await countChunks(id);

  return (
    <div>
      <p className="text-muted-foreground max-w-prose text-[0.9375rem] leading-relaxed">
        {chunks > 0
          ? `We'll sort your material into what you can't walk in without, what's worth the time if it's there, and what to skip — sized to ${formatMinutes(minutes)}.`
          : "There's no processed material to triage yet. Upload a PDF first."}
      </p>
      {chunks > 0 && (
        <GenerateButton
          className="mt-7"
          endpoint={`/api/preparations/${id}/crash`}
          label="Triage my material"
          workingLabel="Working out the priorities"
          note="Deciding what actually fits in the time you have…"
        />
      )}
    </div>
  );
}
