import { SessionHeader } from "@/components/preparation/session-header";
import { InterviewStage } from "@/components/interview/interview-stage";
import { loadPreparationPage } from "@/lib/page-data";
import { getSession, listMessages } from "@/lib/data/interview";

export const metadata = { title: "Mock interview" };

export default async function InterviewPage(
  props: PageProps<"/preparations/[id]/interview">,
) {
  const { id } = await props.params;
  const { preparation } = await loadPreparationPage(id);

  const session = await getSession(id);
  const messages = session ? await listMessages(session.id) : [];

  return (
    <>
      <SessionHeader preparation={preparation} current="interview" />
      <InterviewStage
        preparationId={id}
        initialMessages={messages}
        initialReport={session?.report ?? null}
        // Resume straight back in, but never start one unasked.
        autoStart={messages.length > 0 && session?.status === "active"}
      />
    </>
  );
}
