import Link from "next/link"

export function SiteFooter() {
  return (
    <footer className="border-t border-border px-6 py-6 text-center text-[12.5px] text-muted-foreground">
      <Link
        href="/legal/terms"
        className="hover:text-foreground hover:underline"
      >
        Terms
      </Link>
      <span className="mx-2">·</span>
      <Link
        href="/legal/privacy"
        className="hover:text-foreground hover:underline"
      >
        Privacy
      </Link>
    </footer>
  )
}
