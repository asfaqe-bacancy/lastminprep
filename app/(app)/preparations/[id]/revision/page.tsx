import { SessionHeader } from "@/components/preparation/session-header";
import { RevisionCard } from "@/components/preparation/revision-card";
import { GenerateButton } from "@/components/common/generate-button";
import { loadPreparationPage } from "@/lib/page-data";
import { countChunks } from "@/lib/data/chunks";

export const metadata = { title: "Final review" };

export default async function RevisionPage(
  props: PageProps<"/preparations/[id]/revision">,
) {
  const { id } = await props.params;
  const { preparation } = await loadPreparationPage(id);

  if (preparation.revision) {
    return (
      <>
        <SessionHeader
          preparation={preparation}
          current="revision"
          title="Final review"
        />
        <RevisionCard revision={preparation.revision} />
        <div className="mt-10 border-t pt-7">
          <GenerateButton
            endpoint={`/api/preparations/${id}/revision`}
            label="Write it again"
            workingLabel="Rewriting"
            variant="quiet"
            note="Taking another pass over your material…"
          />
        </div>
      </>
    );
  }

  const chunks = await countChunks(id);

  return (
    <>
      <SessionHeader
        preparation={preparation}
        current="revision"
        title="Final review"
      />

      <p className="text-muted-foreground max-w-prose text-[0.9375rem] leading-relaxed">
        {chunks > 0
          ? "One page, pulled from your material and from whatever you struggled with. Written to be read in the two minutes before you walk in."
          : "There's no processed material to revise from yet. Upload a PDF first."}
      </p>

      {chunks > 0 && (
        <GenerateButton
          className="mt-7"
          endpoint={`/api/preparations/${id}/revision`}
          label="Write my final review"
          workingLabel="Pulling it together"
          note="Choosing the five things that matter most…"
        />
      )}
    </>
  );
}
