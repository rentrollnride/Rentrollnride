const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

const STORAGE_KEY = "rent-ride-n-roll-admin-session"

export function approvedAdminEmails(): string[] {
  return (import.meta.env.VITE_ADMIN_EMAIL ?? "")
    .split(",")
    .map((email: string) => email.trim())
    .filter(Boolean)
}

function isApprovedEmail(email: string): boolean {
  return approvedAdminEmails().some((approved) =>
    approved.toLowerCase() === email.trim().toLowerCase())
}

export type AdminSession = {
  access_token: string
  refresh_token: string
  expires_at: number
  user: {
    id: string
    email?: string
    email_confirmed_at?: string | null
  }
}

function requireConfiguration() {
  if (!supabaseUrl || !publishableKey) {
    throw new Error("Supabase authentication is not configured.")
  }
}

function readSession(): AdminSession | null {
  const value = localStorage.getItem(STORAGE_KEY)
  if (!value) return null
  try {
    return JSON.parse(value) as AdminSession
  } catch {
    localStorage.removeItem(STORAGE_KEY)
    return null
  }
}

function saveSession(session: AdminSession | null) {
  if (session) localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
  else localStorage.removeItem(STORAGE_KEY)
}

async function authRequest(path: string, body: Record<string, string>) {
  requireConfiguration()
  const response = await fetch(`${supabaseUrl}/auth/v1/${path}`, {
    method: "POST",
    headers: {
      apikey: publishableKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  })
  const data = await response.json()
  if (!response.ok) {
    throw new Error(data.error_description || data.msg || data.message || "Unable to sign in.")
  }
  return data as AdminSession
}

export async function signIn(email: string, password: string) {
  requireApprovedEmail(email)
  const session = await authRequest("token?grant_type=password", { email, password })
  if (!isApprovedConfirmedUser(session.user)) {
    throw new Error("Confirm the administrator email address before signing in.")
  }
  saveSession(session)
  return session
}

function requireApprovedEmail(email: string) {
  if (!isApprovedEmail(email)) {
    throw new Error("This email is not authorized for administrator access.")
  }
}

function isApprovedConfirmedUser(user: AdminSession["user"] | null | undefined): boolean {
  return Boolean(user?.email_confirmed_at &&
    user.email && isApprovedEmail(user.email))
}

function confirmationRedirect() {
  // Prefer the verified published domain so a link remains usable after the
  // development preview expires. Supabase must allow this URL in Auth settings.
  const configuredUrl = import.meta.env.VITE_AUTH_REDIRECT_URL
  return configuredUrl || new URL("admin/login", new URL(import.meta.env.BASE_URL, window.location.origin)).href
}

export async function registerAdmin(email: string, password: string) {
  requireApprovedEmail(email)
  requireConfiguration()
  const url = new URL(`${supabaseUrl}/auth/v1/signup`)
  url.searchParams.set("redirect_to", confirmationRedirect())
  const response = await fetch(url, {
    method: "POST",
    headers: {
      apikey: publishableKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  })
  const data = await response.json()
  if (!response.ok) {
    throw new Error(data.msg || data.message || "Unable to create administrator account.")
  }
  if (data.access_token) {
    throw new Error("Email confirmation is disabled in the authentication provider. Enable confirmation before using admin setup.")
  }
}

export async function resendAdminConfirmation(email: string) {
  requireApprovedEmail(email)
  requireConfiguration()
  const url = new URL(`${supabaseUrl}/auth/v1/resend`)
  url.searchParams.set("redirect_to", confirmationRedirect())
  const response = await fetch(url, {
    method: "POST",
    headers: {
      apikey: publishableKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, type: "signup" }),
  })
  const data = await response.json()
  if (!response.ok) {
    throw new Error(data.error_description || data.msg || data.message || "Unable to request a new verification email.")
  }
}

export async function getValidSession() {
  const session = readSession()
  if (!session) return null

  try {
    const current = session.expires_at * 1000 > Date.now() + 60_000
      ? session
      : await authRequest("token?grant_type=refresh_token", { refresh_token: session.refresh_token })
    const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { apikey: publishableKey, Authorization: `Bearer ${current.access_token}` },
    })
    if (!response.ok || !isApprovedConfirmedUser(await response.json())) {
      saveSession(null)
      return null
    }
    saveSession(current)
    return current
  } catch {
    saveSession(null)
    return null
  }
}

export async function signOut() {
  const session = readSession()
  saveSession(null)
  if (!session || !supabaseUrl || !publishableKey) return
  await fetch(`${supabaseUrl}/auth/v1/logout`, {
    method: "POST",
    headers: {
      apikey: publishableKey,
      Authorization: `Bearer ${session.access_token}`,
    },
  }).catch(() => undefined)
}