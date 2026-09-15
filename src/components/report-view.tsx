import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import type { Report } from "@/modules/ai/schemas"

const PRIORITY_VARIANT = {
  HIGH: "destructive",
  MEDIUM: "default",
  LOW: "outline",
} as const

function PriorityBadge({ priority }: { priority: "HIGH" | "MEDIUM" | "LOW" }) {
  return <Badge variant={PRIORITY_VARIANT[priority]}>{priority}</Badge>
}

export function ReportView({ report }: { report: Report }) {
  return (
    <div className="w-full max-w-2xl text-left">
      <div className="mb-8 rounded-lg border border-border p-5">
        <div className="mb-1 flex items-center justify-between">
          <h3 className="text-lg font-semibold tracking-tight">
            {report.businessSummary.nameGuess ?? "Business summary"}
          </h3>
          <span className="text-sm text-muted-foreground">
            Clarity score: {report.clarityScore.overall}/100
          </span>
        </div>
        <p className="text-[14px] text-muted-foreground">
          {report.businessSummary.whatTheyDo}
        </p>
      </div>

      <Accordion>
        <AccordionItem value="missing">
          <AccordionTrigger>
            Missing Visitor Questions ({report.missingQuestions.length})
          </AccordionTrigger>
          <AccordionContent>
            <div className="flex flex-col gap-4">
              {report.missingQuestions.map((item) => (
                <div key={item.question}>
                  <div className="mb-1 flex items-start justify-between gap-2">
                    <p className="font-medium">{item.question}</p>
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
                  <p className="font-medium">{item.question}</p>
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
                  <p className="font-medium">{item.question}</p>
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
                    <p className="font-medium">{item.title}</p>
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
