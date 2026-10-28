import { AuditForm } from "@/components/audit/audit-form"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { parseAuditPrefill } from "@/modules/audit/audit.schemas"

export default async function Home(props: PageProps<"/">) {
  const prefill = parseAuditPrefill(await props.searchParams)

  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />
      <main className="flex flex-1 flex-col items-center px-6 pt-20 pb-24">
        <div className="mb-6 flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/12 px-3 py-1.5">
          <span className="size-1.5 rounded-full bg-primary" />
          <span className="text-[12.5px] font-medium text-primary">
            AI website analysis
          </span>
        </div>
        <h1 className="mb-[18px] max-w-[760px] text-center text-[34px] leading-[1.12] font-bold tracking-[-0.025em] sm:text-[44px] sm:leading-[1.1] md:text-[56px] md:leading-[1.08]">
          Discover what your website is missing
        </h1>
        <p className="mb-12 max-w-[520px] text-center text-lg leading-[1.55] text-muted-foreground">
          Paste your URL and we&apos;ll analyze your content clarity, surface
          the FAQs visitors expect, and flag the gaps holding back conversions.
        </p>
        {/* The key remounts the form when the prefill changes, e.g. clicking
            "New audit" on /?url=… must clear the fields, not keep them. */}
        <AuditForm
          key={`${prefill.websiteUrl}|${prefill.businessType}`}
          initialUrl={prefill.websiteUrl}
          initialBusinessType={prefill.businessType}
        />
      </main>
      <SiteFooter />
    </div>
  )
}
