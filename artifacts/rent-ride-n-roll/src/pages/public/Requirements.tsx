import { PublicLayout } from "@/components/layout/PublicLayout"
import { SecondaryPhoneLink } from "@/components/public/SecondaryPhoneLink"

export default function Requirements() {
  return (
    <PublicLayout>
      <div className="bg-primary text-primary-foreground pt-32 pb-24 px-6 relative overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex items-center gap-4 mb-8">
            <div className="h-[1px] w-8 bg-accent" />
            <span className="text-accent text-[11px] font-bold uppercase tracking-[0.2em]">Guidelines</span>
          </div>
          <h1 className="text-[clamp(2rem,9vw,3rem)] md:text-7xl lg:text-8xl font-black uppercase tracking-tighter mb-8 text-white">Before You Rent</h1>
          <p className="text-lg md:text-xl text-primary-foreground/70 font-light max-w-2xl leading-relaxed">
            Age 21 and older meets the standard age requirement. Ages 18 through 20 may rent with an under-age fee. Review what to bring before you reserve online or contact us for help.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-24 md:py-32">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 lg:gap-24">
          <div className="space-y-16">
            <section>
              <h2 className="text-3xl font-black uppercase tracking-tight mb-8">Age & Driver&apos;s License</h2>
              <div className="prose prose-slate dark:prose-invert max-w-none text-muted-foreground leading-loose">
                <p className="text-lg text-foreground mb-4">
                  Renters age 21 and older meet the standard age requirement. Renters age 18 through 20 are permitted, but an under-age fee applies.
                </p>
                <p className="text-sm">
                  Every renter must have a valid driver&apos;s license. Ask us to confirm the under-age fee amount before you reserve; no amount is published here. Additional-driver requirements should be confirmed before pickup.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-3xl font-black uppercase tracking-tight mb-8">Card & Refundable Deposit</h2>
              <div className="prose prose-slate dark:prose-invert max-w-none text-muted-foreground leading-loose">
                <p className="text-lg text-foreground mb-4">
                  A debit or credit card is required. A refundable $300 deposit is collected at pickup.
                </p>
                <p className="text-sm">
                  Ask which card types are accepted. The deposit is refundable subject to the rental agreement and any permitted deductions. We will review the return or release process at pickup; no immediate refund or fixed bank-processing time is promised.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-3xl font-black uppercase tracking-tight mb-8">Insurance</h2>
              <div className="prose prose-slate dark:prose-invert max-w-none text-muted-foreground leading-loose">
                <p className="text-lg text-foreground mb-4">
                  Current, up-to-date insurance is required for every renter.
                </p>
                <p className="text-sm">
                  Bring proof of current insurance. Confirm with our team whether your policy applies to the rental, what documentation is needed, and any coverage or responsibilities in the rental agreement. Do not assume a particular coverage is included.
                </p>
              </div>
            </section>
          </div>

          <div className="space-y-16">
            <section>
              <h2 className="text-3xl font-black uppercase tracking-tight mb-8">Vehicle Use & Travel</h2>
              <div className="bg-secondary/30 p-8 space-y-6">
                <div>
                  <h4 className="font-bold text-foreground uppercase tracking-tight mb-2">Use of the Vehicle</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Ask about any restrictions on vehicle use, smoking, pets, mileage, or other activities. Applicable requirements and any related charges should be confirmed before you agree to rent.
                  </p>
                </div>
                <div>
                  <h4 className="font-bold text-foreground uppercase tracking-tight mb-2">Travel Plans</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Tell us where you plan to travel, including travel outside the Raleigh-Durham area or North Carolina. Geographic permissions, mileage limits, and any related terms need to be confirmed for your rental.
                  </p>
                </div>
                <div>
                  <h4 className="font-bold text-foreground uppercase tracking-tight mb-2">Pickup & Return</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Confirm pickup and return location and times directly with our team. Return, late-return, fuel, and cleaning terms are governed by the rental agreement.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-3xl font-black uppercase tracking-tight mb-8">Changes & Cancellation</h2>
              <p className="text-muted-foreground leading-loose">
                Ask about cancellation, date changes, early returns, and any applicable refund terms before confirming your rental. The terms agreed for the rental and provided in writing at pickup control; no cancellation window or refund is promised on this page.
              </p>
            </section>

            <section className="border-l-2 border-accent pl-6">
              <h2 className="text-xl font-black uppercase tracking-tight mb-3">Confirm in Writing</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Review the rental agreement before signing or taking the vehicle. Ask our team to explain any requirement, fee, coverage, deposit, or policy that is unclear.
              </p>
              <div className="mt-6 flex flex-wrap gap-5 text-xs font-bold uppercase tracking-widest">
                <a href="tel:+19193565164" className="text-accent hover:text-primary">Call (919) 356-5164</a>
                <SecondaryPhoneLink className="text-accent hover:text-primary" />
                <a href="sms:+19193565164" className="text-accent hover:text-primary">Text Us</a>
              </div>
            </section>
          </div>
        </div>
      </div>
    </PublicLayout>
  )
}