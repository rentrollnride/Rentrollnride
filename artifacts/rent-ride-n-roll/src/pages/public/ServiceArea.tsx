import { PublicLayout } from "@/components/layout/PublicLayout"
import { SecondaryPhoneLink } from "@/components/public/SecondaryPhoneLink"
import { MapPin } from "lucide-react"

export default function ServiceArea() {
  return (
    <PublicLayout>
      <div className="bg-primary text-primary-foreground pt-32 pb-24 px-6 relative overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex items-center gap-4 mb-8">
            <div className="h-[1px] w-8 bg-accent" />
            <span className="text-accent text-[11px] font-bold uppercase tracking-[0.2em]">Location</span>
          </div>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black uppercase tracking-tighter mb-8 text-white">Service Area</h1>
          <p className="text-lg md:text-xl text-primary-foreground/70 font-light max-w-2xl leading-relaxed">
            Proudly serving the Raleigh-Durham metropolitan area.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-24 md:py-32">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
          <div className="lg:col-span-7">
            <h2 className="text-3xl font-black uppercase tracking-tight mb-8">Primary Coverage</h2>
            
            <div className="prose prose-slate dark:prose-invert max-w-none text-muted-foreground leading-loose">
              <p className="text-lg text-foreground mb-8">
                We serve the Raleigh-Durham area. Ask us to confirm whether your pickup, return, and planned travel locations can be accommodated under the rental terms.
              </p>
              
              <div className="grid grid-cols-2 gap-8 mb-12">
                <ul className="space-y-4 m-0 p-0 list-none">
                  <li className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-accent" /> Raleigh
                  </li>
                  <li className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-accent" /> Durham
                  </li>
                  <li className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-accent" /> Chapel Hill
                  </li>
                  <li className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-accent" /> Cary
                  </li>
                </ul>
                <ul className="space-y-4 m-0 p-0 list-none">
                  <li className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-accent" /> Apex
                  </li>
                  <li className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-accent" /> Wake Forest
                  </li>
                  <li className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-accent" /> Morrisville
                  </li>
                  <li className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-accent" /> RDU Airport
                  </li>
                </ul>
              </div>

              <div className="bg-secondary/30 p-8 border border-border/50">
                <h4 className="font-bold text-foreground uppercase tracking-tight mb-4">Out of State Travel</h4>
                <p className="text-sm">
                  Tell us about planned travel, including travel outside North Carolina. Any geographic permissions, mileage limits, and related terms must be confirmed for your rental before pickup.
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="bg-primary text-primary-foreground p-10 h-full flex flex-col justify-center">
              <h3 className="text-2xl font-black uppercase tracking-tight mb-6">Delivery & Pickup</h3>
              <p className="text-primary-foreground/70 leading-relaxed mb-8">
                Contact us to ask whether pickup or delivery can be arranged for your location and dates. Locations, timing, and any applicable charge need to be confirmed directly.
              </p>
              <div className="space-y-6 pt-8 border-t border-primary-foreground/10">
                <div>
                  <div className="text-[10px] font-bold text-accent uppercase tracking-[0.2em] mb-1">Standard Delivery</div>
                  <div className="text-sm text-primary-foreground/70">Confirm availability and any charge by phone or text</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-accent uppercase tracking-[0.2em] mb-1">RDU Airport Service</div>
                  <div className="text-sm text-primary-foreground/70">Ask us about pickup arrangements</div>
                </div>
              </div>
              <div className="mt-12">
                <a 
                  href="tel:+19193565164"
                  className="inline-flex justify-center items-center gap-3 w-full bg-accent text-white px-6 py-4 text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-white hover:text-primary transition-colors"
                >
                  Call to Arrange
                </a>
                <SecondaryPhoneLink className="block text-center mt-4 text-xs font-bold uppercase tracking-wider text-accent hover:text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  )
}
