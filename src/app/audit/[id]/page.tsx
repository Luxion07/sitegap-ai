import { notFound } from "next/navigation"
import { DownloadIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { findAuditById } from "@/modules/audit/audit.repository"
import { BUSINESS_TYPE_LABELS } from "@/modules/audit/business-type-labels"
import { SiteHeader } from "@/components/site-header"
import { ReportView } from "@/components/report-view"
import type { Report } from "@/modules/ai/schemas"
import { CopyButton } from "@/components/copy-button"
import { AuditStatusPoller } from "@/components/audit-status-poller"
import { buttonVariants } from "@/components/ui/button"

export const metadata = {
  title: "Your audit report",
  // Each report is reachable by a direct link but contains someone else's
  // website content — never something we want a crawler to index.
  robots: { index: false, follow: false },
}

const PROCESSING_STEPS = [
  "Reading page content",
  "Evaluating clarity signals",
  "Identifying content gaps",
]

// Fixed locale so the server-rendered date doesn't depend on the host's locale.
const REPORT_DATE = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" })

export default async function AuditPage(props: PageProps<"/audit/[id]">) {
  const { id } = await props.params
  const audit = await findAuditById(id)

  if (!audit) notFound()

  const isReady = audit.status === "READY" && Boolean(audit.reportJson)

  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />
      {/* Center the short spinner/error states; a long report reads from the top. */}
      <main
        className={cn(
          "flex flex-1 flex-col items-center px-6 py-16",
          !isReady && "justify-center"
        )}
      >
        {audit.status === "PROCESSING" && (
          <>
            <AuditStatusPoller auditId={audit.id} />
            <div className="mb-7 size-14 animate-spin rounded-full border-[3px] border-white/10 border-t-primary" />
            <h2 className="mb-2.5 text-2xl font-semibold tracking-tight">
              We&apos;re analyzing your site...
            </h2>
            <p className="mb-9 max-w-[420px] text-center text-[15px] text-muted-foreground">
              Checking clarity, FAQ coverage, and content gaps for{" "}
              {audit.websiteUrl}
            </p>
            <div className="flex flex-col items-start gap-3">
              {PROCESSING_STEPS.map((step, index) => (
                <div
                  key={step}
                  className="flex items-center gap-2.5 text-[13.5px] text-muted-foreground"
                >
                  <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-primary/15">
                    <span
                      className="size-1.5 animate-dot-pulse rounded-full bg-primary"
                      style={{ animationDelay: `${index * 650}ms` }}
                    />
                  </span>
                  {step}
                </div>
              ))}
            </div>
          </>
        )}

        {isReady && (
          <div className="w-full max-w-2xl">
            <header className="mb-6">
              <p className="mb-1.5 text-[12.5px] font-medium tracking-wide text-primary uppercase">
                Audit report
              </p>
              <h1 className="text-2xl font-semibold tracking-tight break-all sm:text-3xl">
                {new URL(audit.websiteUrl).host}
              </h1>
              <p className="mt-1.5 text-[13.5px] text-muted-foreground">
                {BUSINESS_TYPE_LABELS[audit.businessType]} ·{" "}
                {REPORT_DATE.format(audit.createdAt)}
              </p>
            </header>

            <div className="mb-8 flex flex-wrap gap-2">
              <a
                href={`/api/audits/${audit.id}/download.md`}
                className={buttonVariants()}
              >
                <DownloadIcon />
                Markdown report
              </a>
              {audit.markdownReport && (
                <CopyButton
                  text={audit.markdownReport}
                  label="Copy Markdown"
                  variant="outline"
                />
              )}
              <a
                href={`/api/audits/${audit.id}/faq.html`}
                className={buttonVariants({ variant: "outline" })}
              >
                <DownloadIcon />
                FAQ HTML block
              </a>
              {audit.htmlFaqBlock && (
                <CopyButton
                  text={audit.htmlFaqBlock}
                  label="Copy HTML"
                  variant="outline"
                />
              )}
            </div>

            <ReportView report={audit.reportJson as Report} />
          </div>
        )}

        {audit.status === "FAILED" && (
          <>
            <p className="text-[15px] text-muted-foreground">
              Analysis failed for {audit.websiteUrl}.
            </p>
            {audit.statusMessage && (
              <p className="mt-2 text-[13.5px] text-muted-foreground">
                {audit.statusMessage}
              </p>
            )}
          </>
        )}
      </main>
    </div>
  )
}
