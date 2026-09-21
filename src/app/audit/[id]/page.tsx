import { notFound } from "next/navigation"

import { findAuditById } from "@/modules/audit/audit.repository"
import { SiteHeader } from "@/components/site-header"
import { ReportView } from "@/components/report-view"
import type { Report } from "@/modules/ai/schemas"
import { CopyButton } from "@/components/copy-button"

const PROCESSING_STEPS = [
  "Reading page content",
  "Evaluating clarity signals",
  "Identifying content gaps",
]

export default async function AuditPage(props: PageProps<"/audit/[id]">) {
  const { id } = await props.params
  const audit = await findAuditById(id)

  if (!audit) notFound()

  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-16">
        <div className="mb-9 font-mono text-[12.5px] text-muted-foreground">
          sitegap.ai/audit/{audit.id}
        </div>

        {audit.status === "PROCESSING" && (
          <>
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

        {audit.status === "READY" && audit.reportJson && (
          <>
            <div className="mb-6 flex flex-wrap justify-center gap-x-8 gap-y-4">
              <div className="flex flex-col items-center gap-1">
                <a
                  href={`/api/audits/${audit.id}/download.md`}
                  className="text-[13.5px] text-primary hover:underline"
                >
                  Download Markdown report
                </a>
                {audit.markdownReport && (
                  <CopyButton
                    text={audit.markdownReport}
                    label="Copy Markdown"
                  />
                )}
              </div>
              <div className="flex flex-col items-center gap-1">
                <a
                  href={`/api/audits/${audit.id}/faq.html`}
                  className="text-[13.5px] text-primary hover:underline"
                >
                  Download FAQ HTML block
                </a>
                {audit.htmlFaqBlock && (
                  <CopyButton
                    text={audit.htmlFaqBlock}
                    label="Copy HTML block"
                  />
                )}
              </div>
            </div>
            <ReportView report={audit.reportJson as Report} />
          </>
        )}

        {audit.status === "FAILED" && (
          <p className="text-[15px] text-muted-foreground">
            Analysis failed for {audit.websiteUrl}.
          </p>
        )}
      </main>
    </div>
  )
}
