---
name: Supabase admin confirmation
description: Operational caveats for admin signup email confirmation
---

Supabase Auth recorded a confirmation email send for the approved admin account, but the account remained unconfirmed after the original link was opened too late and Supabase rejected it as expired. A later resend was accepted and recorded as sent; neither event alone proved inbox delivery. The fresh link was opened and the account became confirmed even though the browser then failed to connect to localhost:3000.

**Why:** The Auth project's default redirect is localhost:3000, which a recipient's phone cannot reach. Supabase can verify a link before redirecting, so a localhost connection error does not itself mean confirmation failed. The default Supabase mail service has delivery restrictions. A successful signup or resend response is not proof of inbox receipt.

**How to apply:** Use a fresh confirmation link promptly. Request a redirect to the verified published admin login URL and correct the Supabase Auth Site URL and redirect allow list if the link lands on localhost. Check Auth's confirmation state rather than inferring it from the redirect page. Do not manually mark an account confirmed; require a confirmed email at both the frontend session and API boundary. If delivery continues to fail, diagnose sender configuration rather than repeatedly claiming mail was delivered.

Provider auth-log responses may be flagged by the safety scanner even when only aggregate counts are requested. Do not keep querying those logs after a warning; use the account's confirmed/sign-in state to determine whether the verification step succeeded, and ask the owner to resend a fresh link when it did not.

**Why:** An ambiguous browser error after opening a confirmation link left the account unconfirmed; filtered log queries did not provide safe, reliable extra detail.

**How to apply:** Do not infer the precise link failure from an unconfirmed account alone. Avoid asking for screenshots or confirmation URLs when a fresh resend and a subsequent account-state check can resolve it.