import { PublicLayout } from "@/components/layout/PublicLayout"

export default function About() {
  return (
    <PublicLayout>
      <div className="bg-primary text-primary-foreground pt-32 pb-24 px-6 relative overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex items-center gap-4 mb-8">
            <div className="h-[1px] w-8 bg-accent" />
            <span className="text-accent text-[11px] font-bold uppercase tracking-[0.2em]">Our Story</span>
          </div>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black uppercase tracking-tighter mb-8 text-white">About Us</h1>
          <p className="text-lg md:text-xl text-primary-foreground/70 font-light max-w-2xl leading-relaxed">
              A local point of contact for daily and weekly vehicle rentals in the Raleigh-Durham area.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-24 md:py-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24">
          <div className="prose prose-slate dark:prose-invert max-w-none text-muted-foreground leading-loose">
            <h2 className="text-3xl font-black text-foreground uppercase tracking-tight mb-8">The Rent Ride Roll LLC Difference</h2>
            
            <p className="text-lg text-foreground mb-6">
              Rent Ride Roll LLC offers a local way to inquire about vehicle rentals in the Raleigh-Durham area. Our public listings share configured vehicle details and daily and weekly rates; our team can discuss dates and rental terms directly.
            </p>
            
            <p className="mb-6">
              Rentals are arranged by phone or text rather than through an online booking or payment flow. Before pickup, customers can ask about the full price, requirements, and terms that apply to their rental.
            </p>

            <p>
              Explore the vehicles currently listed and contact us to confirm availability for your dates. Vehicle details, pickup arrangements, and any applicable requirements are confirmed directly.
            </p>
          </div>

          <div>
            <div className="bg-secondary/30 p-10 h-full flex flex-col justify-center border border-border/50">
              <h3 className="text-2xl font-black uppercase tracking-tight mb-8 text-foreground">Our Core Principles</h3>
              
              <div className="space-y-8">
                <div>
                  <h4 className="text-[11px] font-bold text-accent uppercase tracking-[0.2em] mb-2">Absolute Transparency</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Listings with confirmed pricing display vehicle rates. A refundable $300 deposit is collected at pickup, subject to the agreement and any permitted deductions. Confirm the complete total and any other applicable charges before agreeing to rent.
                  </p>
                </div>
                
                <div>
                  <h4 className="text-[11px] font-bold text-accent uppercase tracking-[0.2em] mb-2">Fleet Quality</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Vehicle information is published for customer reference. Ask us to confirm the vehicle and its condition at pickup.
                  </p>
                </div>

                <div>
                  <h4 className="text-[11px] font-bold text-accent uppercase tracking-[0.2em] mb-2">Direct Communication</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    We arrange inquiries by phone and text. Rental dates, availability, and applicable terms are confirmed directly with our team.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  )
}
