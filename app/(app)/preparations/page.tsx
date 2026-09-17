import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader, SectionHeading } from "@/components/common/page-header";
import { DemoNotice } from "@/components/common/demo-notice";
import { EmptyState } from "@/components/common/empty-state";
import { PreparationRow } from "@/components/preparation/preparation-row";
import { listPreparations } from "@/lib/data/preparations";
import { requireUser } from "@/lib/data/auth";
import { isDemoMode } from "@/lib/env";

export const metadata = { title: "Preparations" };

export default async function PreparationsPage() {
  await requireUser();
  const preparations = await listPreparations();

  const open = preparations.filter((prep) => prep.status !== "completed");
  const done = preparations.filter((prep) => prep.status === "completed");

  return (
    <>
      {isDemoMode() && <DemoNotice />}

      <PageHeader
        title="Preparations"
        description="Everything you've set up, newest first."
        action={
          <Link
            href="/preparations/new"
            className="press bg-brand text-brand-foreground rounded-tight inline-flex h-10 items-center gap-1.5 px-4 text-sm font-medium shadow-soft"
          >
            <Plus className="size-4" aria-hidden />
            New
          </Link>
        }
      />

      {preparations.length === 0 ? (
        <EmptyState
          title="No preparations yet."
          description="Your first one takes less than a minute to set up."
          action={{ href: "/preparations/new", label: "Start preparing" }}
        />
      ) : (
        <>
          {open.length > 0 && (
            <section className="mb-10">
              <SectionHeading>In progress</SectionHeading>
              <div className="divide-y">
                {open.map((preparation) => (
                  <PreparationRow
                    key={preparation.id}
                    preparation={preparation}
                  />
                ))}
              </div>
            </section>
          )}

          {done.length > 0 && (
            <section>
              <SectionHeading>Completed</SectionHeading>
              <div className="divide-y">
                {done.map((preparation) => (
                  <PreparationRow
                    key={preparation.id}
                    preparation={preparation}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </>
  );
}
