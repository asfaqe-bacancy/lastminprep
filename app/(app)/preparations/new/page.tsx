import { NewPreparationFlow } from "@/components/preparation/new-preparation-flow";
import type { PreparationType } from "@/types";
import { requireUser } from "@/lib/data/auth";

export const metadata = { title: "New preparation" };

export default async function NewPreparationPage(
  props: PageProps<"/preparations/new">,
) {
  await requireUser();
  const params = await props.searchParams;
  const raw = Array.isArray(params.type) ? params.type[0] : params.type;
  const initialType: PreparationType | null =
    raw === "exam" || raw === "interview" ? raw : null;

  return <NewPreparationFlow initialType={initialType} />;
}
