import { useState } from "react"
import { Car } from "lucide-react"

interface VehicleImageProps {
  src?: string | null
  alt: string
  className?: string
  aspectRatio?: string
  eager?: boolean
  attribution?: { author: string; href: string } | null
}

export function VehicleImage({ src, alt, className = "", aspectRatio = "aspect-[16/10]", eager = false, attribution }: VehicleImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  const hasImage = src && src !== failedSrc

  return (
    <div className={`relative overflow-hidden bg-muted group ${aspectRatio} ${className}`}>
      {hasImage ? (
        <img 
          src={src} 
          srcSet={src.startsWith(`${import.meta.env.BASE_URL}vehicles/`) ? `${src.replace(".webp", "-sm.webp")} 600w, ${src} 1200w` : undefined}
          sizes="(min-width: 1024px) 45vw, (min-width: 768px) 50vw, 100vw"
          alt={alt} 
          onError={() => setFailedSrc(src)}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          width={1200}
          height={750}
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center bg-[#1a1a1a] text-white">
          <Car className="w-16 h-16 text-white/20 mb-4" />
          <span className="text-xs font-bold uppercase tracking-widest text-white/40">{alt}</span>
          <span className="text-[10px] uppercase tracking-widest text-accent mt-2">Image Unavailable</span>
        </div>
      )}
      {hasImage && <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/70">
        <p className="text-[10px] leading-snug text-white/90 uppercase tracking-wide text-center">
          Vehicle shown is representative. Actual vehicle, color and features may vary.
        </p>
        {attribution && (
          <p className="text-center text-[10px] text-white/75">
            Photo: <a href={attribution.href} target="_blank" rel="noopener noreferrer" className="underline hover:text-white">{attribution.author}</a>
            {" · "}<a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener noreferrer" className="underline hover:text-white">CC BY-SA 4.0</a>{" · cropped"}
          </p>
        )}
      </div>}
    </div>
  )
}
