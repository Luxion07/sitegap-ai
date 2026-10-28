import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { CLARITY_CATEGORIES } from "@/modules/ai/clarity-categories"
import type { ClarityCategory, Report } from "@/modules/ai/schemas"

const PRIORITY_VARIANT = {
  HIGH: "destructive",
  MEDIUM: "default",
  LOW: "outline",
} as const

const STATUS_STYLE: Record<
  ClarityCategory["status"],
  { label: string; className: string }
> = {
  ANSWERED: {
    label: "Answered",
    className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  },
  PARTIAL: {
    label: "Partial",
    className: "border-amber-500/30 bg-amber-500/10 text-amber-400",
  },
  MISSING: {
    label: "Missing",
    className: "border-destructive/30 bg-destructive/10 text-destructive",
  },
}

// The LLM's own labels are inconsistent (often just the key in caps), so the
// display label comes from our category list instead.
const CATEGORY_LABEL = Object.fromEntries(
  CLARITY_CATEGORIES.map((category) => [category.key, category.label])
) as Record<ClarityCategory["key"], string>

function PriorityBadge({ priority }: { priority: "HIGH" | "MEDIUM" | "LOW" }) {
  return <Badge variant={PRIORITY_VARIANT[priority]}>{priority}</Badge>
}

function StatusBadge({ status }: { status: ClarityCategory["status"] }) {
  const style = STATUS_STYLE[status]
  return (
    <Badge variant="outline" className={style.className}>
      {style.label}
    </Badge>
  )
}

export function ReportView({ report }: { report: Report }) {
  return (
    <div className="w-full max-w-2xl text-left">
      <section className="mb-8 rounded-lg border border-border p-5">
        <div className="flex items-start justify-between gap-6">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold tracking-tight">
              {report.businessSummary.nameGuess ?? "Business summary"}
            </h2>
            <p className="mt-1 text-[14px] text-muted-foreground">
              {report.businessSummary.whatTheyDo}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-4xl font-semibold tracking-tight tabular-nums">
              {report.clarityScore.overall}
              <span className="text-base font-normal text-muted-foreground">
                /100
              </span>
            </p>
            <p className="text-xs text-muted-foreground">Clarity score</p>
          </div>
        </div>

        <div className="mt-5 grid gap-2 sm:grid-cols-3">
          {report.clarityScore.categories.map((category) => (
            <div
              key={category.key}
              title={category.note}
              className="rounded-md border border-border p-3"
            >
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="text-[13px] font-medium">
                  {CATEGORY_LABEL[category.key]}
                </span>
                <StatusBadge status={category.status} />
              </div>
              <p className="line-clamp-2 text-xs text-muted-foreground">
                {category.note}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Questions are h4, not p: the accordion panel adds a bottom margin to
          every non-last <p>, which pushed each question away from its answer. */}
      <Accordion defaultValue={["missing"]}>
        <AccordionItem value="missing">
          <AccordionTrigger>
            Missing Visitor Questions ({report.missingQuestions.length})
          </AccordionTrigger>
          <AccordionContent>
            <div className="flex flex-col gap-4">
              {report.missingQuestions.map((item) => (
                <div key={item.question}>
                  <div className="mb-1 flex items-start justify-between gap-2">
                    <h4 className="font-medium">{item.question}</h4>
                    <PriorityBadge priority={item.priority} />
                  </div>
                  <p className="text-muted-foreground">{item.whyItMatters}</p>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="answered">
          <AccordionTrigger>
            Questions Already Answered ({report.answeredQuestions.length})
          </AccordionTrigger>
          <AccordionContent>
            <div className="flex flex-col gap-4">
              {report.answeredQuestions.map((item) => (
                <div key={item.question}>
                  <h4 className="mb-1 font-medium">{item.question}</h4>
                  <p className="text-muted-foreground">{item.answer}</p>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="faq">
          <AccordionTrigger>
            Ready-to-Use FAQ ({report.readyFaq.length})
          </AccordionTrigger>
          <AccordionContent>
            <div className="flex flex-col gap-4">
              {report.readyFaq.map((item) => (
                <div key={item.question}>
                  <h4 className="mb-1 font-medium">{item.question}</h4>
                  <p className="text-muted-foreground">{item.answer}</p>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="improvements">
          <AccordionTrigger>
            Website Improvement Checklist ({report.websiteImprovements.length})
          </AccordionTrigger>
          <AccordionContent>
            <div className="flex flex-col gap-4">
              {report.websiteImprovements.map((item) => (
                <div key={item.title}>
                  <div className="mb-1 flex items-start justify-between gap-2">
                    <h4 className="font-medium">{item.title}</h4>
                    <PriorityBadge priority={item.priority} />
                  </div>
                  <p className="text-muted-foreground">{item.reason}</p>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}
