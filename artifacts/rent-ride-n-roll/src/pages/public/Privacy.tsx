import { PublicLayout } from "@/components/layout/PublicLayout"
import { Seo } from "@/components/public/Seo"

export default function Privacy() {
  return (
    <PublicLayout>
      <Seo title="Privacy Policy | Rent Ride Roll LLC" description="How Rent Ride Roll LLC handles customer information." path="/privacy" />
      <article className="max-w-3xl mx-auto px-6 py-16 sm:py-24 space-y-8 leading-relaxed">
        <header><p className="text-sm font-bold uppercase tracking-widest text-accent">Effective September 25, 2026</p><h1 className="text-4xl font-extrabold uppercase tracking-tight mt-3">Privacy Policy</h1></header>
        <p>Rent Ride Roll LLC collects only the information needed to answer inquiries, prepare and manage rentals, verify eligibility, collect payment, and meet legal and insurance obligations. This may include contact details, driver and insurance information, payment status, rental history, and vehicle records.</p>
        <section><h2 className="text-xl font-bold uppercase mb-3">How information is used</h2><p>We use customer information to communicate about availability, administer rentals, protect vehicles and customers, prevent fraud, keep required business records, and improve operations. We do not sell personal information.</p></section>
        <section><h2 className="text-xl font-bold uppercase mb-3">Sharing and retention</h2><p>Information may be shared with service providers, insurers, payment processors, law enforcement, or other parties when needed to provide a rental or comply with law. Records are retained only as long as reasonably necessary for those purposes.</p></section>
        <section><h2 className="text-xl font-bold uppercase mb-3">Your choices</h2><p>You may ask to review or correct your contact information by calling <a className="text-accent underline" href="tel:+19193565164">(919) 356-5164</a>. Do not send driver-license, insurance, or payment-card details through ordinary text messages.</p></section>
        <section><h2 className="text-xl font-bold uppercase mb-3">Website data</h2><p>This website does not offer online booking and does not intentionally collect payment-card or driver-license data. Hosting and security providers may process basic request logs such as IP address, browser type, and timestamps.</p></section>
      </article>
    </PublicLayout>
  )
}
