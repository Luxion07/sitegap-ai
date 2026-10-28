"use client"
import { useState, useRef, type ComponentProps } from "react"
import { CopyIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

type CopyStatus = "idle" | "copied" | "error"

function CopyButton({
  text,
  label,
  variant,
  size,
}: {
  text: string
  label: string
} & Pick<ComponentProps<typeof Button>, "variant" | "size">) {
  const [status, setStatus] = useState<CopyStatus>("idle")
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  async function handleClick() {
    try {
      await navigator.clipboard.writeText(text)
      setStatus("copied")
    } catch {
      setStatus("error")
    }
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }
    timerRef.current = setTimeout(() => setStatus("idle"), 2000)
  }

  return (
    <Button type="button" variant={variant} size={size} onClick={handleClick}>
      <CopyIcon />
      {status === "copied"
        ? "Copied!"
        : status === "error"
          ? "Copy failed"
          : label}
    </Button>
  )
}

export { CopyButton }
