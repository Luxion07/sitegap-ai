import { SiteHeader } from "@/components/site-header"

export const metadata = {
  title: "Admin — SiteGap AI",
  robots: { index: false, follow: false },
}

export default function AdminPage() {
  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-16">
        <h1 className="mb-2.5 text-2xl font-semibold tracking-tight">Admin</h1>
        <p className="max-w-[420px] text-center text-[15px] text-muted-foreground">
          Internal monitoring for generated audits. Password protection and the
          audit table arrive in Phase 7.
        </p>
      </main>
    </div>
  )
}
