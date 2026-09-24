import Link from "next/link"

import { SiteHeader } from "@/components/site-header"

export const metadata = {
  title: "Not found",
}

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <h1 className="mb-2.5 text-2xl font-semibold tracking-tight">
          Page not found
        </h1>
        <p className="mb-8 max-w-[420px] text-[15px] text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist or may have been
          moved.
        </p>
        <Link
          href="/"
          className="rounded-md bg-primary px-[18px] py-[9px] text-[13.5px] font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Back to home
        </Link>
      </main>
    </div>
  )
}
