import { status } from "@grpc/grpc-js"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import {
  scrapeHomepage as scrapeWithBasicProvider,
  ScrapeError,
} from "./providers/basic-scraper"
import { renderHomepage, RenderError } from "./providers/rendered-scraper"
import { scrapeHomepage } from "./scraper.service"

// Keep the real error classes and constants; replace only the network calls.
vi.mock("./providers/basic-scraper", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./providers/basic-scraper")>()),
  scrapeHomepage: vi.fn(),
}))
vi.mock("./providers/rendered-scraper", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./providers/rendered-scraper")>()),
  renderHomepage: vi.fn(),
}))

const SITE_URL = "https://spa.example.com/"
const RENDERER_ADDRESS = "localhost:50051"
const RENDERED_TEXT = "Rendered text of a client-side app. ".repeat(10)

const extractionEmpty = new ScrapeError(
  "EXTRACTION_EMPTY",
  "We could not find enough readable text. Try adding manual context."
)

beforeEach(() => {
  vi.mocked(scrapeWithBasicProvider).mockReset()
  vi.mocked(renderHomepage).mockReset()
  vi.spyOn(console, "log").mockImplementation(() => {})
  vi.spyOn(console, "error").mockImplementation(() => {})
  vi.stubEnv("RENDERER_URL", RENDERER_ADDRESS)
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

describe("scrapeHomepage", () => {
  it("returns the basic scraper's text without calling the renderer", async () => {
    vi.mocked(scrapeWithBasicProvider).mockResolvedValueOnce("Server text")

    await expect(scrapeHomepage(SITE_URL)).resolves.toBe("Server text")
    expect(renderHomepage).not.toHaveBeenCalled()
  })

  it("escalates EXTRACTION_EMPTY to the renderer", async () => {
    vi.mocked(scrapeWithBasicProvider).mockRejectedValueOnce(extractionEmpty)
    vi.mocked(renderHomepage).mockResolvedValueOnce({
      text: RENDERED_TEXT,
      finalUrl: SITE_URL,
    })

    await expect(scrapeHomepage(SITE_URL)).resolves.toBe(RENDERED_TEXT)
    expect(renderHomepage).toHaveBeenCalledWith(SITE_URL, {
      address: RENDERER_ADDRESS,
    })
  })

  it("does not escalate when RENDERER_URL is not set", async () => {
    vi.stubEnv("RENDERER_URL", "")
    vi.mocked(scrapeWithBasicProvider).mockRejectedValueOnce(extractionEmpty)

    await expect(scrapeHomepage(SITE_URL)).rejects.toBe(extractionEmpty)
    expect(renderHomepage).not.toHaveBeenCalled()
  })

  it("does not escalate other scrape errors", async () => {
    const timeout = new ScrapeError("FETCH_TIMEOUT", "The website timed out.")
    vi.mocked(scrapeWithBasicProvider).mockRejectedValueOnce(timeout)

    await expect(scrapeHomepage(SITE_URL)).rejects.toBe(timeout)
    expect(renderHomepage).not.toHaveBeenCalled()
  })

  it("rethrows the original error and logs the status when the renderer fails", async () => {
    vi.mocked(scrapeWithBasicProvider).mockRejectedValueOnce(extractionEmpty)
    vi.mocked(renderHomepage).mockRejectedValueOnce(
      new RenderError(status.UNAVAILABLE, "Connection refused")
    )

    await expect(scrapeHomepage(SITE_URL)).rejects.toBe(extractionEmpty)
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining("UNAVAILABLE")
    )
  })

  it("rethrows the original error when the rendered text is too short", async () => {
    vi.mocked(scrapeWithBasicProvider).mockRejectedValueOnce(extractionEmpty)
    vi.mocked(renderHomepage).mockResolvedValueOnce({
      text: "Loading…",
      finalUrl: SITE_URL,
    })

    await expect(scrapeHomepage(SITE_URL)).rejects.toBe(extractionEmpty)
  })
})
