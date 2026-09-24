import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
const DESCRIPTION =
  "Paste your URL and get an AI-generated content clarity audit: a " +
  "readiness score, missing FAQs, and a checklist of what to fix."

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "SiteGap AI — Discover what your website is missing",
    template: "%s · SiteGap AI",
  },
  description: DESCRIPTION,
  openGraph: {
    title: "SiteGap AI",
    description: DESCRIPTION,
    type: "website",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`dark ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  )
}
