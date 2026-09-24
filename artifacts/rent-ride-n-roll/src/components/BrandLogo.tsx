const base = import.meta.env.BASE_URL

export function BrandMark({ className = "" }: { className?: string }) {
  return <img src={`${base}brand-mark.webp`} alt="" className={`object-contain ${className}`} />
}

export function BrandLogo({ className = "" }: { className?: string }) {
  return (
    <img
      src={`${base}brand-logo.webp`}
      alt="Rent Ride Roll LLC"
      className={`object-contain ${className}`}
    />
  )
}