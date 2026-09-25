import { useEffect, useState } from "react"
import { useParams, Link } from "wouter"
import { CheckCircle2, FileSignature, Printer } from "lucide-react"
import { PublicLayout } from "@/components/layout/PublicLayout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type Agreement = {
  id: string
  agreementStatus: string
  signedAt: string | null
  holdExpiresAt: string | null
  status: string
  agreementVersion: string
  agreementHash: string | null
  agreementText: string
  renter: { name: string; email: string | null; phone: string }
  vehicle: { year: number; make: string; model: string }
  pickupAt: string
  expectedReturnAt: string
  rateType: string
  rate: number
  deposit: number
  approvedTravelArea: string
}

export default function SignAgreement() {
  const { token } = useParams<{ token: string }>()
  const [agreement, setAgreement] = useState<Agreement | null>(null)
  const [signerName, setSignerName] = useState("")
  const [consent, setConsent] = useState(false)
  const [electronicConsent, setElectronicConsent] = useState(false)
  const [loading, setLoading] = useState(true)
  const [signing, setSigning] = useState(false)
  const [error, setError] = useState("")

  const load = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/public/reservations/${token}`)
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Unable to load agreement.")
      setAgreement(data)
      setSignerName(data.renter?.name || "")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load agreement.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [token])

  const sign = async (event: React.FormEvent) => {
    event.preventDefault()
    setSigning(true)
    setError("")
    try {
      const response = await fetch(`/api/public/reservations/${token}/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signerName, consent, electronicConsent }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Unable to sign agreement.")
      await load()
      window.scrollTo({ top: 0, behavior: "smooth" })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign agreement.")
    } finally {
      setSigning(false)
    }
  }

  return (
    <PublicLayout>
      <main className="mx-auto w-full max-w-4xl px-5 py-10 md:py-16 print:max-w-none print:px-0">
        {loading ? (
          <p className="py-24 text-center">Loading agreement…</p>
        ) : error && !agreement ? (
          <div className="py-24 text-center">
            <p className="text-destructive font-semibold">{error}</p>
            <Link href="/fleet" className="mt-6 inline-block underline">Back to fleet</Link>
          </div>
        ) : agreement ? (
          <>
            {agreement.agreementStatus === "signed" ? (
              <section className="mb-8 border border-emerald-300 bg-emerald-50 p-6 text-emerald-950 print:border-black print:bg-white">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0" />
                  <div>
                    <h1 className="text-xl font-black uppercase">Agreement signed</h1>
                    <p className="mt-1 text-sm">
                      Signed by {agreement.renter.name}
                      {agreement.signedAt ? ` on ${new Date(agreement.signedAt).toLocaleString()}` : ""}.
                      Your reservation is confirmed, subject to pickup verification and payment.
                    </p>
                  </div>
                </div>
              </section>
            ) : agreement.agreementStatus === "expired" ? (
              <section className="mb-8 border border-destructive/40 bg-destructive/5 p-6">
                <h1 className="text-xl font-black uppercase">Reservation hold expired</h1>
                <p className="mt-2 text-sm text-muted-foreground">Start a new reservation to select dates and generate a new agreement.</p>
                <Link href="/fleet" className="mt-4 inline-block underline">Back to fleet</Link>
              </section>
            ) : (
              <section className="mb-8 border-l-4 border-accent bg-secondary/40 p-5">
                <div className="flex gap-3">
                  <FileSignature className="h-5 w-5 shrink-0 text-accent" />
                  <div>
                    <h1 className="font-black uppercase">Review before signing</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Your vehicle is held until {agreement.holdExpiresAt ? new Date(agreement.holdExpiresAt).toLocaleString() : "the hold expires"}.
                      Read the full agreement below before signing.
                    </p>
                  </div>
                </div>
              </section>
            )}

            <article className="border border-border bg-white p-6 text-black shadow-sm md:p-10 print:border-0 print:p-0 print:shadow-none">
              <div className="mb-8 text-center">
                <h2 className="text-2xl font-black">RENT RIDE ROLL LLC</h2>
                <p className="font-bold">VEHICLE RENTAL AGREEMENT & POLICY ACKNOWLEDGMENT</p>
                <p className="mt-2 text-xs text-neutral-600">Agreement version {agreement.agreementVersion}</p>
              </div>

              <div className="grid gap-3 border border-neutral-300 p-4 text-sm sm:grid-cols-2">
                <p><b>Renter:</b> {agreement.renter.name}</p>
                <p><b>Email:</b> {agreement.renter.email}</p>
                <p><b>Phone:</b> {agreement.renter.phone}</p>
                <p><b>Vehicle:</b> {agreement.vehicle.year} {agreement.vehicle.make} {agreement.vehicle.model}</p>
                <p><b>Pickup:</b> {new Date(agreement.pickupAt).toLocaleString()}</p>
                <p><b>Return:</b> {new Date(agreement.expectedReturnAt).toLocaleString()}</p>
                <p><b>Rate:</b> ${agreement.rate} {agreement.rateType}</p>
                <p><b>Refundable deposit:</b> ${agreement.deposit}</p>
              </div>

              <pre className="mt-8 whitespace-pre-wrap font-sans text-[13px] leading-6">{agreement.agreementText}</pre>

              {agreement.agreementStatus === "signed" && (
                <div className="mt-10 border-t-2 border-black pt-5 text-sm">
                  <p><b>Electronically signed by:</b> {agreement.renter.name}</p>
                  <p><b>Date signed:</b> {agreement.signedAt ? new Date(agreement.signedAt).toLocaleString() : ""}</p>
                  <p className="mt-2 break-all text-xs text-neutral-600"><b>Agreement record:</b> {agreement.agreementHash}</p>
                </div>
              )}
            </article>

            {agreement.agreementStatus === "signed" ? (
              <div className="mt-8 flex flex-col gap-3 sm:flex-row print:hidden">
                <Button type="button" onClick={() => window.print()} className="gap-2">
                  <Printer className="h-4 w-4" /> Print / Save PDF
                </Button>
                <Link href="/fleet" className="inline-flex min-h-10 items-center justify-center border border-border px-5 text-sm font-bold uppercase tracking-wide">Back to fleet</Link>
              </div>
            ) : agreement.agreementStatus !== "expired" && (
              <form onSubmit={sign} className="mt-8 space-y-5 border border-border bg-card p-6 print:hidden">
                <div className="space-y-2">
                  <Label htmlFor="signer-name">Type your full legal name</Label>
                  <Input id="signer-name" value={signerName} onChange={(e) => setSignerName(e.target.value)} required autoComplete="name" />
                  <p className="text-xs text-muted-foreground">Your typed name must match the renter name above and will serve as your electronic signature.</p>
                </div>

                <label className="flex items-start gap-3 text-sm">
                  <input type="checkbox" className="mt-1" checked={consent} onChange={(e) => setConsent(e.target.checked)} required />
                  <span>I have read the entire rental agreement, understand its terms, and agree to be bound by it.</span>
                </label>

                <label className="flex items-start gap-3 text-sm">
                  <input type="checkbox" className="mt-1" checked={electronicConsent} onChange={(e) => setElectronicConsent(e.target.checked)} required />
                  <span>I consent to use an electronic signature and understand that typing my name and submitting this form is intended to have the same effect as signing by hand.</span>
                </label>

                {error && <p role="alert" className="font-semibold text-destructive">{error}</p>}

                <Button type="submit" disabled={signing} className="h-14 w-full uppercase tracking-widest">
                  {signing ? "Signing agreement…" : "Sign & confirm reservation"}
                </Button>
              </form>
            )}
          </>
        ) : null}
      </main>
    </PublicLayout>
  )
}
