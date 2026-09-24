import { Link } from "wouter"

export function RentalRequirementsSummary({
  dark = false,
  className = "",
}: {
  dark?: boolean
  className?: string
}) {
  return (
    <div className={`border-l-2 border-accent pl-5 text-left ${className}`}>
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-accent">Before you reserve</p>
      <p className={`mt-2 text-sm leading-relaxed ${dark ? "text-white/80" : "text-muted-foreground"}`}>
        Age 21+ meets the standard requirement. Ages 18–20 may rent with an under-age fee;
        confirm the fee before reserving. Bring current insurance, a valid driver&apos;s license,
        and a debit or credit card. A refundable $300 deposit is collected at pickup, subject
        to the rental agreement and any permitted deductions.
      </p>
      <Link
        href="/requirements"
        className={`mt-2 inline-block text-xs font-bold uppercase tracking-wider underline underline-offset-4 ${dark ? "text-white hover:text-accent" : "text-accent hover:text-primary"}`}
      >
        See full requirements
      </Link>
    </div>
  )
}