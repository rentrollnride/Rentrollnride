import { PublicLayout } from "@/components/layout/PublicLayout"
import { SecondaryPhoneLink } from "@/components/public/SecondaryPhoneLink"

export default function Rates() {
  return (
    <PublicLayout>
      <div className="bg-primary text-primary-foreground pt-32 pb-24 px-6 relative overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex items-center gap-4 mb-8">
            <div className="h-[1px] w-8 bg-accent" />
            <span className="text-accent text-[11px] font-bold uppercase tracking-[0.2em]">Straightforward</span>
          </div>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black uppercase tracking-tighter mb-8 text-white">Rates & Terms</h1>
          <p className="text-lg md:text-xl text-primary-foreground/70 font-light max-w-2xl leading-relaxed">
            Published daily and weekly rates are shown with each vehicle. Call or text to confirm the total for your dates and review rental terms before pickup.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-24 md:py-32">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          <div className="lg:col-span-8 space-y-16">
            <section>
              <h2 className="text-3xl font-black uppercase tracking-tight mb-8">Published Rates</h2>
              <div className="prose prose-slate dark:prose-invert max-w-none text-muted-foreground leading-loose">
                <p className="text-lg text-foreground mb-6">
                  Vehicle listings with confirmed rates display a daily rate and a weekly rate. The weekly rate shown is the published weekly price; it is not a promise that a set number of days is free or that a discount will apply beyond the displayed rate.
                </p>
                <p>
                  Rates and vehicle availability may depend on the selected vehicle and rental dates. Confirm the applicable rate, rental duration, taxes or other charges, and total with our team before agreeing to rent. The rental agreement provided at pickup governs the transaction.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-3xl font-black uppercase tracking-tight mb-8">Deposit & Payment</h2>
              <div className="bg-secondary/50 p-8 md:p-10">
                <p className="text-lg text-foreground leading-relaxed mb-4">
                  A debit or credit card is required. A refundable $300 deposit is collected at pickup.
                </p>
                <p className="text-sm text-muted-foreground leading-loose">
                  Ask which card types are accepted and how the deposit is handled. Its refund is subject to the rental agreement and any permitted deductions. The process and timing for a refund or release will be reviewed at pickup; we do not promise an immediate release or a fixed bank-processing timeline.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-3xl font-black uppercase tracking-tight mb-8">Other Rental Terms</h2>
              <div className="prose prose-slate dark:prose-invert max-w-none text-muted-foreground leading-loose">
                <p>
                  Renters age 21 and older meet the standard age requirement. Ages 18 through 20 may rent with an under-age fee; confirm its amount before reserving. Before pickup, ask us to explain any applicable taxes, delivery or pickup charges, mileage limits, fuel or cleaning charges, additional-driver requirements, late-return charges, and other fees.
                </p>
                <p>
                  Cancellation, changes to rental dates, early returns, and refunds are handled under the terms agreed for that rental. Please ask about the applicable cancellation and refund terms before confirming; this page does not promise a cancellation window or refund.
                </p>
                <p>
                  Current insurance and a valid driver&apos;s license are required. Ask what proof of insurance is needed, whether your own coverage applies, and what options or responsibilities are set out in the rental agreement. Do not assume a particular coverage is included.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-3xl font-black uppercase tracking-tight mb-8">Privacy & Contact</h2>
              <div className="prose prose-slate dark:prose-invert max-w-none text-muted-foreground leading-loose">
                <p>
                  We arrange rentals by phone or text; this site does not take online bookings or payments. Contact us to ask how information shared during an inquiry or rental is handled. Please do not send card numbers, copies of identity documents, or other sensitive personal information by text.
                </p>
              </div>
            </section>
          </div>

          <div className="lg:col-span-4">
            <div className="sticky top-32 bg-primary text-primary-foreground p-8">
              <h3 className="text-xl font-black uppercase tracking-tight mb-6">Confirm Before Pickup</h3>
              <ul className="space-y-4 text-sm text-primary-foreground/70 leading-relaxed mb-8">
                <li>Vehicle, dates, and current availability</li>
                <li>Published rate and complete rental total</li>
                <li>Age 21+ standard; ages 18–20 permitted with an under-age fee</li>
                <li>Current insurance, valid driver&apos;s license, and debit or credit card</li>
                <li>Refundable $300 pickup deposit and any permitted deductions</li>
                <li>Cancellation, mileage, and other terms</li>
              </ul>
              <p className="text-xs text-primary-foreground/60 leading-relaxed mb-8">
                Rental terms are confirmed directly and in the agreement at pickup. There is no online booking or payment on this site.
              </p>
              <div className="space-y-3">
                <a
                  href="tel:+19193565164"
                  className="block w-full text-center bg-accent text-white px-6 py-4 text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-white hover:text-primary transition-colors"
                >
                  Call to Inquire
                </a>
                <a
                  href="sms:+19193565164"
                  className="block w-full text-center border border-primary-foreground/40 px-6 py-4 text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-white/10 transition-colors"
                >
                  Text to Inquire
                </a>
                <SecondaryPhoneLink className="block text-center py-2 text-xs font-bold text-accent hover:text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  )
}