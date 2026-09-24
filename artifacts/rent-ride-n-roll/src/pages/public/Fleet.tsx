import { PublicLayout } from "@/components/layout/PublicLayout"
import { SecondaryPhoneLink } from "@/components/public/SecondaryPhoneLink"
import { useGetPublicVehicles } from "@workspace/api-client-react"
import { Users, Settings, Phone } from "lucide-react"
import { VehicleImage } from "@/components/public/VehicleImage"
import { vehiclePhoto } from "@/components/public/vehicle-photos"
import { Link } from "wouter"

export default function Fleet() {
  const { data: vehicles, isLoading, isError, refetch } = useGetPublicVehicles()

  return (
    <PublicLayout>
      <div className="bg-primary text-primary-foreground pt-32 pb-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[#0a0a0a]">
          <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center mix-blend-luminosity" />
          <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/80 to-transparent" />
        </div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex items-center gap-4 mb-8">
            <div className="h-[1px] w-8 bg-accent" />
            <span className="text-accent text-[11px] font-bold uppercase tracking-[0.2em]">Our Collection</span>
          </div>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black uppercase tracking-tighter mb-8 text-white">The Fleet</h1>
          <p className="text-lg md:text-xl text-primary-foreground/70 font-light max-w-2xl leading-relaxed">
            Browse the fleet and contact us to confirm current vehicle details, rates, and availability for your dates.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-24 md:py-32">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="animate-pulse bg-secondary/50 h-[600px]" />
            ))}
          </div>
        ) : isError ? (
          <div className="text-center py-32 bg-secondary/30" role="alert">
            <h3 className="text-2xl font-black uppercase tracking-tight mb-4 text-foreground">Fleet information is temporarily unavailable</h3>
            <p className="text-muted-foreground text-lg">Please try again, or call or text us to ask about vehicles and dates.</p>
            <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
              <button
                type="button"
                onClick={() => refetch()}
                className="inline-flex items-center justify-center bg-primary text-primary-foreground px-8 py-4 text-sm font-bold uppercase tracking-[0.1em] hover:bg-accent transition-colors"
              >
                Try Again
              </button>
              <a href="tel:+19193565164" className="inline-flex items-center justify-center gap-3 border border-primary px-8 py-4 text-sm font-bold uppercase tracking-[0.1em] hover:bg-primary hover:text-primary-foreground transition-colors">
                <Phone className="w-4 h-4" /> Call to Inquire
              </a>
              <SecondaryPhoneLink className="text-sm font-bold text-accent hover:text-primary" />
            </div>
          </div>
        ) : vehicles?.length === 0 ? (
          <div className="text-center py-32 bg-secondary/30">
            <h3 className="text-2xl font-black uppercase tracking-tight mb-4 text-foreground">No Vehicles Currently Listed</h3>
            <p className="text-muted-foreground text-lg">Call or text us to ask about the fleet and your dates.</p>
            <div className="mt-8">
              <a href="tel:+19193565164" className="inline-flex items-center justify-center gap-3 bg-primary text-primary-foreground px-8 py-4 text-sm font-bold uppercase tracking-[0.1em] hover:bg-accent transition-colors">
                <Phone className="w-4 h-4" /> Call for Availability
              </a>
              <div className="mt-4"><SecondaryPhoneLink className="text-sm font-bold text-accent hover:text-primary" /></div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            {vehicles?.map(vehicle => (
              <div key={vehicle.id} className="bg-background flex flex-col group hover:shadow-2xl transition-all duration-500 border border-border/40">
                <div className="relative">
                  <VehicleImage 
                    src={vehiclePhoto(vehicle).src}
                    attribution={vehiclePhoto(vehicle).attribution}
                    alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                  />
                  {!vehicle.detailsPending && vehicle.vehicleClass && (
                    <div className="absolute top-4 right-4 bg-background/95 backdrop-blur-md px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] shadow-sm">
                      {vehicle.vehicleClass}
                    </div>
                  )}
                </div>
                
                <div className="p-8 flex-1 flex flex-col">
                  <div className="mb-6">
                    <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-[0.2em] mb-2">{vehicle.year}</p>
                    <h3 className="text-3xl font-black uppercase tracking-tight text-foreground group-hover:text-accent transition-colors">
                      {vehicle.make} <br/>{vehicle.model}
                    </h3>
                  </div>
                  
                  {vehicle.detailsPending ? (
                    <p className="text-sm text-muted-foreground mb-8 pb-8 border-b border-border/40">Vehicle details and rates are being confirmed. Please call for information.</p>
                  ) : (
                    <div className="flex flex-wrap gap-6 text-sm text-muted-foreground mb-8 pb-8 border-b border-border/40">
                      {vehicle.capacity !== null && <span className="flex items-center gap-2"><Users className="w-4 h-4 text-accent/70" /> {vehicle.capacity} Seats</span>}
                      {vehicle.transmission && <span className="flex items-center gap-2"><Settings className="w-4 h-4 text-accent/70" /> {vehicle.transmission}</span>}
                    </div>
                  )}

                  {vehicle.features && vehicle.features.length > 0 && (
                    <div className="mb-10">
                      <div className="flex flex-wrap gap-2">
                        {vehicle.features.map(f => (
                          <span key={f} className="text-[11px] uppercase tracking-wider bg-secondary text-secondary-foreground px-3 py-1.5 font-medium">
                            {f}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-auto">
                    {!vehicle.detailsPending && <div className="grid grid-cols-2 gap-6 mb-8">
                      <div>
                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-2">Daily Rate</div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-black text-foreground">${vehicle.dailyRate}</span>
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-2">Weekly Rate</div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-black text-foreground">${vehicle.weeklyRate}</span>
                        </div>
                      </div>
                    </div>}
                    
                     <Link
                       href={`/fleet/${vehicle.id}`}
                      className={`w-full inline-flex justify-center items-center gap-3 px-6 py-4 text-[11px] font-bold uppercase tracking-[0.2em] transition-colors ${
                       "bg-primary text-primary-foreground hover:bg-accent"
                      }`}
                    >
                       View Details <span aria-hidden="true">→</span>
                     </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PublicLayout>
  )
}
