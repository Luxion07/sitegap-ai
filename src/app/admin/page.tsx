import { cookies } from "next/headers"
import Link from "next/link"

import { SiteHeader } from "@/components/site-header"
import { AdminLoginForm } from "@/components/admin/admin-login-form"
import { LogoutButton } from "@/components/admin/logout-button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { verifySessionToken } from "@/modules/admin/admin-session"
import { findAllAudits } from "@/modules/audit/audit.repository"
import { auditStatusFilterSchema } from "@/modules/audit/audit.schemas"
import { BUSINESS_TYPE_LABELS } from "@/modules/audit/business-type-labels"

export const metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
}

const STATUS_FILTERS = [
  { label: "All", value: undefined },
  { label: "Ready", value: "READY" },
  { label: "Failed", value: "FAILED" },
  { label: "Processing", value: "PROCESSING" },
] as const

export default async function AdminPage(props: PageProps<"/admin">) {
  const cookieStore = await cookies()
  const token = cookieStore.get("admin_session")?.value
  const isAuthenticated = verifySessionToken(token)

  if (!isAuthenticated) {
    return (
      <div className="flex flex-1 flex-col">
        <SiteHeader />
        <AdminLoginForm />
      </div>
    )
  }

  const searchParams = await props.searchParams
  const statusFilter = auditStatusFilterSchema.safeParse(
    searchParams.status
  ).data
  const audits = await findAllAudits(statusFilter)

  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />
      <main className="flex flex-1 flex-col px-6 py-12">
        <div className="mx-auto w-full max-w-5xl">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">Admin</h1>
            <LogoutButton />
          </div>

          <div className="mb-4 flex flex-wrap gap-4 text-[13.5px]">
            {STATUS_FILTERS.map((filter) => (
              <Link
                key={filter.label}
                href={filter.value ? `/admin?status=${filter.value}` : "/admin"}
                className={cn(
                  "hover:underline",
                  statusFilter === filter.value
                    ? "font-semibold text-foreground"
                    : "text-muted-foreground"
                )}
              >
                {filter.label}
              </Link>
            ))}
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Audit ID</TableHead>
                <TableHead>Website URL</TableHead>
                <TableHead>Business type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {audits.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-muted-foreground"
                  >
                    No audits yet.
                  </TableCell>
                </TableRow>
              ) : (
                audits.map((audit) => (
                  <TableRow key={audit.id}>
                    <TableCell>
                      <Link
                        href={`/admin/audits/${audit.id}`}
                        className="font-mono text-xs text-primary hover:underline"
                      >
                        {audit.id}
                      </Link>
                    </TableCell>
                    <TableCell className="max-w-[220px] truncate">
                      {audit.websiteUrl}
                    </TableCell>
                    <TableCell>
                      {BUSINESS_TYPE_LABELS[audit.businessType]}
                    </TableCell>
                    <TableCell>{audit.status}</TableCell>
                    <TableCell>
                      {audit.createdAt.toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {audit.updatedAt.toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </main>
    </div>
  )
}
