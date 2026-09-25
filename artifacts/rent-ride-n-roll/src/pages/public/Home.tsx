import { SecondaryPhoneLink } from "@/components/public/SecondaryPhoneLink"
import { PublicLayout } from "@/components/layout/PublicLayout"
import { ArrowRight, ShieldCheck, MapPin, Clock, Phone, Settings, Users } from "lucide-react"
import { Link } from "wouter"
import { useGetPublicVehicles } from "@workspace/api-client-react"
import { VehicleImage } from "@/components/public/VehicleImage"
import { vehiclePhoto } from "@/components/public/vehicle-photos"
import { RentalRequirementsSummary } from "@/components/public/RentalRequirementsSummary"

export default function Home() {
  const { data: vehicles, isLoading, isError, refetch } = useGetPublicVehicles()
  
  // Show max 3 vehicles on home
  const featured = vehicles?.slice(0, 3) || []

  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="relative bg-primary text-primary-foreground overflow-hidden min-h-[85vh] flex items-center">
        <div className="absolute inset-0 bg-[#0a0a0a]">
          <img 
            src={`${import.meta.env.BASE_URL}vehicles/hero.webp`}
            alt="Premium automotive" 
            className="w-full h-full object-cover opacity-40 mix-blend-luminosity"
            width={1800}
            height={1100}
            fetchPriority="high"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/80 to-transparent" />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-6 py-24 w-full flex flex-col items-start z-10">
          <div className="flex items-center gap-4 mb-8">
            <div className="h-[1px] w-8 bg-accent" />
            <span className="text-accent text-[11px] font-bold uppercase tracking-[0.2em]">Raleigh-Durham, NC</span>
          </div>
          
          <h1 className="text-[clamp(2.6rem,10vw,6rem)] lg:text-9xl font-black uppercase tracking-tighter max-w-4xl leading-[0.92] text-white">
            Drive With <br />
            <span className="text-accent">Confidence.</span>
          </h1>
          
          <p className="mt-8 text-lg md:text-xl max-w-xl text-primary-foreground/70 font-light leading-relaxed">
              Daily and weekly rental rates for Raleigh-Durham. Reserve online, review the agreement, and sign electronically on the site, or call or text us for help.
          </p>
          <RentalRequirementsSummary dark className="mt-8 max-w-xl" />
          <div className="mt-12 flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-6 w-full sm:w-auto">
            <a 
              href="tel:+19193565164" 
              className="inline-flex items-center justify-center gap-3 bg-accent text-white px-8 py-4 text-sm font-bold uppercase tracking-[0.1em] hover:bg-white hover:text-primary transition-colors group"
            >
              <Phone className="w-4 h-4" /> Call to Reserve
            </a>
            <SecondaryPhoneLink className="text-white font-bold text-sm hover:text-accent" />
            <Link 
              href="/fleet"
              className="inline-flex items-center justify-center gap-3 bg-transparent border border-white/30 text-white px-8 py-4 text-sm font-bold uppercase tracking-[0.1em] hover:bg-white/10 transition-colors group"
            >
              View Fleet <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* Value Props - High End Editorial */}
      <section className="py-32 bg-background">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-16 md:gap-12 lg:gap-24">
          <div className="flex flex-col items-start">
            <ShieldCheck className="w-8 h-8 text-accent mb-8" />
            <h3 className="text-xl font-bold uppercase tracking-tight mb-4 text-foreground">Straightforward Pricing</h3>
            <p className="text-muted-foreground text-sm leading-loose">
              Listings with confirmed pricing show daily and weekly rates. A refundable $300 deposit is collected at pickup, subject to the rental agreement and any permitted deductions. Confirm your complete rental total and terms with our team in advance.
            </p>
          </div>
          <div className="flex flex-col items-start">
            <MapPin className="w-8 h-8 text-accent mb-8" />
            <h3 className="text-xl font-bold uppercase tracking-tight mb-4 text-foreground">Local Expertise</h3>
            <p className="text-muted-foreground text-sm leading-loose">
              Serving Raleigh-Durham and surrounding communities. Call or text our team to ask about rental availability.
            </p>
          </div>
          <div className="flex flex-col items-start">
            <Clock className="w-8 h-8 text-accent mb-8" />
            <h3 className="text-xl font-bold uppercase tracking-tight mb-4 text-foreground">Fast Setup</h3>
            <p className="text-muted-foreground text-sm leading-loose">
              Reserve online and complete your rental agreement electronically before pickup, or contact us by phone or text for help.
            </p>
          </div>
        </div>
      </section>

      {/* Featured Fleet */}
      <section className="py-32 bg-secondary/50 border-t border-border/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
            <div className="max-w-2xl">
              <div className="flex items-center gap-4 mb-4">
                <div className="h-[1px] w-8 bg-accent" />
                <span className="text-accent text-[11px] font-bold uppercase tracking-[0.2em]">Our Collection</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter">Premium Fleet</h2>
            </div>
            <Link 
              href="/fleet"
              className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-foreground hover:text-accent transition-colors group"
            >
              View Full Collection <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse bg-background h-[500px]" />
              ))}
            </div>
          ) : isError ? (
            <div className="bg-background px-8 py-16 text-center">
              <h3 className="text-2xl font-black uppercase tracking-tight mb-4">Fleet information is temporarily unavailable</h3>
              <p className="text-muted-foreground mb-6">Call or text us to ask about vehicles and dates.</p>
              <div className="flex flex-wrap justify-center gap-5">
                <button type="button" onClick={() => refetch()} className="text-sm font-bold uppercase tracking-widest text-accent hover:text-primary">Try Again</button>
                <a href="tel:+19193565164" className="text-sm font-bold uppercase tracking-widest text-accent hover:text-primary">Call to Inquire</a>
                <SecondaryPhoneLink className="text-sm font-bold uppercase tracking-widest text-accent hover:text-primary" />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              {featured.map(vehicle => (
                 <div key={vehicle.id} className="group bg-background overflow-hidden hover:shadow-xl transition-all duration-500 flex flex-col">
                  <div className="relative">
                    <VehicleImage 
                       src={vehiclePhoto(vehicle).src}
                       attribution={vehiclePhoto(vehicle).attribution}
                      alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`} 
                       eager={featured[0]?.id === vehicle.id}
                    />
                  </div>
                  
                  <div className="p-8 flex flex-col flex-1">
                    <div className="mb-6">
                      <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-[0.2em] mb-2">
                        {vehicle.year}{vehicle.vehicleClass ? ` • ${vehicle.vehicleClass}` : ""}
                      </p>
                      <h3 className="text-2xl font-black uppercase tracking-tight text-foreground group-hover:text-accent transition-colors">
                        {vehicle.make} {vehicle.model}
                      </h3>
                    </div>
                    
                    {vehicle.detailsPending ? (
                      <p className="text-sm text-muted-foreground mb-8">Vehicle details and rates are being confirmed.</p>
                    ) : (
                      <div className="flex items-center gap-6 text-sm text-muted-foreground mb-8">
                        {vehicle.capacity !== null && <span className="flex items-center gap-2"><Users className="w-4 h-4 text-accent/70" /> {vehicle.capacity}</span>}
                        {vehicle.transmission && <span className="flex items-center gap-2"><Settings className="w-4 h-4 text-accent/70" /> {vehicle.transmission}</span>}
                      </div>
                    )}
                    
                    <div className="mt-auto pt-6 border-t border-border/50 flex justify-between items-end">
                      {!vehicle.detailsPending ? <div>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">From</span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-black text-foreground">${vehicle.dailyRate}</span>
                          <span className="text-xs text-muted-foreground uppercase tracking-wider">/day</span>
                        </div>
                      </div> : <span className="text-xs text-muted-foreground">Details pending</span>}
                      <Link href={`/fleet/${vehicle.id}`} className="text-[11px] font-bold uppercase tracking-[0.15em] text-accent flex items-center gap-2 group-hover:gap-3 transition-all">
                        Details <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                 </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-32 bg-primary text-primary-foreground text-center px-6 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-16 bg-accent" />
        
        <div className="max-w-3xl mx-auto relative z-10">
          <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-8">Ready to Roll?</h2>
          <p className="text-lg mb-12 text-primary-foreground/70 font-light leading-relaxed">
            Choose a vehicle and submit a reservation online. Your dates are held while you electronically sign the rental agreement. Payment and the refundable deposit are handled at pickup.
          </p>
          <RentalRequirementsSummary dark className="mx-auto max-w-2xl mb-10" />
          <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-6 justify-center">
            <a 
              href="tel:+19193565164"
              className="inline-flex items-center justify-center gap-3 bg-accent text-white px-8 py-4 text-sm font-bold uppercase tracking-[0.1em] hover:bg-white hover:text-primary transition-colors"
            >
              <Phone className="w-4 h-4" /> Call to Reserve
            </a>
            <a 
              href="sms:+19193565164"
              className="inline-flex items-center justify-center gap-3 bg-transparent border border-white/30 text-white px-8 py-4 text-sm font-bold uppercase tracking-[0.1em] hover:bg-white/10 transition-colors"
            >
              Text to Reserve
            </a>
            <SecondaryPhoneLink className="text-white font-bold text-sm hover:text-accent" />
          </div>
        </div>
      </section>
    </PublicLayout>
  )
}
