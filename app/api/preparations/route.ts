import { requireApiUser } from "@/lib/data/auth";
import { createPreparation } from "@/lib/data/preparations";
import { derivePreparationTitle } from "@/lib/format";
import { handleRouteError } from "@/lib/api";
import {
  asRecord,
  requireGoal,
  requireMinutes,
  requirePreparationType,
  requireStringArray,
} from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const user = await requireApiUser();
    const body = asRecord(await request.json());

    const type = requirePreparationType(body.type);
    const goal = requireGoal(body.goal);
    const availableMinutes = requireMinutes(body.availableMinutes);
    const filenames = requireStringArray(body.filenames ?? [], "filenames");

    const preparation = await createPreparation({
      userId: user.id,
      title: derivePreparationTitle(type, filenames),
      type,
      goal,
      availableMinutes,
    });

    return Response.json({ id: preparation.id }, { status: 201 });
  } catch (cause) {
    return handleRouteError(cause, "POST /api/preparations");
  }
}
