import {
  type handleUnaryCall,
  Server,
  ServerCredentials,
  status,
} from "@grpc/grpc-js"
import { afterEach, describe, expect, it } from "vitest"

import {
  type RenderRequest,
  type RenderResponse,
  RendererService,
} from "../generated/sitegap/renderer/v1/renderer"
import { RenderError, renderHomepage } from "./rendered-scraper"

// A real in-process gRPC server speaking the same contract as sitegap-renderer,
// so the tests cover the wire: serialization, status codes and the deadline.
let server: Server | undefined

async function startRenderer(
  render: handleUnaryCall<RenderRequest, RenderResponse>
): Promise<string> {
  server = new Server()
  server.addService(RendererService, { render })

  const port = await new Promise<number>((resolve, reject) => {
    server!.bindAsync(
      "127.0.0.1:0",
      ServerCredentials.createInsecure(),
      (error, boundPort) => (error ? reject(error) : resolve(boundPort))
    )
  })

  return `127.0.0.1:${port}`
}

afterEach(() => {
  server?.forceShutdown()
  server = undefined
})

describe("renderHomepage", () => {
  it("returns the rendered text and final URL", async () => {
    let receivedUrl = ""
    const address = await startRenderer((call, callback) => {
      receivedUrl = call.request.url
      callback(null, {
        text: "Rendered text",
        finalUrl: "https://example.com/",
      })
    })

    const page = await renderHomepage("https://example.com", { address })

    expect(receivedUrl).toBe("https://example.com")
    expect(page).toEqual({
      text: "Rendered text",
      finalUrl: "https://example.com/",
    })
  })

  it("turns a renderer error into a RenderError with its status", async () => {
    const address = await startRenderer((_call, callback) => {
      callback({ code: status.PERMISSION_DENIED, details: "Blocked address" })
    })

    const error = await renderHomepage("https://example.com", {
      address,
    }).catch((caught: unknown) => caught)

    expect(error).toBeInstanceOf(RenderError)
    expect((error as RenderError).code).toBe(status.PERMISSION_DENIED)
    expect((error as RenderError).statusName).toBe("PERMISSION_DENIED")
  })

  it("fails with DEADLINE_EXCEEDED when the renderer is too slow", async () => {
    // Never answers: only the client's deadline can end the call
    const address = await startRenderer(() => {})

    const error = await renderHomepage("https://example.com", {
      address,
      deadlineMs: 100,
    }).catch((caught: unknown) => caught)

    expect((error as RenderError).statusName).toBe("DEADLINE_EXCEEDED")
  })

  it("fails with UNAVAILABLE when no renderer is listening", async () => {
    const address = await startRenderer(() => {})
    server!.forceShutdown()

    const error = await renderHomepage("https://example.com", {
      address,
      deadlineMs: 2_000,
    }).catch((caught: unknown) => caught)

    expect((error as RenderError).statusName).toBe("UNAVAILABLE")
  })
})
