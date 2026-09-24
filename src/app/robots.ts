import type { MetadataRoute } from "next"

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Individual audit reports and the admin area are only reachable by a
      // direct link, not meant to show up in search results.
      disallow: ["/audit/", "/admin"],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  }
}
