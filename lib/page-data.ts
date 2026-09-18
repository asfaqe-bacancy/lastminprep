import "server-only";

import { notFound } from "next/navigation";
import type { Preparation } from "@/types";
import { requireUser, type CurrentUser } from "@/lib/data/auth";
import { getPreparation } from "@/lib/data/preparations";
import { isDemoMode } from "@/lib/env";

/**
 * Loads a preparation for a page, or renders not-found.
 *
 * A preparation that belongs to someone else is treated as missing rather than
 * forbidden, so the URL can't be used to confirm that it exists.
 */
export async function loadPreparationPage(id: string): Promise<{
  user: CurrentUser;
  preparation: Preparation;
}> {
  const user = await requireUser();
  const preparation = await getPreparation(id);

  if (!preparation) notFound();
  if (!isDemoMode() && preparation.userId !== user.id) notFound();

  return { user, preparation };
}
