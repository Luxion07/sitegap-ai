import { cookies } from "next/headers"

import { SiteHeader } from "@/components/site-header"
import { AdminLoginForm } from "@/components/admin/admin-login-form"
import { LogoutButton } from "@/components/admin/logout-button"
import { verifySessionToken } from "@/modules/admin/admin-session"

export const metadata = {
  title: "Admin — SiteGap AI",
  robots: { index: false, follow: false },
}

export default async function AdminPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get("admin_session")?.value
  const isAuthenticated = verifySessionToken(token)

  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />
      {isAuthenticated ? (
        <main className="flex flex-1 flex-col items-center justify-center px-6 py-16">
          <h1 className="mb-2.5 text-2xl font-semibold tracking-tight">
            Admin
          </h1>
          <p className="mb-6 max-w-[420px] text-center text-[15px] text-muted-foreground">
            You&apos;re signed in. The audit table is the next piece to build.
          </p>
          <LogoutButton />
        </main>
      ) : (
        <AdminLoginForm />
      )}
    </div>
  )
}
