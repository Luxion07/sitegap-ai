// Runs once when the server starts, before it accepts any requests. In
// production, fail loudly and immediately if a required variable is
// missing — a half-configured server that starts anyway just moves the
// failure to the first real request (e.g. every audit 500ing on a missing
// RATE_LIMIT_SALT), which is much harder to diagnose than a boot crash.
const REQUIRED_PRODUCTION_ENV_VARS = [
  "DATABASE_URL",
  "DIRECT_URL",
  "LLM_PROVIDER",
  "LLM_API_KEY",
  "LLM_MODEL",
  "ADMIN_PASSWORD",
  "ADMIN_SESSION_SECRET",
  "RATE_LIMIT_SALT",
  "NEXT_PUBLIC_APP_URL",
]

export function register() {
  if (process.env.NODE_ENV !== "production") return

  const missing = REQUIRED_PRODUCTION_ENV_VARS.filter(
    (key) => !process.env[key]
  )

  if (missing.length > 0) {
    throw new Error(
      `Missing required production environment variables: ${missing.join(", ")}. ` +
        "See env.example for what each one is for."
    )
  }
}
