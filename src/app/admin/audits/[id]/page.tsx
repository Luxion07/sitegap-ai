import { cookies } from "next/headers"
import { notFound, redirect } from "next/navigation"
import Link from "next/link"

import { SiteHeader } from "@/components/site-header"
import { DeleteAuditButton } from "@/components/admin/delete-audit-button"
import { MarkFailedButton } from "@/components/admin/mark-failed-button"
import { verifySessionToken } from "@/modules/admin/admin-session"
import { findAuditById } from "@/modules/audit/audit.repository"
import { BUSINESS_TYPE_LABELS } from "@/modules/audit/business-type-labels"

export const metadata = {
  title: "Audit detail — SiteGap AI",
  robots: { index: false, follow: false },
}

export default async function AdminAuditDetailPage(
  props: PageProps<"/admin/audits/[id]">
) {
  const cookieStore = await cookies()
  const token = cookieStore.get("admin_session")?.value
  const isAuthenticated = verifySessionToken(token)

  if (!isAuthenticated) {
    redirect("/admin")
  }

  const { id } = await props.params
  const audit = await findAuditById(id)

  if (!audit) notFound()

  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />
      <main className="flex flex-1 flex-col px-6 py-12">
        <div className="mx-auto w-full max-w-3xl">
          <Link
            href="/admin"
            className="mb-6 inline-block text-[13.5px] text-primary hover:underline"
          >
            ← Back to admin
          </Link>

          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-2xl font-semibold tracking-tight">
              Audit {audit.id}
            </h1>
            <div className="flex gap-2">
              {audit.status !== "FAILED" && (
                <MarkFailedButton auditId={audit.id} />
              )}
              <DeleteAuditButton auditId={audit.id} />
            </div>
          </div>

          <dl className="mb-8 grid grid-cols-[160px_1fr] gap-x-4 gap-y-3 text-[13.5px]">
            <dt className="text-muted-foreground">Website URL</dt>
            <dd>{audit.websiteUrl}</dd>

            <dt className="text-muted-foreground">Business type</dt>
            <dd>{BUSINESS_TYPE_LABELS[audit.businessType]}</dd>

            <dt className="text-muted-foreground">Status</dt>
            <dd>{audit.status}</dd>

            <dt className="text-muted-foreground">Extracted text length</dt>
            <dd>{audit.sourceText?.length ?? 0} characters</dd>

            {audit.status === "FAILED" && audit.statusMessage && (
              <>
                <dt className="text-muted-foreground">Error message</dt>
                <dd className="text-destructive">{audit.statusMessage}</dd>
              </>
            )}

            <dt className="text-muted-foreground">Created</dt>
            <dd>{audit.createdAt.toLocaleString()}</dd>

            <dt className="text-muted-foreground">Updated</dt>
            <dd>{audit.updatedAt.toLocaleString()}</dd>
          </dl>

          <div className="mb-8">
            <h2 className="mb-2 text-[15px] font-semibold">
              Preview report JSON
            </h2>
            <pre className="overflow-x-auto rounded-lg border border-border bg-card p-4 text-[12px]">
              {JSON.stringify(audit.previewJson, null, 2)}
            </pre>
          </div>

          <div>
            <h2 className="mb-2 text-[15px] font-semibold">Full report JSON</h2>
            <pre className="overflow-x-auto rounded-lg border border-border bg-card p-4 text-[12px]">
              {JSON.stringify(audit.reportJson, null, 2)}
            </pre>
          </div>
        </div>
      </main>
    </div>
  )
}
