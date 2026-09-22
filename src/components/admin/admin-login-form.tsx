"use client"
import { useState, type FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function AdminLoginForm() {
  const [password, setPassword] = useState("")

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    })
    console.log(response.status)
  }

  return (
    <div className="w-full max-w-[560px]">
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-border bg-card p-8 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.5)]"
      >
        <Input
          type="password"
          value={password}
          onChange={(event) => {
            setPassword(event.target.value)
          }}
        />
        <Button type="submit">Sign in</Button>
      </form>
    </div>
  )
}
