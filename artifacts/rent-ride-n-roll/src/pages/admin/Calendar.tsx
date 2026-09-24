import { AdminLayout } from "@/components/layout/AdminLayout"
import { useListVehicles, useListRentals, useListMaintenance } from "@workspace/api-client-react"
import { addDays, format, startOfWeek, subWeeks, addWeeks } from "date-fns"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Wrench } from "lucide-react"

export default function Calendar() {
  const { data: vehicles, isError: vehiclesError, refetch: refetchVehicles } = useListVehicles()
  const { data: rentals, isError: rentalsError, refetch: refetchRentals } = useListRentals()
  const { data: maintenance, isError: maintenanceError, refetch: refetchMaintenance } = useListMaintenance()

  const [currentDate, setCurrentDate] = useState(new Date())
  const start = startOfWeek(currentDate, { weekStartsOn: 1 }) // Monday
  const days = Array.from({ length: 7 }).map((_, i) => addDays(start, i))

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="font-bold uppercase tracking-tight text-xl">Fleet Schedule</h2>
          <div className="flex items-center gap-4">
            <span className="font-mono text-sm text-muted-foreground">{format(start, 'MMM d')} - {format(addDays(start, 6), 'MMM d, yyyy')}</span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" aria-label="Previous week" onClick={() => setCurrentDate(subWeeks(currentDate, 1))}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" className="font-bold uppercase" onClick={() => setCurrentDate(new Date())}>
                Today
              </Button>
              <Button variant="outline" size="icon" aria-label="Next week" onClick={() => setCurrentDate(addWeeks(currentDate, 1))}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {(vehiclesError || rentalsError || maintenanceError) && (
          <div role="alert" className="border border-destructive p-4 text-sm">
            Could not load the complete schedule. <Button variant="outline" onClick={() => { void refetchVehicles(); void refetchRentals(); void refetchMaintenance() }}>Retry</Button>
          </div>
        )}
        <div className="bg-card border border-border overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Header */}
            <div className="grid grid-cols-8 border-b border-border bg-muted/50">
              <div className="p-3 font-bold uppercase tracking-widest text-xs text-muted-foreground border-r border-border">
                Vehicle
              </div>
              {days.map((day, i) => {
                const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
                return (
                  <div key={i} className={`p-3 text-center border-r border-border last:border-0 ${isToday ? 'bg-accent/10 text-accent font-bold' : 'text-muted-foreground'}`}>
                    <div className="text-[10px] uppercase tracking-wider">{format(day, 'EEE')}</div>
                    <div className="text-sm font-mono">{format(day, 'd')}</div>
                  </div>
                )
              })}
            </div>

            {/* Grid */}
            <div className="divide-y divide-border">
              {vehicles?.filter(v => !v.archived).map(vehicle => {
                const vehicleRentals = rentals?.filter(r => r.vehicleId === vehicle.id && r.status !== 'cancelled' && r.status !== 'returned') || []
                const vehicleMaintenance = maintenance?.filter(m => m.vehicleId === vehicle.id) || []

                return (
                  <div key={vehicle.id} className="grid grid-cols-8 hover:bg-muted/20 transition-colors">
                    <div className="p-3 border-r border-border flex flex-col justify-center">
                      <span className="font-bold text-xs uppercase truncate" title={`${vehicle.make} ${vehicle.model}`}>
                        {vehicle.make} {vehicle.model}
                      </span>
                      <span className="font-mono text-[10px] text-muted-foreground">{vehicle.unitNumber}</span>
                    </div>
                    {days.map((day, i) => {
                      const dayStr = format(day, 'yyyy-MM-dd')
                      const nextDay = addDays(day, 1)
                      const activeRentals = vehicleRentals.filter(r =>
                        new Date(r.pickupAt) < nextDay &&
                        (['out', 'due_today', 'overdue'].includes(r.status) || new Date(r.expectedReturnAt) > day)
                      )
                      const activeMaintenance = vehicleMaintenance.filter(m =>
                        new Date(m.startAt) < nextDay && new Date(m.endAt) > day
                      )

                      return (
                        <div key={i} className="border-r border-border last:border-0 p-1 relative min-h-[60px] flex flex-col gap-1 overflow-hidden">
                          {activeRentals.map(activeRental => (
                            <div key={activeRental.id} className={`w-full p-1 flex flex-col justify-center border ${
                              activeRental.status === 'out' ? 'bg-primary text-primary-foreground border-primary' :
                              activeRental.status === 'reserved' ? 'bg-secondary text-secondary-foreground border-border' :
                              'bg-destructive text-destructive-foreground border-destructive'
                            }`}>
                              <span className="text-[9px] font-bold uppercase truncate">{activeRental.customerName}</span>
                              <div className="text-[8px] font-mono opacity-80 flex flex-col">
                                {format(new Date(activeRental.pickupAt), 'yyyy-MM-dd') === dayStr && <span>Out: {format(new Date(activeRental.pickupAt), 'HH:mm')}</span>}
                                {format(new Date(activeRental.expectedReturnAt), 'yyyy-MM-dd') === dayStr && <span>In: {format(new Date(activeRental.expectedReturnAt), 'HH:mm')}</span>}
                                {format(new Date(activeRental.pickupAt), 'yyyy-MM-dd') !== dayStr && format(new Date(activeRental.expectedReturnAt), 'yyyy-MM-dd') !== dayStr && <span>{activeRental.status}</span>}
                              </div>
                            </div>
                          ))}
                          {activeMaintenance.map(block => (
                            <div key={block.id} className="w-full p-1 flex flex-col justify-center bg-muted text-muted-foreground border border-border">
                              <span className="text-[9px] font-bold uppercase truncate flex items-center gap-1"><Wrench className="w-3 h-3"/> Maintenance</span>
                              {block.reason && <span className="text-[8px] font-mono truncate">{block.reason}</span>}
                            </div>
                          ))}
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
