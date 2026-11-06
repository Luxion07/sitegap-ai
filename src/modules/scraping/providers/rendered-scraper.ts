import { credentials, Metadata, status } from "@grpc/grpc-js"

import { RendererClient } from "../generated/sitegap/renderer/v1/renderer"

const RENDER_DEADLINE_MS = 20_000

export type RenderedPage = {
  text: string
  finalUrl: string
}

export class RenderError extends Error {
  readonly code: status

  constructor(code: status, message: string) {
    super(message)
    this.name = "RenderError"
    this.code = code
  }

  // "DEADLINE_EXCEEDED" reads better in logs than the number 4
  get statusName(): string {
    return status[this.code] ?? `UNKNOWN_${this.code}`
  }
}

type RenderOptions = {
  // host:port of sitegap-renderer, e.g. "localhost:50051"
  address: string
  deadlineMs?: number
}

// One connection per call: the renderer is only a fallback after
// EXTRACTION_EMPTY, so calls are rare, and nothing has to be closed when the
// worker shuts down. Plaintext gRPC: the renderer listens on a private address
// only and holds no secrets (ADR-0001).
export function renderHomepage(
  url: string,
  { address, deadlineMs = RENDER_DEADLINE_MS }: RenderOptions
): Promise<RenderedPage> {
  const client = new RendererClient(address, credentials.createInsecure())

  return new Promise((resolve, reject) => {
    client.render(
      { url },
      new Metadata(),
      // A deadline, not a timeout: gRPC sends it to the renderer, which stops
      // rendering and frees its browser slot once the time is up.
      { deadline: Date.now() + deadlineMs },
      (error, response) => {
        client.close()

        if (error) {
          reject(new RenderError(error.code, error.details))
          return
        }

        resolve({ text: response.text, finalUrl: response.finalUrl })
      }
    )
  })
}
