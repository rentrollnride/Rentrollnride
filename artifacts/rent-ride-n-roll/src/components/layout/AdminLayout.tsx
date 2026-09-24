import { Link, useLocation } from "wouter"
import { Calendar, Car, Users, Settings, Plus, LayoutDashboard, LogOut } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { BrandMark } from "@/components/BrandLogo"

const ADMIN_NAV = [
  { href: "/admin", icon: LayoutDashboard, label: "Today" },
  { href: "/admin/rentals", icon: Car, label: "Rentals" },
  { href: "/admin/calendar", icon: Calendar, label: "Calendar" },
  { href: "/admin/cars", icon: Car, label: "Fleet" },
  { href: "/admin/customers", icon: Users, label: "Customers" },
]

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation()
  const [, setLocation] = useLocation()
  const { logout } = useAuth()

  return (
    <div className="admin-surface min-h-[100dvh] flex flex-col bg-muted/30 pb-20 md:pb-0 md:pl-20">
      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-background border-t border-border z-50 flex items-center justify-around px-2 pb-safe">
        {ADMIN_NAV.map(link => (
          <Link 
            key={link.href}
            href={link.href}
            className={`flex flex-col items-center justify-center w-16 h-full gap-1 ${
              location === link.href ? "text-accent" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <link.icon className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase tracking-wider">{link.label}</span>
          </Link>
        ))}
      </nav>

      {/* Desktop Side Nav */}
      <nav className="hidden md:flex fixed top-0 left-0 bottom-0 w-20 bg-primary text-primary-foreground flex-col items-center py-6 border-r border-primary-border z-50">
        <div className="w-14 h-14 bg-primary flex items-center justify-center mb-8" aria-label="Rent Ride Roll LLC">
          <BrandMark className="w-12 h-11" />
        </div>
        
        <div className="flex flex-col gap-6 w-full">
          {ADMIN_NAV.map(link => (
            <Link 
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center justify-center w-full py-3 gap-1.5 transition-colors ${
                location === link.href 
                  ? "text-white border-r-2 border-accent bg-primary-foreground/10" 
                  : "text-primary-foreground/50 hover:text-white"
              }`}
              title={link.label}
            >
              <link.icon className="w-6 h-6" />
              <span className="text-[9px] font-bold uppercase tracking-wider">{link.label}</span>
            </Link>
          ))}
        </div>
      </nav>

      {/* Floating Action Button (Mobile) */}
      <div className="md:hidden fixed bottom-24 right-4 z-40">
        <Link href="/admin/rentals/new" className="w-14 h-14 bg-accent text-white shadow-xl flex items-center justify-center active:scale-95 transition-transform">
          <Plus className="w-6 h-6" />
        </Link>
      </div>

      {/* Top Header */}
      <header className="bg-background border-b border-border sticky top-0 z-30 h-14 px-4 flex items-center justify-between">
        <h1 className="font-bold uppercase tracking-widest text-sm">
          {ADMIN_NAV.find(n => n.href === location)?.label || "Admin"}
        </h1>
        <div className="flex items-center gap-4">
          <Link href="/admin/rentals/new" className="hidden md:flex bg-accent text-white px-4 py-2 text-xs font-bold uppercase tracking-wider items-center gap-2 hover:bg-accent/90">
            <Plus className="w-4 h-4" /> New Rental
          </Link>
          <Link href="/" className="text-xs font-mono text-muted-foreground hover:text-foreground">
            View Site
          </Link>
          <button
            type="button"
            onClick={async () => {
              await logout()
              setLocation("/admin/login")
            }}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Sign out"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-8 max-w-5xl mx-auto w-full">
        {children}
      </main>
    </div>
  )
}
