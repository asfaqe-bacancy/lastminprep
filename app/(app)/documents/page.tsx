import { PageHeader } from "@/components/common/page-header";
import { DemoNotice } from "@/components/common/demo-notice";
import { EmptyState } from "@/components/common/empty-state";
import { DocumentList } from "@/components/documents/document-list";
import { requireUser } from "@/lib/data/auth";
import { listDocuments } from "@/lib/data/documents";
import { isDemoMode } from "@/lib/env";

export const metadata = { title: "Documents" };

export default async function DocumentsPage() {
  await requireUser();
  const documents = await listDocuments();

  return (
    <>
      {isDemoMode() && <DemoNotice />}

      <PageHeader
        title="Documents"
        description="Everything you've uploaded. Each one is split into sections so answers can point back to the page they came from."
      />

      {documents.length === 0 ? (
        <EmptyState
          title="Nothing uploaded yet."
          description="Documents are added when you set up a preparation."
          action={{ href: "/preparations/new", label: "Start preparing" }}
        />
      ) : (
        <DocumentList documents={documents} />
      )}
    </>
  );
}
