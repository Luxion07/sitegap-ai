"use client"

import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function AdminLoginForm() {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    setLoading(true)

    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    })

    if (!response.ok) {
      setError("Incorrect password.")
      setLoading(false)
      return
    }

    router.refresh()
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-[400px]">
        <div className="mb-7 text-center">
          <h1 className="mb-2 text-2xl font-semibold tracking-tight">Admin</h1>
          <p className="text-[13.5px] text-muted-foreground">
            Enter the admin password to continue.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-border bg-card p-8 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.5)]"
        >
          <Label
            htmlFor="password"
            className="mb-2 block text-[13px] font-semibold"
          >
            Password
          </Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value)
              setError("")
            }}
            aria-invalid={Boolean(error)}
          />

          <Button type="submit" disabled={loading} className="mt-5 w-full">
            {loading ? "Signing in..." : "Sign in"}
          </Button>

          {error && (
            <p className="mt-3 text-center text-[12.5px] text-destructive">
              {error}
            </p>
          )}
        </form>
      </div>
    </main>
  )
}
