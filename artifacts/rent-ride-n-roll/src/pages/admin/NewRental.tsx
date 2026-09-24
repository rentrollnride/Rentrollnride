import { AdminLayout } from "@/components/layout/AdminLayout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useListVehicles, useListCustomers, useCreateRental } from "@workspace/api-client-react"
import { useState } from "react"
import { useLocation } from "wouter"
import { useToast } from "@/hooks/use-toast"
import { format, addDays } from "date-fns"

export default function NewRental() {
  const [, setLocation] = useLocation()
  const { toast } = useToast()
  
  const { data: vehicles, isError: vehiclesError, refetch: refetchVehicles } = useListVehicles()
  const { data: customers, isError: customersError, refetch: refetchCustomers } = useListCustomers()
  const createRental = useCreateRental()

  const [formData, setFormData] = useState({
    customerId: "",
    vehicleId: "",
    pickupAt: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    expectedReturnAt: format(addDays(new Date(), 1), "yyyy-MM-dd'T'HH:mm"),
    rateType: "daily" as any,
    rate: 0,
    deposit: 300,
    depositStatus: "not_collected" as any,
    notes: ""
  })

  // Auto-fill rate when vehicle or rate type changes
  const handleVehicleChange = (vid: string) => {
    const v = vehicles?.find(x => x.id === vid)
    if (v && !v.detailsPending) {
      setFormData(prev => ({
        ...prev, 
        vehicleId: vid,
        rate: prev.rateType === "daily" ? (v.dailyRate ?? prev.rate) : prev.rateType === "weekly" ? (v.weeklyRate ?? prev.rate) : prev.rate
      }))
    } else {
      setFormData(prev => ({ ...prev, vehicleId: vid }))
    }
  }

  const handleRateTypeChange = (type: any) => {
    const v = vehicles?.find(x => x.id === formData.vehicleId && !x.detailsPending)
    setFormData(prev => ({
      ...prev,
      rateType: type,
      rate: v ? (type === "daily" ? (v.dailyRate ?? prev.rate) : type === "weekly" ? (v.weeklyRate ?? prev.rate) : prev.rate) : prev.rate
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!Number.isFinite(new Date(formData.pickupAt).getTime()) ||
        !Number.isFinite(new Date(formData.expectedReturnAt).getTime()) ||
        new Date(formData.pickupAt) >= new Date(formData.expectedReturnAt)) {
      toast({
        title: "Invalid Dates",
        description: "Expected return must be after pickup time.",
        variant: "destructive"
      })
      return
    }

    createRental.mutate({
      data: {
        ...formData,
        pickupAt: new Date(formData.pickupAt).toISOString(),
        expectedReturnAt: new Date(formData.expectedReturnAt).toISOString()
      }
    }, {
      onSuccess: () => {
        toast({ title: "Rental Created Successfully" })
        setLocation("/admin/rentals")
      },
      onError: (err: any) => {
        toast({ 
          title: "Error Creating Rental", 
          description: err.error || err.message || "There was a conflict or error. Please check dates and availability.",
          variant: "destructive"
        })
      }
    })
  }

  return (
    <AdminLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h2 className="font-bold uppercase tracking-tight text-xl">New Rental</h2>
          <p className="font-mono text-sm text-muted-foreground">Confirm rental requirements before reserving. Collect the refundable $300 deposit at pickup, subject to the rental agreement and any permitted deductions.</p>
        </div>

        {(vehiclesError || customersError) && (
          <div role="alert" className="border border-destructive p-4 text-sm">
            Could not load vehicles or customers. <Button type="button" variant="outline" onClick={() => { void refetchVehicles(); void refetchCustomers() }}>Retry</Button>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-8 bg-card border border-border p-6">
          <div className="border-l-2 border-accent pl-4 text-sm leading-relaxed">
            <p className="font-bold uppercase tracking-wide mb-1">Review with the renter</p>
            <p>Age 21+ meets the standard requirement. Ages 18–20 may rent with an under-age fee; confirm its amount before reserving. Verify current insurance, a valid driver&apos;s license, and a debit or credit card. Review the refundable $300 pickup deposit and its terms.</p>
          </div>
          <div className="space-y-4">
            <h3 className="font-bold uppercase tracking-widest text-xs border-b border-border pb-2">Customer & Vehicle</h3>
            
            <div className="space-y-2">
              <Label>Customer</Label>
              <select 
                required
                className="flex h-12 w-full border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                value={formData.customerId}
                onChange={e => setFormData({...formData, customerId: e.target.value})}
              >
                <option value="" disabled>Select Customer</option>
                {customers?.map(c => <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>)}
              </select>
              <p className="text-xs text-muted-foreground font-mono">If new, add them in the Customers tab first.</p>
            </div>

            <div className="space-y-2">
              <Label>Vehicle</Label>
              <select 
                required
                className="flex h-12 w-full border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                value={formData.vehicleId}
                onChange={e => handleVehicleChange(e.target.value)}
              >
                <option value="" disabled>Select Vehicle</option>
                {vehicles?.filter(v => !v.archived && !v.detailsPending).map(v => (
                  <option key={v.id} value={v.id}>{v.unitNumber} - {v.make} {v.model} ({v.status})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-bold uppercase tracking-widest text-xs border-b border-border pb-2">Schedule & Rates</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Pickup Date & Time</Label>
                <Input 
                  type="datetime-local" 
                  required 
                  value={formData.pickupAt}
                  onChange={e => setFormData({...formData, pickupAt: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Expected Return</Label>
                <Input 
                  type="datetime-local" 
                  required 
                  min={formData.pickupAt}
                  value={formData.expectedReturnAt}
                  onChange={e => setFormData({...formData, expectedReturnAt: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Rate Type</Label>
                <select 
                  className="flex h-12 w-full border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                  value={formData.rateType}
                  onChange={e => handleRateTypeChange(e.target.value)}
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Rate Amount ($)</Label>
                <Input 
                  type="number" 
                  required 
                  value={formData.rate}
                  onChange={e => setFormData({...formData, rate: Number(e.target.value)})}
                />
              </div>
              <div className="space-y-2">
                <Label>Deposit ($)</Label>
                <Input type="number" value={formData.deposit} readOnly aria-label="Refundable deposit amount: $300, collected at pickup" />
                <p className="text-xs text-muted-foreground">Refundable subject to the agreement and permitted deductions. Collected at pickup, not online.</p>
              </div>
            </div>
          </div>

          <div className="space-y-4 border-t border-border pt-6">
            <Button type="submit" className="w-full h-14" disabled={createRental.isPending}>
              Create Reservation
            </Button>
            <Button type="button" variant="outline" className="w-full" onClick={() => setLocation("/admin")}>
              Cancel
            </Button>
          </div>

        </form>
      </div>
    </AdminLayout>
  )
}
