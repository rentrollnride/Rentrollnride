import { useEffect, useMemo, useState } from "react"
import { useGetPublicVehicles } from "@workspace/api-client-react"
import { useParams, Link, useLocation } from "wouter"
import { addDays, format } from "date-fns"
import { ArrowLeft, CheckCircle2, FileSignature, LockKeyhole } from "lucide-react"
import { PublicLayout } from "@/components/layout/PublicLayout"
import { VehicleImage } from "@/components/public/VehicleImage"
import { vehiclePhoto } from "@/components/public/vehicle-photos"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type ReservationConfig = {
  enabled: boolean
  holdMinutes: number
  deposit: number
  approvedTravelArea: string
}

type ReservationResult = {
  id: string
  token: string
  agreementStatus: string
  holdExpiresAt: string | null
  message: string
}

export default function Reserve() {
  const { id } = useParams<{ id: string }>()
  const [, setLocation] = useLocation()
  const { data: vehicles, isLoading } = useGetPublicVehicles()
  const vehicle = vehicles?.find((item) => item.id === id)
  const [config, setConfig] = useState<ReservationConfig | null>(null)
  const [result, setResult] = useState<ReservationResult | null>(null)
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    pickupAt: format(addDays(new Date(), 1), "yyyy-MM-dd'T'10:00"),
    expectedReturnAt: format(addDays(new Date(), 2), "yyyy-MM-dd'T'10:00"),
  })

  useEffect(() => {
    fetch("/api/public/reservation-config")
      .then(async (response) => response.ok ? response.json() : Promise.reject())
      .then(setConfig)
      .catch(() => setConfig({ enabled: false, holdMinutes: 60, deposit: 300, approvedTravelArea: "North Carolina, South Carolina, Virginia, and Washington, DC" }))
  }, [])

  const estimate = useMemo(() => {
    if (!vehicle || vehicle.detailsPending) return null
    const start = new Date(form.pickupAt)
    const end = new Date(form.expectedReturnAt)
    if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || end <= start) return null
    const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86_400_000))
    if (days > 7) return { days, tooLong: true, base: 0, tax: 0, total: 0, rateLabel: "Extended rental", rate: 0 }
    const weekly = days === 7
    const rate = weekly ? Number(vehicle.weeklyRate) : Number(vehicle.dailyRate)
    const base = weekly ? rate : rate * days
    const tax = Math.round(base * 0.08 * 100) / 100
    const total = Math.round((base + tax) * 100) / 100
    return { days, tooLong: false, base, tax, total, rateLabel: weekly ? "Weekly rate" : "Daily rate", rate }
  }, [form.pickupAt, form.expectedReturnAt, vehicle])

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!vehicle) return
    setSubmitting(true)
    setError("")
    try {
      const response = await fetch("/api/public/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicleId: vehicle.id,
          ...form,
          pickupAt: new Date(form.pickupAt).toISOString(),
          expectedReturnAt: new Date(form.expectedReturnAt).toISOString(),
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Unable to create reservation.")
      if (data.signingUrl) {
        setLocation(data.signingUrl)
        return
      }
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create reservation.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <PublicLayout>
      <main className="mx-auto w-full max-w-6xl px-6 py-12 md:py-20">
        <Link href={vehicle ? `/fleet/${vehicle.id}` : "/fleet"} className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-accent">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>

        {result ? (
          <section className="mx-auto mt-12 max-w-2xl border border-border bg-card p-8 md:p-12 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-accent" />
            <h1 className="mt-6 text-3xl font-black uppercase tracking-tight">Check your email</h1>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              Your vehicle is temporarily held while you review and electronically sign the Rent Ride Roll LLC rental agreement.
            </p>
            {result.holdExpiresAt && (
              <p className="mt-5 text-sm font-bold">
                Sign before {new Date(result.holdExpiresAt).toLocaleString()} to keep the hold.
              </p>
            )}
            <div className="mt-8 border-l-2 border-accent pl-4 text-left text-sm text-muted-foreground">
              No payment was taken online. Bring your valid driver&apos;s license, current insurance, and debit or credit card. The refundable $300 deposit is collected at pickup, subject to the signed agreement and permitted deductions.
            </div>
            <Link href="/fleet" className="mt-8 inline-flex bg-primary px-6 py-4 text-sm font-bold uppercase tracking-widest text-primary-foreground">
              Back to fleet
            </Link>
          </section>
        ) : isLoading ? (
          <p className="py-24">Loading vehicle…</p>
        ) : !vehicle ? (
          <p className="py-24">This vehicle is not currently available for reservation.</p>
        ) : (
          <div className="mt-10 grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
            <div>
              <VehicleImage
                src={vehiclePhoto(vehicle).src}
                attribution={vehiclePhoto(vehicle).attribution}
                alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                eager
              />
              <h1 className="mt-6 text-4xl font-black uppercase tracking-tight">
                {vehicle.year} {vehicle.make} {vehicle.model}
              </h1>
              <div className="mt-6 space-y-3 text-sm text-muted-foreground">
                <p className="flex gap-2"><FileSignature className="h-4 w-4 shrink-0 text-accent" /> Review and sign the agreement securely on this site.</p>
                <p className="flex gap-2"><LockKeyhole className="h-4 w-4 shrink-0 text-accent" /> Your dates are held for {config?.holdMinutes ?? 60} minutes while you sign.</p>
                <p><strong className="text-foreground">Approved travel:</strong> {config?.approvedTravelArea ?? "North Carolina, South Carolina, Virginia, and Washington, DC"}. Travel outside this area requires approval and may have additional fees.</p>
                <p><strong className="text-foreground">Deposit:</strong> ${config?.deposit ?? 300} refundable deposit collected at pickup, subject to the rental agreement and permitted deductions.</p>
              </div>
            </div>

            <section className="border border-border bg-card p-6 md:p-8">
              <h2 className="text-2xl font-black uppercase tracking-tight">Reserve this vehicle</h2>
              <p className="mt-2 text-sm text-muted-foreground">Choose your dates. You will sign the agreement before the reservation is confirmed.</p>

              {config && !config.enabled && (
                <div role="alert" className="mt-6 border border-accent/40 bg-accent/5 p-4 text-sm">
                  Online agreement signing is being connected. For now, call or text us to reserve this vehicle.
                </div>
              )}

              <form onSubmit={submit} className="mt-8 space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="name">Full name</Label>
                  <Input id="name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoComplete="name" />
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} autoComplete="email" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" type="tel" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} autoComplete="tel" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dob">Date of birth</Label>
                  <Input id="dob" type="date" required value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} autoComplete="bday" />
                  <p className="text-xs text-muted-foreground">Renters must be at least 18. Ages 18–20 require an under-age fee that must be disclosed before booking; online booking for that age group is temporarily paused until the fee is configured.</p>
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="pickup">Pickup</Label>
                    <Input id="pickup" type="datetime-local" required value={form.pickupAt} onChange={(e) => setForm({ ...form, pickupAt: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="return">Return</Label>
                    <Input id="return" type="datetime-local" required min={form.pickupAt} value={form.expectedReturnAt} onChange={(e) => setForm({ ...form, expectedReturnAt: e.target.value })} />
                  </div>
                </div>

                {estimate && (
                  estimate.tooLong ? (
                    <div className="border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                      Online reservations are temporarily limited to 7 days until extended-rental pricing is configured. Call or text us for longer rentals.
                    </div>
                  ) : (
                    <div className="border-y border-border py-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{estimate.rateLabel}</span>
                        <span className="text-xl font-black">${estimate.rate.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>Base rental total ({estimate.days} {estimate.days === 1 ? "day" : "days"})</span>
                        <span>${estimate.base.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>NC short-term motor vehicle rental tax (8%)</span>
                        <span>${estimate.tax.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between border-t border-border pt-3">
                        <span className="text-base font-black uppercase">Total estimated rental price</span>
                        <span className="text-2xl font-black">${estimate.total.toFixed(2)}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Refundable $300 security deposit is collected separately at pickup and is not included in the estimated rental price.</p>
                    </div>
                  )
                )}

                <label className="flex items-start gap-3 text-sm text-muted-foreground">
                  <input type="checkbox" required className="mt-1" />
                  <span>I understand the reservation is confirmed only after I review and electronically sign the rental agreement. Tickets, tolls, smoking, vehicle damage, prohibited weapons/drugs or illegal substances, travel restrictions, and other rental terms are governed by that agreement.</span>
                </label>

                {error && <p role="alert" className="text-sm font-semibold text-destructive">{error}</p>}

                <Button type="submit" className="h-14 w-full uppercase tracking-widest" disabled={submitting || config?.enabled === false || Boolean(estimate?.tooLong)}>
                  {submitting ? "Creating agreement…" : "Reserve & review agreement"}
                </Button>
                <p className="text-center text-xs text-muted-foreground">No charge is made online. Payment and deposit are handled at pickup.</p>
              </form>
            </section>
          </div>
        )}
      </main>
    </PublicLayout>
  )
}
