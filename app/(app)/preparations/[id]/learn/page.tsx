import { SessionHeader } from "@/components/preparation/session-header";
import { LearnMode } from "@/components/learn/learn-mode";
import { loadPreparationPage } from "@/lib/page-data";
import { listTopics } from "@/lib/data/preparations";

export const metadata = { title: "Learn" };

export default async function LearnPage(
  props: PageProps<"/preparations/[id]/learn">,
) {
  const { id } = await props.params;
  const { preparation } = await loadPreparationPage(id);
  const topics = await listTopics(id);

  return (
    <>
      <SessionHeader preparation={preparation} current="learn" />
      <LearnMode
        preparationId={id}
        topics={topics}
        minutes={preparation.availableMinutes}
      />
    </>
  );
}
