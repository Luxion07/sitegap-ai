import { z } from "zod"

export const loginSchema = z.object({
  password: z.string(),
})

export type LoginInput = z.infer<typeof loginSchema>
