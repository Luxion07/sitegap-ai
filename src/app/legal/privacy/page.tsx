import { SiteHeader } from "@/components/site-header"

export const metadata = {
  title: "Privacy",
}

export default function PrivacyPage() {
  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />
      <main className="flex flex-1 justify-center px-6 py-16">
        <div className="w-full max-w-2xl">
          <h1 className="mb-2.5 text-2xl font-semibold tracking-tight">
            Privacy
          </h1>
          <p className="mb-8 text-[13px] text-muted-foreground">
            This is a prototype privacy notice for a technical demo, not a
            legally binding document.
          </p>

          <div className="flex flex-col gap-6 text-[14px] leading-relaxed">
            <section>
              <h2 className="mb-1.5 font-semibold">What data we process</h2>
              <p className="text-muted-foreground">
                The website URL you submit, the text we extract from that page,
                and any optional context you type in. We do not require an
                account and do not collect payment details.
              </p>
            </section>

            <section>
              <h2 className="mb-1.5 font-semibold">
                Website URL and manual text
              </h2>
              <p className="text-muted-foreground">
                We send the extracted page text and your optional notes to a
                third-party AI provider to generate the audit report. This
                content is stored with your audit record so the report page
                keeps working.
              </p>
            </section>

            <section>
              <h2 className="mb-1.5 font-semibold">Contact</h2>
              <p className="text-muted-foreground">
                Questions about this prototype:{" "}
                <a
                  className="text-primary underline"
                  href="mailto:privacy@example.com"
                >
                  privacy@example.com
                </a>
              </p>
            </section>

            <section>
              <h2 className="mb-1.5 font-semibold">Data deletion</h2>
              <p className="text-muted-foreground">
                To request deletion of an audit and its stored report, email the
                address above with the audit URL.
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}
