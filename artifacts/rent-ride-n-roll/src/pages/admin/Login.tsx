import { useLocation } from "wouter"
import { BrandLogo } from "@/components/BrandLogo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/components/auth-provider"
import { approvedAdminEmails, registerAdmin, resendAdminConfirmation } from "@/lib/supabase-auth"
import { useState, type FormEvent } from "react"

export default function Login() {
  const [, setLocation] = useLocation()
  const { login, session } = useAuth()
  const [email, setEmail] = useState(approvedAdminEmails()[0] || "")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [setupMode, setSetupMode] = useState(false)

  if (session) {
    queueMicrotask(() => setLocation("/admin"))
    return null
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError("")
    setNotice("")
    setSubmitting(true)
    try {
      if (setupMode) {
        await registerAdmin(email, password)
        setNotice("Check the admin inbox for a verification link. Confirm your email before signing in. If it does not arrive or expires, request a new link below.")
        setSetupMode(false)
        setPassword("")
      } else {
        await login(email, password)
        setLocation("/admin")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in.")
    } finally {
      setSubmitting(false)
    }
  }

  async function handleResend() {
    setError("")
    setNotice("")
    setSubmitting(true)
    try {
      await resendAdminConfirmation(email)
      setNotice("A new verification link was requested. Check the admin inbox and spam folder; use the newest link promptly. If it does not arrive, the email delivery settings may need attention.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to request a new verification email.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="admin-surface min-h-screen flex items-center justify-center bg-primary p-4 selection:bg-accent">
      <div className="w-full max-w-sm">
        <div className="bg-card border-none shadow-2xl overflow-hidden">
          <div className="p-8 text-center bg-background border-b border-border">
            <div className="w-40 h-40 bg-primary mx-auto mb-5 flex items-center justify-center">
              <BrandLogo className="w-36 h-36" />
            </div>
            <h1 className="text-2xl font-extrabold uppercase tracking-tight">Admin Portal</h1>
            <p className="text-muted-foreground font-mono mt-2 text-sm">Rent Ride Roll LLC</p>
          </div>
          
          <div className="p-8 bg-background">
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-2 text-left">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} required />
              </div>
              <div className="space-y-2 text-left">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
              </div>
              {error && <p role="alert" className="text-sm text-destructive font-mono">{error}</p>}
              {notice && <p role="status" className="text-sm text-foreground font-mono">{notice}</p>}
              <Button type="submit" className="w-full h-14 text-lg" disabled={submitting}>
                {submitting ? "Please wait…" : setupMode ? "Create Admin Account" : "Secure Sign In"}
              </Button>
              <Button
                type="button"
                variant="link"
                className="w-full text-xs uppercase tracking-wider"
                onClick={() => {
                  setError("")
                  setNotice("")
                  setSetupMode((value) => !value)
                }}
              >
                {setupMode ? "Already created? Sign in" : "First time? Create admin account"}
              </Button>
              <Button
                type="button"
                variant="link"
                className="w-full text-xs uppercase tracking-wider"
                disabled={submitting}
                onClick={handleResend}
              >
                Resend verification email
              </Button>
            </form>
          </div>
          
          <div className="p-4 bg-muted/50 text-center">
            <Button variant="link" onClick={() => setLocation("/")} className="text-xs text-muted-foreground font-mono uppercase">
              &larr; Back to public site
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
