import { SessionHeader } from "@/components/preparation/session-header";
import { QuizRunner } from "@/components/quiz/quiz-runner";
import { loadPreparationPage } from "@/lib/page-data";
import { listQuestions, listResults } from "@/lib/data/quiz";

export const metadata = { title: "Quick check" };

export default async function QuizPage(
  props: PageProps<"/preparations/[id]/quiz">,
) {
  const { id } = await props.params;
  const { preparation } = await loadPreparationPage(id);

  const [questions, results] = await Promise.all([
    listQuestions(id),
    listResults(id),
  ]);

  return (
    <>
      <SessionHeader preparation={preparation} current="quiz" />
      <QuizRunner
        preparationId={id}
        initialQuestions={questions}
        initialResults={results}
      />
    </>
  );
}
