import { AdminLayout } from "@/components/layout/AdminLayout"
import { useListVehicles, useCreateVehicle, useCreateMaintenance, useUpdateVehicle, type Vehicle } from "@workspace/api-client-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, Wrench } from "lucide-react"
import { useState, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import {
  getListVehiclesQueryKey,
  getListMaintenanceQueryKey,
  getGetDashboardQueryKey,
  getGetPublicVehiclesQueryKey
} from "@workspace/api-client-react"

export default function FleetManager() {
  const { data: vehicles, isLoading, isError, refetch } = useListVehicles()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  
  const filteredVehicles = useMemo(() => {
    return vehicles?.filter(v => !v.archived)
      .filter(v => statusFilter === "all" || v.status === statusFilter)
      .filter(v => search === "" || 
        v.make.toLowerCase().includes(search.toLowerCase()) || 
        v.model.toLowerCase().includes(search.toLowerCase()) ||
        (v.unitNumber?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
        (v.licensePlate?.toLowerCase().includes(search.toLowerCase()) ?? false)
      ) || []
  }, [vehicles, search, statusFilter])

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="font-bold uppercase tracking-tight text-xl">Fleet Management</h2>
            <p className="font-mono text-sm text-muted-foreground">Manage active vehicles and status</p>
          </div>
          <AddVehicleDialog />
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground" />
            <Input 
              placeholder="Search make, model, unit, plate..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-card"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
            <Button 
              variant={statusFilter === "all" ? "default" : "outline"} 
              size="sm" 
              onClick={() => setStatusFilter("all")}
              className="shrink-0"
            >
              All
            </Button>
            <Button 
              variant={statusFilter === "details_pending" ? "accent" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("details_pending")}
              className="shrink-0"
            >
              Needs Details
            </Button>
            <Button
              variant={statusFilter === "available" ? "accent" : "outline"} 
              size="sm" 
              onClick={() => setStatusFilter("available")}
              className="shrink-0"
            >
              Available
            </Button>
            <Button 
              variant={statusFilter === "out" ? "default" : "outline"} 
              size="sm" 
              onClick={() => setStatusFilter("out")}
              className="shrink-0"
            >
              Out
            </Button>
            <Button 
              variant={statusFilter === "maintenance" ? "destructive" : "outline"} 
              size="sm" 
              onClick={() => setStatusFilter("maintenance")}
              className="shrink-0"
            >
              Maintenance
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1,2,3].map(i => <div key={i} className="h-24 bg-card animate-pulse border border-border" />)}
          </div>
        ) : isError || !vehicles ? (
          <div role="alert" className="border border-destructive p-6">
            Could not load vehicles. <Button variant="outline" onClick={() => void refetch()}>Retry</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredVehicles.map(vehicle => (
              <VehicleCard key={vehicle.id} vehicle={vehicle} />
            ))}
            {filteredVehicles.length === 0 && (
              <div className="col-span-full py-12 text-center border border-dashed border-border text-muted-foreground font-mono">
                No vehicles found matching criteria.
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

function VehicleCard({ vehicle }: { vehicle: Vehicle }) {
  return (
    <div className="bg-card border border-border flex flex-col">
      <div className="p-4 border-b border-border flex justify-between items-start">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-muted flex items-center justify-center font-bold text-sm shrink-0">
            {vehicle.unitNumber || "—"}
          </div>
          <div>
            <h3 className="font-bold uppercase tracking-tight text-lg leading-none">{vehicle.year} {vehicle.make} {vehicle.model}</h3>
            <p className="font-mono text-xs text-muted-foreground mt-1">
              {vehicle.detailsPending ? "Business details need confirmation" : `Plate: ${vehicle.licensePlate}`}
            </p>
          </div>
        </div>
        <Badge variant={
          vehicle.status === "details_pending" ? "default" :
          vehicle.status === "available" ? "accent" : 
          vehicle.status === "out" ? "default" : "destructive"
        }>
          {vehicle.status}
        </Badge>
      </div>
      
      <div className="p-4 bg-muted/20 flex-1 grid grid-cols-2 gap-4 font-mono text-xs">
        <div>
          <span className="text-muted-foreground block mb-1">Class</span>
          <span className="font-bold uppercase">{vehicle.vehicleClass || "To confirm"}</span>
        </div>
        <div>
          <span className="text-muted-foreground block mb-1">Rates (D/W)</span>
          <span className="font-bold">{vehicle.detailsPending ? "To confirm" : `$${vehicle.dailyRate} / $${vehicle.weeklyRate}`}</span>
        </div>
      </div>

      <div className="p-4 border-t border-border flex items-center justify-between gap-2">
        <span className="text-xs font-mono uppercase text-muted-foreground flex-1">
          {vehicle.detailsPending ? "Not bookable until details are confirmed" : `Status: ${vehicle.status}`}
        </span>
        {vehicle.detailsPending && <CompleteVehicleDialog vehicle={vehicle} />}
        {!vehicle.detailsPending && vehicle.status !== "maintenance" && (
          <ScheduleMaintenanceDialog vehicle={vehicle} />
        )}
      </div>
    </div>
  )
}

function ScheduleMaintenanceDialog({ vehicle }: { vehicle: Vehicle }) {
  const [open, setOpen] = useState(false)
  const createMaintenance = useCreateMaintenance()
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    startAt: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    endAt: format(new Date(Date.now() + 86400000), "yyyy-MM-dd'T'HH:mm"), // tomorrow
    reason: ""
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (new Date(formData.startAt) >= new Date(formData.endAt)) {
      toast({ title: "Invalid Dates", description: "End time must be after start time.", variant: "destructive" })
      return
    }

    createMaintenance.mutate({
      data: {
        vehicleId: vehicle.id,
        startAt: new Date(formData.startAt).toISOString(),
        endAt: new Date(formData.endAt).toISOString(),
        reason: formData.reason || undefined
      }
    }, {
      onSuccess: () => {
        toast({ title: "Maintenance Scheduled" })
        queryClient.invalidateQueries({ queryKey: getListMaintenanceQueryKey() })
        queryClient.invalidateQueries({ queryKey: getListVehiclesQueryKey() })
        queryClient.invalidateQueries({ queryKey: getGetPublicVehiclesQueryKey() })
        queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() })
        setOpen(false)
      },
      onError: (err: any) => toast({ title: "Scheduling Failed", description: err.error || err.message, variant: "destructive" })
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-10 text-xs font-bold uppercase tracking-wider">
          <Wrench className="w-4 h-4 mr-1" /> Schedule
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="uppercase tracking-tight">Schedule Maintenance</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label>Start Time</Label>
            <Input type="datetime-local" required value={formData.startAt} onChange={e => setFormData({...formData, startAt: e.target.value})} />
          </div>
          <div className="space-y-2">
            <Label>End Time</Label>
            <Input type="datetime-local" required value={formData.endAt} onChange={e => setFormData({...formData, endAt: e.target.value})} min={formData.startAt} />
          </div>
          <div className="space-y-2">
            <Label>Reason (Optional)</Label>
            <Input value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})} placeholder="e.g. Oil change" />
          </div>
          <Button type="submit" className="w-full mt-4" disabled={createMaintenance.isPending}>Schedule Block</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function CompleteVehicleDialog({ vehicle }: { vehicle: Vehicle }) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    unitNumber: "",
    licensePlate: "",
    vehicleClass: "",
    capacity: "",
    transmission: "",
    dailyRate: "",
    weeklyRate: "",
    imageUrl: "",
    vin: "",
  })
  const updateVehicle = useUpdateVehicle()
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    const capacity = Number(form.capacity)
    const dailyRate = Number(form.dailyRate)
    const weeklyRate = Number(form.weeklyRate)
    if (!Number.isInteger(capacity) || capacity < 1 ||
        !Number.isFinite(dailyRate) || dailyRate <= 0 ||
        !Number.isFinite(weeklyRate) || weeklyRate <= 0) {
      toast({ title: "Enter valid capacity and rates", variant: "destructive" })
      return
    }
    updateVehicle.mutate({
      id: vehicle.id,
      data: {
        year: vehicle.year,
        make: vehicle.make,
        model: vehicle.model,
        unitNumber: form.unitNumber.trim(),
        licensePlate: form.licensePlate.trim(),
        vehicleClass: form.vehicleClass.trim(),
        capacity,
        transmission: form.transmission.trim(),
        dailyRate,
        weeklyRate,
        imageUrl: form.imageUrl.trim(),
        vin: form.vin.trim() || null,
        features: [],
        detailsConfirmed: true,
      },
    }, {
      onSuccess: () => {
        toast({ title: "Vehicle details confirmed" })
        queryClient.invalidateQueries({ queryKey: getListVehiclesQueryKey() })
        queryClient.invalidateQueries({ queryKey: getGetPublicVehiclesQueryKey() })
        queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() })
        setOpen(false)
      },
      onError: (error: any) => toast({
        title: "Could not confirm vehicle",
        description: error.error || error.message,
        variant: "destructive",
      }),
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button variant="outline" size="sm">Complete Details</Button></DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Confirm {vehicle.year} {vehicle.make} {vehicle.model}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">Unverified values are hidden. Enter verified details before publishing rates or accepting bookings. A photo is optional.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          {([
            ["unitNumber", "Unit number", "text"],
            ["licensePlate", "License plate", "text"],
            ["vehicleClass", "Vehicle class", "text"],
            ["capacity", "Passenger capacity", "number"],
            ["transmission", "Transmission", "text"],
            ["dailyRate", "Daily rate ($)", "number"],
            ["weeklyRate", "Weekly rate ($)", "number"],
          ] as const).map(([field, label, type]) => (
            <div className="space-y-2" key={field}>
              <Label htmlFor={`confirm-${field}`}>{label}</Label>
              <Input id={`confirm-${field}`} type={type} min={type === "number" ? 1 : undefined} step={field.includes("Rate") ? "0.01" : undefined}
                required value={form[field]} onChange={(event) => setForm({ ...form, [field]: event.target.value })} />
            </div>
          ))}
          <div className="space-y-2">
            <Label htmlFor="confirm-image">Actual vehicle photo URL (optional)</Label>
            <Input id="confirm-image" type="url" value={form.imageUrl} onChange={(event) => setForm({ ...form, imageUrl: event.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-vin">VIN (optional, admin only)</Label>
            <Input id="confirm-vin" value={form.vin} onChange={(event) => setForm({ ...form, vin: event.target.value })} />
          </div>
          <Button className="w-full" type="submit" disabled={updateVehicle.isPending}>Confirm and Publish Details</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function AddVehicleDialog() {
  const [open, setOpen] = useState(false)
  const createVehicle = useCreateVehicle()
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    year: "",
    make: "",
    model: "",
    vehicleClass: "",
    unitNumber: "",
    licensePlate: "",
    capacity: "",
    dailyRate: "",
    weeklyRate: "",
    transmission: ""
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createVehicle.mutate({ data: {
      ...formData,
      year: Number(formData.year),
      capacity: Number(formData.capacity),
      dailyRate: Number(formData.dailyRate),
      weeklyRate: Number(formData.weeklyRate),
    } }, {
      onSuccess: () => {
        toast({ title: "Vehicle Added" })
        queryClient.invalidateQueries({ queryKey: getListVehiclesQueryKey() })
        setOpen(false)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="shrink-0"><Plus className="w-4 h-4 mr-2" /> Add Vehicle</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="uppercase tracking-tight">Add New Vehicle</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Unit Number</Label>
              <Input required value={formData.unitNumber} onChange={e => setFormData({...formData, unitNumber: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>License Plate</Label>
              <Input required value={formData.licensePlate} onChange={e => setFormData({...formData, licensePlate: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Year</Label>
              <Input type="number" min="1900" required value={formData.year} onChange={e => setFormData({...formData, year: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Make</Label>
              <Input required value={formData.make} onChange={e => setFormData({...formData, make: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Model</Label>
              <Input required value={formData.model} onChange={e => setFormData({...formData, model: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Class</Label>
              <select required className="flex h-12 w-full border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                value={formData.vehicleClass} onChange={e => setFormData({...formData, vehicleClass: e.target.value})}>
                <option value="" disabled>Select class</option>
                <option>Compact</option>
                <option>Midsize</option>
                <option>Full-size</option>
                <option>SUV</option>
                <option>Van</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Passenger capacity</Label>
              <Input type="number" min="1" required value={formData.capacity} onChange={e => setFormData({...formData, capacity: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Transmission</Label>
              <Input required value={formData.transmission} onChange={e => setFormData({...formData, transmission: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Daily Rate ($)</Label>
              <Input type="number" min="0" step="0.01" required value={formData.dailyRate} onChange={e => setFormData({...formData, dailyRate: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Weekly Rate ($)</Label>
              <Input type="number" min="0" step="0.01" required value={formData.weeklyRate} onChange={e => setFormData({...formData, weeklyRate: e.target.value})} />
            </div>
          </div>
          <Button type="submit" className="w-full mt-6" disabled={createVehicle.isPending}>Save Vehicle</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
