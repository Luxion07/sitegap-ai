import Link from "next/link"

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background/85 px-10 py-5 backdrop-blur-md">
      <Link href="/" className="flex items-center gap-2.5">
        <span className="flex size-[22px] items-center justify-center rounded-md bg-primary">
          <span className="size-2 rounded-sm bg-background" />
        </span>
        <span className="text-[15px] font-semibold tracking-tight">
          SiteGap AI
        </span>
      </Link>
      <Link
        href="/"
        className="rounded-md bg-primary px-[18px] py-[9px] text-[13.5px] font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
      >
        New audit
      </Link>
    </header>
  )
}
