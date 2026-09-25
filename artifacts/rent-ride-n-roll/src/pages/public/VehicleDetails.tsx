import { useGetPublicVehicles } from "@workspace/api-client-react"
import { useParams, Link } from "wouter"
import { ArrowLeft, Phone, MessageSquare, Users, Settings, FileSignature } from "lucide-react"
import { PublicLayout } from "@/components/layout/PublicLayout"
import { SecondaryPhoneLink } from "@/components/public/SecondaryPhoneLink"
import { VehicleImage } from "@/components/public/VehicleImage"
import { vehiclePhoto } from "@/components/public/vehicle-photos"
import { RentalRequirementsSummary } from "@/components/public/RentalRequirementsSummary"

export default function VehicleDetails() {
  const { id } = useParams<{ id: string }>()
  const { data: vehicles, isLoading, isError } = useGetPublicVehicles()
  const vehicle = vehicles?.find((item) => item.id === id)

  return (
    <PublicLayout>
      <main className="mx-auto w-full max-w-7xl px-6 py-12 md:py-20">
        <Link href="/fleet" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-accent">
          <ArrowLeft className="h-4 w-4" /> Back to fleet
        </Link>
        {isLoading ? (
          <p className="py-24 text-lg">Loading vehicle…</p>
        ) : isError ? (
          <p role="alert" className="py-24 text-lg">Unable to load this vehicle. Please try again later.</p>
        ) : !vehicle ? (
          <p className="py-24 text-lg">This vehicle is not currently listed.</p>
        ) : (
          <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,1fr)] lg:gap-16">
            <VehicleImage
              src={vehiclePhoto(vehicle).src}
              attribution={vehiclePhoto(vehicle).attribution}
              alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
              eager
            />
            <div className="flex flex-col justify-center">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">
                 {vehicle.year}{vehicle.vehicleClass ? ` · ${vehicle.vehicleClass}` : ""}
              </p>
              <h1 className="mt-4 text-5xl font-black uppercase leading-none tracking-tight md:text-6xl">
                {vehicle.make} {vehicle.model}
              </h1>
              <p className="mt-6 text-sm font-bold uppercase tracking-widest">
                 {vehicle.detailsPending ? "Details pending confirmation" : "Reserve online for your dates"}
              </p>
              {!vehicle.detailsPending && <div className="mt-8 flex flex-wrap gap-7 text-muted-foreground">
                {vehicle.capacity !== null && <span className="flex items-center gap-2"><Users className="h-5 w-5 text-accent" /> {vehicle.capacity} passengers</span>}
                {vehicle.transmission && <span className="flex items-center gap-2"><Settings className="h-5 w-5 text-accent" /> {vehicle.transmission}</span>}
              </div>}
              {vehicle.features && vehicle.features.length > 0 && (
                <div className="mt-8 flex flex-wrap gap-2">
                  {vehicle.features.map((feature) => (
                    <span key={feature} className="bg-secondary px-3 py-2 text-xs uppercase tracking-wide">{feature}</span>
                  ))}
                </div>
              )}
              {!vehicle.detailsPending && <div className="mt-10 grid grid-cols-2 gap-6 border-t border-border pt-8">
                <div><p className="text-xs uppercase tracking-widest text-muted-foreground">Daily</p><p className="mt-2 text-3xl font-black">${vehicle.dailyRate}</p></div>
                <div><p className="text-xs uppercase tracking-widest text-muted-foreground">Weekly</p><p className="mt-2 text-3xl font-black">${vehicle.weeklyRate}</p></div>
              </div>}
              <p className="mt-5 text-sm text-muted-foreground">
                {vehicle.detailsPending
                  ? "We have not published this vehicle's rates, specifications, photo, or availability. Call for current details."
                  : "Reserve online to hold your dates while you electronically sign the rental agreement. A refundable $300 deposit is collected at pickup, subject to the agreement and any permitted deductions."}
              </p>
              <RentalRequirementsSummary className="mt-7" />
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                {!vehicle.detailsPending && vehicle.status !== "maintenance" && (
                  <Link href={`/reserve/${vehicle.id}`} className="inline-flex min-h-12 items-center justify-center gap-2 bg-accent px-6 py-3 text-sm font-bold uppercase tracking-wide text-white">
                    <FileSignature className="h-4 w-4" /> Reserve online & sign
                  </Link>
                )}
                {vehicle.status === "maintenance" && (
                  <div className="inline-flex min-h-12 items-center justify-center border border-border bg-secondary px-6 py-3 text-sm font-bold uppercase tracking-wide text-muted-foreground">
                    Temporarily unavailable
                  </div>
                )}
                <a href="tel:+19193565164" className="inline-flex min-h-12 items-center justify-center gap-2 border border-foreground px-6 py-3 text-sm font-bold uppercase tracking-wide"><Phone className="h-4 w-4" /> {vehicle.detailsPending ? "Call for details" : "Call us"}</a>
                <a href="sms:+19193565164" className="inline-flex min-h-12 items-center justify-center gap-2 border border-foreground px-6 py-3 text-sm font-bold uppercase tracking-wide"><MessageSquare className="h-4 w-4" /> Text us</a>
              </div>
              <SecondaryPhoneLink className="mt-3 inline-block text-sm font-bold text-accent hover:text-primary" />
            </div>
          </div>
        )}
      </main>
    </PublicLayout>
  )
}