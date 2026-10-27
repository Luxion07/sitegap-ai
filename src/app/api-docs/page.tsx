"use client"

import { useEffect } from "react"
import Script from "next/script"

declare global {
  interface Window {
    SwaggerUIBundle?: (config: Record<string, unknown>) => unknown
  }
}

export default function SwaggerDocsPage() {
  const initSwagger = () => {
    if (typeof window !== "undefined" && window.SwaggerUIBundle) {
      window.SwaggerUIBundle({
        url: "/api/swagger.json",
        dom_id: "#swagger-ui",
        deepLinking: true,
        docExpansion: "list",
        defaultModelsExpandDepth: 1,
      })
    }
  }

  useEffect(() => {
    initSwagger()
  }, [])

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <link
        rel="stylesheet"
        href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css"
      />
      <Script
        src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"
        strategy="afterInteractive"
        onLoad={initSwagger}
      />
      <div id="swagger-ui" className="mx-auto max-w-6xl py-6" />
    </div>
  )
}
