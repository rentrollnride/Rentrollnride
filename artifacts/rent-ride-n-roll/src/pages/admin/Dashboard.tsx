import { AdminLayout } from "@/components/layout/AdminLayout"
import { useGetDashboard } from "@workspace/api-client-react"
import { Car, AlertCircle, CalendarClock, ArrowRight } from "lucide-react"
import { Link } from "wouter"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export default function Dashboard() {
  const { data, isLoading, isError, refetch } = useGetDashboard()

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="animate-pulse space-y-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-card border border-border" />)}
          </div>
          <div className="h-64 bg-card border border-border" />
        </div>
      </AdminLayout>
    )
  }

  if (isError || !data) {
    return <AdminLayout><div role="alert" className="border border-destructive p-6">
      Could not load the dashboard. <Button variant="outline" onClick={() => void refetch()}>Retry</Button>
    </div></AdminLayout>
  }

  const { totalVehicles, available, out, dueToday, overdue, rentals } = data || { totalVehicles: 0, available: 0, out: 0, dueToday: 0, overdue: 0, rentals: [] }

  return (
    <AdminLayout>
      <div className="space-y-8">
        
        {/* KPI Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-card border border-border p-4 flex flex-col items-center justify-center text-center">
            <span className="text-3xl font-extrabold text-foreground">{available}</span>
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground mt-1">Available</span>
          </div>
          <div className="bg-card border border-border p-4 flex flex-col items-center justify-center text-center border-l-4 border-l-primary">
            <span className="text-3xl font-extrabold text-foreground">{out}</span>
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground mt-1">Out Now</span>
          </div>
          <div className="bg-card border border-border p-4 flex flex-col items-center justify-center text-center border-l-4 border-l-accent">
            <span className="text-3xl font-extrabold text-foreground">{dueToday}</span>
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground mt-1">Due Today</span>
          </div>
          <div className="bg-card border border-border p-4 flex flex-col items-center justify-center text-center border-l-4 border-l-destructive">
            <span className="text-3xl font-extrabold text-foreground">{overdue}</span>
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground mt-1">Overdue</span>
          </div>
        </div>

        {/* Actionable List */}
        <div className="bg-card border border-border">
          <div className="p-4 border-b border-border flex justify-between items-center">
            <h2 className="font-bold uppercase tracking-tight text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-accent" /> Attention Needed
            </h2>
            <Link href="/admin/rentals" className="text-xs font-bold text-muted-foreground uppercase tracking-wider hover:text-foreground">
              All Rentals &rarr;
            </Link>
          </div>
          
          <div className="divide-y divide-border">
            {rentals.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground font-mono text-sm">
                No actionable items for today. All good!
              </div>
            ) : (
              rentals.map(rental => (
                <div key={rental.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold uppercase text-sm">{rental.customerName}</span>
                      {rental.status === 'overdue' && <Badge variant="destructive">Overdue</Badge>}
                      {rental.status === 'due_today' && <Badge variant="accent" className="bg-accent text-accent-foreground">Due Today</Badge>}
                      {rental.status === 'missed_pickup' && <Badge variant="destructive">Missed Pickup</Badge>}
                    </div>
                    <div className="font-mono text-xs text-muted-foreground flex items-center gap-3">
                      <span><Car className="inline w-3 h-3 mr-1"/> {rental.vehicleName}</span>
                      <span><CalendarClock className="inline w-3 h-3 mr-1"/> Return: {new Date(rental.expectedReturnAt).toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/admin/rentals?customerId=${rental.customerId}`} className="bg-secondary text-secondary-foreground px-3 py-2 text-xs font-bold uppercase hover:bg-secondary/80 text-center">
                      View
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link href="/admin/rentals/new" className="bg-primary text-primary-foreground p-6 flex items-center justify-between hover:bg-primary/90 transition-colors group">
            <span className="font-bold uppercase tracking-widest">New Rental</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link href="/admin/rentals" className="bg-card border border-border p-6 flex items-center justify-between hover:border-foreground transition-colors group">
            <span className="font-bold uppercase tracking-widest text-foreground">Manage Rentals</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

      </div>
    </AdminLayout>
  )
}
