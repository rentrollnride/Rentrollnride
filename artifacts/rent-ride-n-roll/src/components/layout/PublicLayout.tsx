import { Link, useLocation } from "wouter"
import { Menu, X, Phone, MessageSquare } from "lucide-react"
import { useState } from "react"
import { SecondaryPhoneLink } from "@/components/public/SecondaryPhoneLink"
import { BrandLogo, BrandMark } from "@/components/BrandLogo"

const NAV_LINKS = [
  { href: "/fleet", label: "Our Fleet" },
  { href: "/rates", label: "Rates" },
  { href: "/requirements", label: "Requirements" },
  { href: "/service-area", label: "Service Area" },
  { href: "/about", label: "About Us" },
]

export function PublicLayout({ children }: { children: React.ReactNode }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [location] = useLocation()

  return (
    <div className="public-surface min-h-screen flex flex-col bg-background selection:bg-accent selection:text-white">
      {/* Top Bar - Super clean and minimal */}
      <div className="bg-primary text-primary-foreground py-2 px-4 sm:px-6 text-xs font-semibold uppercase tracking-[0.12em] sm:tracking-[0.2em] flex flex-wrap justify-between items-center gap-x-4 gap-y-1">
        <span className="opacity-80 hidden sm:block">Raleigh-Durham Premium Automotive Rental</span>
        <span className="opacity-80 sm:hidden">Raleigh-Durham, NC</span>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <a href="tel:+19193565164" className="hover:text-accent transition-colors flex items-center gap-2">
            <Phone className="w-3 h-3" /> Call: (919) 356-5164
          </a>
          <SecondaryPhoneLink className="hover:text-accent transition-colors" />
        </div>
      </div>

      {/* Main Nav */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border/40 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 lg:h-24 flex items-center justify-between">
          <Link href="/" aria-label="Rent Ride Roll LLC home" className="flex items-center gap-2 sm:gap-3 group shrink-0">
            <div className="w-11 h-11 sm:w-14 sm:h-14 bg-primary flex items-center justify-center transition-transform group-hover:scale-105">
              <BrandMark className="w-10 h-9 sm:w-12 sm:h-11" />
            </div>
            <span className="font-bold text-xs sm:text-lg leading-none tracking-tight uppercase group-hover:text-accent transition-colors">Rent Ride Roll LLC</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-10">
            {NAV_LINKS.map(link => (
              <Link 
                key={link.href} 
                href={link.href}
                className={`text-[13px] font-semibold uppercase tracking-[0.1em] transition-colors hover:text-accent ${
                  location === link.href ? "text-accent" : "text-foreground/80"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="flex items-center gap-4 ml-4">
              <a href="tel:+19193565164" className="bg-primary text-primary-foreground px-6 py-3 text-[13px] font-bold uppercase tracking-[0.1em] hover:bg-accent transition-colors flex items-center gap-2">
                <Phone className="w-4 h-4" /> Call to Reserve
              </a>
              <SecondaryPhoneLink className="text-xs font-bold text-foreground/80 hover:text-accent whitespace-nowrap" />
            </div>
          </nav>

          {/* Mobile Actions & Menu Toggle */}
          <div className="lg:hidden flex items-center gap-1 sm:gap-3">
            <a href="tel:+19193565164" aria-label="Call Rent Ride Roll LLC at (919) 356-5164" className="p-2 text-foreground hover:text-accent">
              <Phone className="w-5 h-5" />
            </a>
            <a href="sms:+19193565164" aria-label="Text Rent Ride Roll LLC at (919) 356-5164" className="p-2 text-foreground hover:text-accent">
              <MessageSquare className="w-5 h-5" />
            </a>
            <button 
              className="p-2 text-foreground hover:text-accent transition-colors"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
              aria-expanded={isMenuOpen}
              aria-controls="mobile-navigation"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        <div
          id="mobile-navigation"
          aria-hidden={!isMenuOpen}
          inert={!isMenuOpen}
          className={`lg:hidden overflow-hidden transition-all duration-300 ease-in-out ${isMenuOpen ? 'max-h-screen opacity-100 border-b border-border/40' : 'max-h-0 opacity-0'}`}
        >
          <div className="bg-background px-6 py-8 flex flex-col gap-6">
            <nav className="flex flex-col gap-6">
              {NAV_LINKS.map(link => (
                <Link 
                  key={link.href} 
                  href={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`text-lg font-semibold uppercase tracking-widest ${
                    location === link.href ? "text-accent" : "text-foreground"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="pt-8 border-t border-border flex flex-col gap-4">
              <a 
                href="tel:+19193565164" 
                onClick={() => setIsMenuOpen(false)}
                className="bg-primary text-primary-foreground px-6 py-4 text-center block text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-2"
              >
                <Phone className="w-4 h-4" /> Call to Reserve
              </a>
              <a 
                href="sms:+19193565164" 
                onClick={() => setIsMenuOpen(false)}
                className="border border-border bg-transparent text-foreground px-6 py-4 text-center block text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-2"
              >
                <MessageSquare className="w-4 h-4" /> Text to Reserve
              </a>
              <SecondaryPhoneLink className="text-sm font-bold uppercase tracking-wider text-accent text-center py-2" />
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        {children}
      </main>

      {/* Minimal, Editorial Footer */}
      <footer className="bg-primary text-primary-foreground pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-12 gap-16 md:gap-8">
          <div className="md:col-span-5">
            <BrandLogo className="w-44 h-48 mb-5" />
            <p className="text-primary-foreground/60 max-w-sm text-sm leading-loose">
              Premium automotive rentals serving the Raleigh-Durham area. Delivering confidence and quality on every journey.
            </p>
          </div>
          
          <div className="md:col-span-3 md:col-start-7">
            <h4 className="font-bold uppercase tracking-[0.2em] mb-8 text-xs text-primary-foreground/60">Navigation</h4>
            <ul className="space-y-4">
              {NAV_LINKS.map(link => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-primary-foreground/80 hover:text-accent transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-3">
            <h4 className="font-bold uppercase tracking-[0.2em] mb-8 text-xs text-primary-foreground/60">Contact</h4>
            <ul className="space-y-4 text-sm text-primary-foreground/80">
              <li>
                <a href="tel:+19193565164" className="hover:text-accent transition-colors flex items-center gap-3">
                  <Phone className="w-4 h-4 text-accent" /> (919) 356-5164
                </a>
              </li>
              <li>
                <SecondaryPhoneLink className="hover:text-accent transition-colors" />
              </li>
              <li>
                <a href="sms:+19193565164" className="hover:text-accent transition-colors flex items-center gap-3">
                  <MessageSquare className="w-4 h-4 text-accent" /> Text (919) 356-5164
                </a>
              </li>
              <li className="pt-2 text-primary-foreground/50">
                Raleigh-Durham, NC
              </li>
            </ul>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-6 mt-24 pt-8 border-t border-primary-foreground/10 flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-xs uppercase tracking-widest text-primary-foreground/60">
            &copy; {new Date().getFullYear()} Rent Ride Roll LLC.
          </p>
          <div className="flex items-center gap-5 text-xs uppercase tracking-wider">
            <Link href="/privacy" className="text-primary-foreground/60 hover:text-white">Privacy</Link>
            <Link href="/terms" className="text-primary-foreground/60 hover:text-white">Terms</Link>
            <Link href="/admin/login" className="text-primary-foreground/40 hover:text-white font-bold transition-colors">Admin</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
