"use client"

import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"

export function LogoutButton() {
  const router = useRouter()

  async function handleClick() {
    await fetch("/api/admin/logout", { method: "POST" })
    router.refresh()
  }

  return (
    <Button type="button" variant="outline" onClick={handleClick}>
      Sign out
    </Button>
  )
}
