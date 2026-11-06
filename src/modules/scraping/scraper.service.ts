import {
  MIN_EXTRACTED_CHARS,
  scrapeHomepage as scrapeHomepageWithBasicProvider,
  ScrapeError,
} from "./providers/basic-scraper"
import { renderHomepage, RenderError } from "./providers/rendered-scraper"

// Tiered scraping (ADR-0001): the cheap basic scraper always runs first. Only
// EXTRACTION_EMPTY escalates to the renderer, and only when RENDERER_URL is
// set. If the renderer does not help, the original error is rethrown, so the
// user sees exactly what they would see without a renderer.
export async function scrapeHomepage(url: string): Promise<string> {
  try {
    const text = await scrapeHomepageWithBasicProvider(url)
    console.log(`[scraping] ${hostOf(url)}: text from basic`)
    return text
  } catch (error) {
    const rendererAddress = process.env.RENDERER_URL
    if (!rendererAddress || !isExtractionEmpty(error)) {
      throw error
    }

    const renderedText = await tryRenderer(url, rendererAddress)
    if (renderedText === null) {
      throw error
    }
    return renderedText
  }
}

// Returns null instead of throwing: every renderer failure ends the same way,
// with the basic scraper's error.
async function tryRenderer(
  url: string,
  address: string
): Promise<string | null> {
  try {
    const page = await renderHomepage(url, { address })

    if (page.text.length < MIN_EXTRACTED_CHARS) {
      console.log(
        `[scraping] ${hostOf(url)}: renderer returned too little text (${page.text.length} chars)`
      )
      return null
    }

    console.log(`[scraping] ${hostOf(url)}: text from renderer`)
    return page.text
  } catch (error) {
    const reason =
      error instanceof RenderError ? error.statusName : String(error)
    console.error(`[scraping] ${hostOf(url)}: renderer failed: ${reason}`)
    return null
  }
}

function isExtractionEmpty(error: unknown): boolean {
  return error instanceof ScrapeError && error.code === "EXTRACTION_EMPTY"
}

// Logs carry the host only: the full URL may hold personal data in its query.
function hostOf(url: string): string {
  return new URL(url).host
}
