import { PublicLayout } from "@/components/layout/PublicLayout"
import { Phone, MessageSquare, MapPin } from "lucide-react"
import { SecondaryPhoneLink } from "@/components/public/SecondaryPhoneLink"
import { RentalRequirementsSummary } from "@/components/public/RentalRequirementsSummary"

export default function Contact() {
  return (
    <PublicLayout>
      <div className="bg-primary text-primary-foreground pt-32 pb-24 px-6 relative overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex items-center gap-4 mb-8">
            <div className="h-[1px] w-8 bg-accent" />
            <span className="text-accent text-[11px] font-bold uppercase tracking-[0.2em]">Get in Touch</span>
          </div>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black uppercase tracking-tighter mb-8 text-white">Contact Us</h1>
          <p className="text-lg md:text-xl text-primary-foreground/70 font-light max-w-2xl leading-relaxed">
            Contact us by phone or text to discuss vehicle availability, rates, pickup arrangements, and rental terms. This site does not take online bookings or payments.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-24 md:py-32">
        <RentalRequirementsSummary className="mb-12 max-w-3xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 lg:gap-24">
          
          <div className="space-y-12">
            <h2 className="text-3xl font-black uppercase tracking-tight mb-8">Direct Lines</h2>
            
            <div className="group block bg-secondary/30 border border-border/50 p-8 hover:bg-secondary/50 transition-colors">
              <div className="flex items-start gap-6">
                <div className="w-12 h-12 bg-primary text-white flex items-center justify-center shrink-0">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-bold uppercase tracking-tight mb-2">Text to Reserve</h3>
                  <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                    Share your dates and preferred vehicle class to ask about availability. We will confirm details directly with you.
                  </p>
                  <a 
                    href="sms:+19193565164"
                    className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-accent hover:text-primary transition-colors"
                  >
                    Text (919) 356-5164 →
                  </a>
                </div>
              </div>
            </div>

            <div className="group block bg-secondary/30 border border-border/50 p-8 hover:bg-secondary/50 transition-colors">
              <div className="flex items-start gap-6">
                <div className="w-12 h-12 bg-primary text-white flex items-center justify-center shrink-0">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-bold uppercase tracking-tight mb-2">Call to Reserve</h3>
                  <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                    Speak with our team about arranging a rental, asking about pickup or delivery options, and reviewing terms.
                  </p>
                  <div className="flex flex-col items-start gap-3 text-[11px] font-bold uppercase tracking-[0.2em]">
                    <a href="tel:+19193565164" className="text-accent hover:text-primary transition-colors">Call (919) 356-5164 →</a>
                    <SecondaryPhoneLink className="text-accent hover:text-primary transition-colors" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="bg-primary text-primary-foreground p-10 h-full flex flex-col justify-center">
              <h3 className="text-2xl font-black uppercase tracking-tight mb-10">Operations</h3>
              
              <div className="space-y-10">
                <div className="flex items-start gap-4">
                  <MapPin className="w-5 h-5 text-accent shrink-0 mt-1" />
                  <div>
                    <h4 className="text-[11px] font-bold text-primary-foreground/50 uppercase tracking-[0.2em] mb-2">Service Area</h4>
                    <p className="text-primary-foreground/90 leading-relaxed">
                      Raleigh-Durham Metropolitan Area<br />
                      North Carolina
                    </p>
                  </div>
                </div>

                <p className="text-sm text-primary-foreground/70 leading-relaxed">
                  Ask us about dates, vehicle availability, accepted debit or credit cards, and rental terms. Details are confirmed directly before pickup.
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </PublicLayout>
  )
}
