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

Supabase projects created directly in Supabase are not automatically given a database connection variable in an existing Vercel project just because both services are connected to the workspace. Supabase's documented automatic environment-variable synchronization describes projects created through Vercel Marketplace.

**Why:** The directly created project and updated public Supabase settings left the Vercel project without `DATABASE_URL` or `POSTGRES_URL`; the web app could build while the API remained unable to query Postgres.

**How to apply:** Check the destination Vercel project's environment-variable names (not values) before redeploying. For a directly created project, have its owner put the transaction-pooler URI securely into Vercel's environment settings, not chat, and redeploy to load it.

Vercel's preview protection may take several seconds to propagate after its project setting changes. A ready deployment and a healthy non-database route do not prove that database-backed routes work.

**Why:** Immediate preview probes still received Vercel's login HTML after the protection setting changed; a later probe reached the app but a fleet route failed because Supabase's pooler rejected the database password.

**How to apply:** When temporarily opening a preview with approval, allow for propagation, check content types and a database-backed route, and restore protection even if a probe fails. Use provider-side pooler logs to distinguish connection credentials from app build failures without exposing connection strings.

Supabase's shared pooler can continue rejecting a newly rotated database password briefly after the owner updates the client connection URI. A first post-rotation failure does not prove the edited URI is wrong.

**Why:** The initial request from a fresh Vercel deployment logged a pooler password rejection; after a short wait, the same unchanged deployment returned database-backed fleet data successfully. Supabase documents temporary credential caching in its pooler.

**How to apply:** After a confirmed secret update, allow a short cache window and try a new connection before asking the owner to reset the password again. Never inspect or print the URI to diagnose this; use update timestamps and provider-side error classes.

The Vercel API can return opaque encrypted text in an environment variable's `value` field even when the key is a non-secret setting. Do not compare that field to a plaintext email or treat unequal ciphertexts as evidence that the configured emails differ.

**Why:** Both admin-email entries appeared to disagree and were far longer than a plausible email, while their `type` was encrypted. A value-preserving edit based on those fields would have corrupted access rules.

**How to apply:** Use metadata only for verification, and obtain any existing admin identity from an independently verified account or ask the owner before changing an encrypted email allowlist. Never try to decrypt or display the stored value.

During a phased migration, keep the still-live Replit environment separate from Vercel admin allowlist changes. Do not put a comma-separated allowlist into the published Replit environment while its older single-email build still serves the live domain.

**Why:** The destination supports multiple admins only after its matching frontend and API code deploy together; changing the source site's environment first could lock out its administrator before the domain moves.

**How to apply:** Verify the destination build and configuration together, and leave source-production access unchanged until a planned cutover or separate source deployment.

When an approved admin sees "email is not authorized" during a phased migration, confirm the exact deployment URL before changing account data or allowlists. The latest protected Vercel build allowed the new admin to sign in after an older or Replit-hosted page rejected the same email.

**Why:** Each deployment has its own build-time frontend allowlist, while the live source site intentionally retains its previous settings. An error on one URL does not prove the destination configuration is wrong.

**How to apply:** Identify the page's host and build first; verify sign-in on the intended destination before debugging Supabase Auth or changing production settings.