---
name: Vercel migration checks
description: Non-obvious build and verification issues when moving a pnpm workspace to Vercel
---

For an Express app imported from another workspace package, Vercel's function TypeScript compilation can report type and module-resolution errors even when the package and local entrypoint typecheck cleanly. Build a serverless-safe JavaScript bundle before Vercel discovers the function instead of assuming its function compiler will honor the workspace's TypeScript settings.

**Why:** Adding a function-local TypeScript configuration fixed only some Vercel errors; the Express type errors persisted. The bundled JavaScript function then built successfully without changing the existing long-running server behavior.

**How to apply:** Validate the actual Vercel build logs, not just local typecheck. Check the deployed API at runtime after database environment variables are wired.

Vercel Deployment Protection can return HTTP 200 with a large dashboard sign-in HTML page on every preview route. This is not evidence that the app or API returned 200.

**Why:** The Vercel build was ready, but anonymous curl requests reached the Vercel sign-in page rather than the site.

**How to apply:** Check content type and response body, not status alone; use an authorized preview or a verified public domain before claiming the deployed routes work.