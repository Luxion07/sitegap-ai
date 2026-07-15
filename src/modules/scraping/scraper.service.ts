import { scrapeHomepage as scrapeHomepageWithBasicProvider } from "./providers/basic-scraper"

export async function scrapeHomepage(url: string): Promise<string> {
  return scrapeHomepageWithBasicProvider(url)
}
