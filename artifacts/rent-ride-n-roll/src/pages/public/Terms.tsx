import { PublicLayout } from "@/components/layout/PublicLayout"
import { Seo } from "@/components/public/Seo"

export default function Terms() {
  return (
    <PublicLayout>
      <Seo title="Website Terms | Rent Ride Roll LLC" description="Terms for using the Rent Ride Roll LLC website." path="/terms" />
      <article className="max-w-3xl mx-auto px-6 py-16 sm:py-24 space-y-8 leading-relaxed">
        <header><p className="text-sm font-bold uppercase tracking-widest text-accent">Effective September 25, 2026</p><h1 className="text-4xl font-extrabold uppercase tracking-tight mt-3">Website Terms</h1></header>
        <p>This website provides general information about Rent Ride Roll LLC. It does not create a reservation or rental agreement. Vehicle availability, rates, deposits, fees, eligibility, pickup details, and final terms must be confirmed directly with us.</p>
        <section><h2 className="text-xl font-bold uppercase mb-3">No online reservation</h2><p>Calling or texting is an inquiry only until Rent Ride Roll LLC expressly confirms the reservation. Displayed vehicles may use representative photography; the actual vehicle and condition are confirmed before rental.</p></section>
        <section><h2 className="text-xl font-bold uppercase mb-3">Rental requirements</h2><p>Standard renters must be at least 21. Renters ages 18–20 may be accepted with an under-age fee. A valid driver license, acceptable insurance, a debit or credit card, and the stated security deposit are required, subject to the signed rental agreement.</p></section>
        <section><h2 className="text-xl font-bold uppercase mb-3">Accuracy and acceptable use</h2><p>We work to keep information current but do not guarantee that every listing or rate is continuously available. You may not misuse the website, attempt unauthorized access, or interfere with its operation.</p></section>
        <section><h2 className="text-xl font-bold uppercase mb-3">Contact</h2><p>Questions about these terms may be directed to <a className="text-accent underline" href="tel:+19193565164">(919) 356-5164</a>.</p></section>
      </article>
    </PublicLayout>
  )
}
