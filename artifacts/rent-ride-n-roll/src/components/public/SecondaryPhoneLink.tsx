export function SecondaryPhoneLink({ className = "" }: { className?: string }) {
  return (
    <a
      href="tel:+19193538543"
      className={className}
      aria-label="Also call Rent Ride Roll LLC at (919) 353-8543"
    >
      Also call: (919) 353-8543
    </a>
  )
}