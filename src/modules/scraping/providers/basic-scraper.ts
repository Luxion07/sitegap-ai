import * as cheerio from "cheerio"

import { assertSafeUrl } from "../url-safety"

const FETCH_TIMEOUT_MS = 8000
const MAX_RESPONSE_BYTES = 2 * 1024 * 1024
const MAX_REDIRECTS = 3
const MIN_EXTRACTED_CHARS = 200
const MAX_EXTRACTED_CHARS = 40000
const USER_AGENT = "SiteGapAI-Bot/1.0 (+https://sitegap.ai)"

const UNREACHABLE_MESSAGE =
  "We could not read this website. You can paste website text manually instead."

export class ScrapeError extends Error {
  code:
    | "FETCH_TIMEOUT"
    | "FETCH_TOO_LARGE"
    | "FETCH_NON_HTML"
    | "FETCH_FAILED"
    | "EXTRACTION_EMPTY"

  constructor(code: ScrapeError["code"], message: string) {
    super(message)
    this.name = "ScrapeError"
    this.code = code
  }
}

async function fetchOnce(url: URL): Promise<Response> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

  try {
    return await fetch(url, {
      signal: controller.signal,
      redirect: "manual",
      headers: { "user-agent": USER_AGENT },
    })
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new ScrapeError(
        "FETCH_TIMEOUT",
        "The website took too long to respond."
      )
    }
    throw new ScrapeError("FETCH_FAILED", UNREACHABLE_MESSAGE)
  } finally {
    clearTimeout(timeout)
  }
}

// Follows redirects manually (rather than letting fetch() do it) so every
// hop can be re-validated by assertSafeUrl — a safe URL can still redirect
// to an internal address.
async function fetchWithRedirects(startUrl: string): Promise<Response> {
  let currentUrl = startUrl

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const { url: safeUrl } = await assertSafeUrl(currentUrl)
    const response = await fetchOnce(safeUrl)

    const isRedirect = response.status >= 300 && response.status < 400
    if (!isRedirect) return response

    const location = response.headers.get("location")
    if (!location || hop === MAX_REDIRECTS) {
      throw new ScrapeError("FETCH_FAILED", UNREACHABLE_MESSAGE)
    }
    currentUrl = new URL(location, safeUrl).toString()
  }

  throw new ScrapeError("FETCH_FAILED", UNREACHABLE_MESSAGE)
}

// Reads the body as a stream and aborts once MAX_RESPONSE_BYTES is exceeded.
// A Content-Length header can't be trusted — it can be missing or wrong.
async function readBodyWithLimit(response: Response): Promise<string> {
  const reader = response.body?.getReader()
  if (!reader) return response.text()

  const chunks: Uint8Array[] = []
  let totalBytes = 0

  for (;;) {
    const { done, value } = await reader.read()
    if (done) break

    totalBytes += value.byteLength
    if (totalBytes > MAX_RESPONSE_BYTES) {
      await reader.cancel()
      throw new ScrapeError(
        "FETCH_TOO_LARGE",
        "The page was too large to analyze."
      )
    }
    chunks.push(value)
  }

  return Buffer.concat(chunks).toString("utf-8")
}

function extractReadableText(html: string): string {
  const $ = cheerio.load(html)
  $("script, style, noscript, nav, footer, header, svg, iframe").remove()
  return $("body").text().replace(/\s+/g, " ").trim()
}

export async function scrapeHomepage(inputUrl: string): Promise<string> {
  const response = await fetchWithRedirects(inputUrl)

  const contentType = response.headers.get("content-type") ?? ""
  if (!contentType.toLowerCase().includes("text/html")) {
    throw new ScrapeError(
      "FETCH_NON_HTML",
      "This page did not return readable HTML."
    )
  }

  const html = await readBodyWithLimit(response)
  const text = extractReadableText(html).slice(0, MAX_EXTRACTED_CHARS)

  if (text.length < MIN_EXTRACTED_CHARS) {
    throw new ScrapeError(
      "EXTRACTION_EMPTY",
      "We could not find enough readable text. Try adding manual context."
    )
  }

  return text
}
