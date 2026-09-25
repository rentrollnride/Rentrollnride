import { AdminLayout } from "@/components/layout/AdminLayout"
import { useListRentals, useUpdateRentalStatus, useExtendRental, getListRentalsQueryKey, getGetDashboardQueryKey, getListVehiclesQueryKey, getGetPublicVehiclesQueryKey, getListMaintenanceQueryKey } from "@workspace/api-client-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CalendarClock, Car, User, Check, X, AlertCircle } from "lucide-react"
import { useLocation } from "wouter"
import { format } from "date-fns"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useAuth } from "@/components/auth-provider"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type AgreementRow = {
  rentalId: string
  agreementStatus: string
  providerId: string | null
  sentAt: string | null
  signedAt: string | null
  holdExpiresAt: string | null
  signingUrl?: string
  signerName?: string | null
}

export default function Rentals() {
  const { data: rentals, isLoading } = useListRentals()
  const { session } = useAuth()
  const { data: agreements = [] } = useQuery<AgreementRow[]>({
    queryKey: ["rental-agreements"],
    enabled: Boolean(session?.access_token),
    queryFn: async () => {
      const response = await fetch("/api/agreements", {
        headers: { Authorization: `Bearer ${session?.access_token ?? ""}` },
      })
      if (!response.ok) throw new Error("Unable to load agreement statuses.")
      return response.json()
    },
  })
  const agreementByRental = new Map(agreements.map((row) => [row.rentalId, row]))
  const searchParams = new URLSearchParams(window.location.search)
  const customerId = searchParams.get('customerId')

  const filteredRentals = rentals?.filter(r => customerId ? r.customerId === customerId : true)
    ?.sort((a, b) => {
      const getPriority = (rental: typeof a) => {
        if (['overdue', 'out', 'due_today'].includes(rental.status)) return 1
        if (['returned', 'cancelled'].includes(rental.status) && rental.depositStatus === 'collected') return 2
        if (rental.status === 'missed_pickup') return 3
        if (rental.status === 'reserved') return 4
        return 5
      }
      const pA = getPriority(a);
      const pB = getPriority(b);
      if (pA !== pB) return pA - pB;
      
      // Secondary sort: closest expected return or pickup for active/reserved
      if (pA === 1) return new Date(a.expectedReturnAt).getTime() - new Date(b.expectedReturnAt).getTime();
      if (pA === 3 || pA === 4) return new Date(a.pickupAt).getTime() - new Date(b.pickupAt).getTime();
      
      // Completed items newest first
      return new Date(b.pickupAt).getTime() - new Date(a.pickupAt).getTime();
    }) || []

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h2 className="font-bold uppercase tracking-tight text-xl">
            {customerId ? "Customer History" : "All Rentals"}
          </h2>
          <p className="font-mono text-sm text-muted-foreground">Manage active, reserved, and past rentals.</p>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {[1,2,3,4,5].map(i => <div key={i} className="h-20 bg-card animate-pulse border border-border" />)}
          </div>
        ) : !rentals ? (
          <div className="p-8 text-center text-muted-foreground font-mono bg-card border border-border">
            <p className="mb-4">Failed to load rentals.</p>
            <Button variant="outline" onClick={() => window.location.reload()}>Retry</Button>
          </div>
        ) : (
          <div className="bg-card border border-border overflow-hidden">
            <div className="divide-y divide-border">
              {filteredRentals.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground font-mono">No rentals found.</div>
              ) : (
                filteredRentals.map(rental => (
                  <RentalRow key={rental.id} rental={rental} agreement={agreementByRental.get(rental.id)} />
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

function RentalRow({ rental, agreement }: { rental: any, agreement?: AgreementRow }) {
  const updateStatus = useUpdateRentalStatus()
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: getListRentalsQueryKey() })
    queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() })
    queryClient.invalidateQueries({ queryKey: getListVehiclesQueryKey() })
    queryClient.invalidateQueries({ queryKey: getGetPublicVehiclesQueryKey() })
    queryClient.invalidateQueries({ queryKey: getListMaintenanceQueryKey() })
  }

  const isOut = ['out', 'due_today', 'overdue'].includes(rental.status)
  
  return (
    <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-muted/10 transition-colors">
      <div className="space-y-2 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold uppercase text-sm">{rental.customerName}</span>
          <StatusBadge status={rental.status} />
          {rental.depositStatus === 'not_collected' && <Badge variant="outline" className="text-destructive/80 uppercase text-[10px]">Deposit Uncollected</Badge>}
          {['returned', 'cancelled'].includes(rental.status) && rental.depositStatus === 'collected' && <Badge variant="destructive" className="uppercase text-[10px]">Deposit Pending Resolution</Badge>}
          <AgreementBadge agreement={agreement} />
        </div>
        
        <div className="font-mono text-xs text-muted-foreground grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-xl">
          <span className="flex items-center gap-1"><Car className="w-3 h-3"/> {rental.vehicleName}</span>
          <span className="flex items-center gap-1"><User className="w-3 h-3"/> {rental.customerPhone}</span>
          <span className="flex items-center gap-1"><CalendarClock className="w-3 h-3 text-accent"/> Pickup: {new Date(rental.pickupAt).toLocaleString()}</span>
          <span className="flex items-center gap-1"><CalendarClock className="w-3 h-3 text-primary"/> Return: {new Date(rental.expectedReturnAt).toLocaleString()}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 self-end md:self-auto flex-wrap">
        {agreement?.agreementStatus !== "signed" && rental.status !== "returned" && rental.status !== "cancelled" && (
          <SigningLinkButton rental={rental} agreement={agreement} />
        )}
        {(rental.status === 'reserved' || rental.status === 'missed_pickup') && (
          <>
            <PickupDialog rental={rental} onComplete={invalidateAll} />
            <CancelDialog rental={rental} onComplete={invalidateAll} />
          </>
        )}
        
        {isOut && (
          <>
            {rental.depositStatus === 'not_collected' && (
              <RecordDepositDialog rental={rental} onComplete={invalidateAll} />
            )}
            <ReturnDialog rental={rental} onComplete={invalidateAll} />
            <ExtendDialog rental={rental} onComplete={invalidateAll} />
          </>
        )}
        
        {(rental.status === 'returned' || rental.status === 'cancelled') && rental.depositStatus === 'collected' && (
          <ResolveDepositDialog rental={rental} onComplete={invalidateAll} />
        )}
      </div>
    </div>
  )
}

function AgreementBadge({ agreement }: { agreement?: AgreementRow }) {
  const status = agreement?.agreementStatus ?? "not_sent"
  if (status === "signed") return <Badge className="bg-emerald-700 text-white uppercase text-[10px]">Agreement Signed</Badge>
  if (status === "sent" || status === "sending" || status === "pending_signature") return <Badge variant="secondary" className="uppercase text-[10px]">Awaiting Signature</Badge>
  if (status === "declined" || status === "email_bounced") return <Badge variant="destructive" className="uppercase text-[10px]">{status === "declined" ? "Agreement Declined" : "Email Bounced"}</Badge>
  const expired = agreement?.holdExpiresAt && new Date(agreement.holdExpiresAt).getTime() <= Date.now()
  if (expired) return <Badge variant="destructive" className="uppercase text-[10px]">Signature Hold Expired</Badge>
  return <Badge variant="outline" className="uppercase text-[10px]">Agreement Not Started</Badge>
}

function SigningLinkButton({ rental, agreement }: { rental: any, agreement?: AgreementRow }) {
  const { session } = useAuth()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [working, setWorking] = useState(false)

  const getLink = async () => {
    if (!session?.access_token) return
    setWorking(true)
    try {
      let signingUrl = agreement?.signingUrl
      if (!signingUrl) {
        const response = await fetch(`/api/rentals/${rental.id}/agreement/send`, {
          method: "POST",
          headers: { Authorization: `Bearer ${session.access_token}` },
        })
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || "Unable to prepare agreement.")
        signingUrl = data.signingUrl
        await queryClient.invalidateQueries({ queryKey: ["rental-agreements"] })
      }
      if (!signingUrl) throw new Error("Signing link is unavailable.")
      const fullUrl = `${window.location.origin}${signingUrl}`
      await navigator.clipboard.writeText(fullUrl)
      toast({ title: "Signing link copied", description: "Send this secure link to the renter if they need to resume signing." })
    } catch (err) {
      toast({ title: "Could not copy signing link", description: err instanceof Error ? err.message : "Unable to prepare agreement.", variant: "destructive" })
    } finally {
      setWorking(false)
    }
  }

  return (
    <Button size="sm" variant="outline" onClick={() => void getLink()} disabled={working}>
      {working ? "Preparing…" : "Copy Signing Link"}
    </Button>
  )
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'reserved': return <Badge variant="secondary" className="uppercase text-[10px]">Reserved</Badge>
    case 'missed_pickup': return <Badge variant="destructive" className="uppercase text-[10px]"><AlertCircle className="w-3 h-3 mr-1 inline"/> Missed Pickup</Badge>
    case 'out': return <Badge variant="default" className="bg-primary text-primary-foreground uppercase text-[10px]">Out</Badge>
    case 'due_today': return <Badge variant="default" className="bg-accent text-accent-foreground uppercase text-[10px]">Due Today</Badge>
    case 'overdue': return <Badge variant="destructive" className="uppercase text-[10px]"><AlertCircle className="w-3 h-3 mr-1 inline"/> Overdue</Badge>
    case 'returned': return <Badge variant="outline" className="text-muted-foreground uppercase text-[10px]">Returned</Badge>
    case 'cancelled': return <Badge variant="outline" className="text-destructive/60 uppercase text-[10px]">Cancelled</Badge>
    default: return <Badge variant="outline">{status}</Badge>
  }
}

function PickupDialog({ rental, onComplete }: { rental: any, onComplete: () => void }) {
  const [open, setOpen] = useState(false)
  
  const updateStatus = useUpdateRentalStatus()
  const { toast } = useToast()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateStatus.mutate({ 
      id: rental.id, 
      data: { status: 'out', depositStatus: 'collected' } 
    }, {
      onSuccess: () => {
        toast({ title: "Vehicle picked up" })
        onComplete()
        setOpen(false)
      },
      onError: (err: any) => toast({ title: "Failed to pick up", description: err.error || err.message, variant: "destructive" })
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="default">
          <Check className="w-4 h-4 mr-1" /> Pickup
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="uppercase tracking-tight">Confirm Pickup</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2 text-sm">
            <p>You are handing over the keys to <strong>{rental.customerName}</strong>.</p>
            <p className="font-bold text-destructive">Collect the refundable ${rental.deposit} deposit in person, subject to the agreement and any permitted deductions.</p>
            <p className="text-xs text-muted-foreground mt-2">Before handing over keys, verify the renter&apos;s age (21+ standard; ages 18–20 permitted with an under-age fee), current insurance, valid driver&apos;s license, and debit or credit card. Confirm the under-age fee amount with the renter when applicable. Complete forms and process payment at the terminal; this system does not process payments.</p>
          </div>
          <Button type="submit" className="w-full mt-4" disabled={updateStatus.isPending}>
            Confirm Keys Handed Over & ${rental.deposit} Collected
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function CancelDialog({ rental, onComplete }: { rental: any, onComplete: () => void }) {
  const [open, setOpen] = useState(false)
  const [depositStatus, setDepositStatus] = useState<any>(
    rental.depositStatus === 'collected' ? 'collected' : 'not_collected'
  )
  
  const updateStatus = useUpdateRentalStatus()
  const { toast } = useToast()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateStatus.mutate({ 
      id: rental.id, 
      data: { status: 'cancelled', depositStatus } 
    }, {
      onSuccess: () => {
        toast({ title: "Rental cancelled" })
        onComplete()
        setOpen(false)
      },
      onError: (err: any) => toast({ title: "Failed to cancel", description: err.error || err.message, variant: "destructive" })
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="text-destructive border-destructive/20 hover:bg-destructive/10">
          <X className="w-4 h-4 mr-1" /> Cancel
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="uppercase tracking-tight">Cancel Reservation</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          {rental.depositStatus === 'collected' && (
            <div className="space-y-2">
              <Label>Resolve Collected Deposit</Label>
              <Select value={depositStatus} onValueChange={setDepositStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="collected">Pending Resolution (Leave Collected)</SelectItem>
                  <SelectItem value="returned">Return Full Deposit</SelectItem>
                  <SelectItem value="kept">Keep Deposit (Fee)</SelectItem>
                  <SelectItem value="partially_returned">Partial Return</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          <Button type="submit" variant="destructive" className="w-full mt-4" disabled={updateStatus.isPending}>Confirm Cancel</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function ReturnDialog({ rental, onComplete }: { rental: any, onComplete: () => void }) {
  const [open, setOpen] = useState(false)
  const [depositStatus, setDepositStatus] = useState<any>(
    rental.depositStatus === 'collected' ? 'collected' : 'not_collected'
  )
  const [actualReturnAt, setActualReturnAt] = useState(format(new Date(), "yyyy-MM-dd'T'HH:mm"))
  const [notes, setNotes] = useState("")
  
  const updateStatus = useUpdateRentalStatus()
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateStatus.mutate({ 
      id: rental.id, 
      data: { 
        status: 'returned',
        actualReturnAt: new Date(actualReturnAt).toISOString(),
        depositStatus,
        notes: notes || undefined
      } 
    }, {
      onSuccess: () => {
        toast({ title: "Vehicle returned" })
        onComplete()
        setOpen(false)
      },
      onError: (err: any) => toast({ title: "Failed to process return", description: err.error || err.message, variant: "destructive" })
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="default" className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Check className="w-4 h-4 mr-1" /> Return
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="uppercase tracking-tight">Process Return</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label>Return Time</Label>
            <Input type="datetime-local" required value={actualReturnAt} onChange={e => setActualReturnAt(e.target.value)} />
          </div>
          
          <div className="space-y-2">
            <Label>Deposit Action</Label>
            <Select value={depositStatus} onValueChange={setDepositStatus} required>
              <SelectTrigger>
                <SelectValue placeholder="Select resolution" />
              </SelectTrigger>
              <SelectContent>
                {rental.depositStatus === 'not_collected' ? (
                  <SelectItem value="not_collected">Not Collected</SelectItem>
                ) : (
                  <>
                    <SelectItem value="collected">Pending Resolution (Leave Collected)</SelectItem>
                    <SelectItem value="returned">Return Full Deposit</SelectItem>
                    <SelectItem value="partially_returned">Partial Return</SelectItem>
                    <SelectItem value="kept">Keep Deposit</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Notes (Optional)</Label>
            <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Damage notes, late fees, etc." />
          </div>

          <Button type="submit" className="w-full mt-4" disabled={updateStatus.isPending}>Complete Return</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function RecordDepositDialog({ rental, onComplete }: { rental: any, onComplete: () => void }) {
  const [open, setOpen] = useState(false)
  const updateStatus = useUpdateRentalStatus()
  const { toast } = useToast()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // For computed statuses (due_today, overdue), send 'out' which is the base status
    const writableStatus = (rental.status === 'due_today' || rental.status === 'overdue') ? 'out' : rental.status

    updateStatus.mutate({ 
      id: rental.id, 
      data: { status: writableStatus, depositStatus: 'collected' } 
    }, {
      onSuccess: () => {
        toast({ title: "Deposit marked as collected" })
        onComplete()
        setOpen(false)
      },
      onError: (err: any) => toast({ title: "Failed to record deposit", description: err.error || err.message, variant: "destructive" })
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="text-accent border-accent/20 hover:bg-accent/10">
          Record Deposit
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="uppercase tracking-tight">Record Deposit Collection</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <p className="text-sm">Mark the deposit of ${rental.deposit} as collected for this active rental?</p>
          <Button type="submit" className="w-full mt-4" disabled={updateStatus.isPending}>Confirm Collection</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function ResolveDepositDialog({ rental, onComplete }: { rental: any, onComplete: () => void }) {
  const [open, setOpen] = useState(false)
  const [depositStatus, setDepositStatus] = useState<any>('')
  const [notes, setNotes] = useState("")
  
  const updateStatus = useUpdateRentalStatus()
  const { toast } = useToast()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!depositStatus) return
    updateStatus.mutate({ 
      id: rental.id, 
      data: { status: rental.status, depositStatus, notes: notes || undefined } 
    }, {
      onSuccess: () => {
        toast({ title: "Deposit outcome recorded" })
        onComplete()
        setOpen(false)
      },
      onError: (err: any) => toast({ title: "Failed to record outcome", description: err.error || err.message, variant: "destructive" })
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="text-primary border-primary/20 hover:bg-primary/10">
          Record Deposit Outcome
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="uppercase tracking-tight">Record Deposit Outcome</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label>Resolution</Label>
            <Select value={depositStatus} onValueChange={setDepositStatus} required>
              <SelectTrigger>
                <SelectValue placeholder="Select outcome" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="returned">Return Full Deposit</SelectItem>
                <SelectItem value="partially_returned">Partial Return</SelectItem>
                <SelectItem value="kept">Keep Deposit</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Notes (Optional)</Label>
            <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Damage fees, late fees, etc." />
          </div>
          <p className="text-xs text-muted-foreground">Record only an outcome that has actually happened. This does not move money.</p>
          <Button type="submit" className="w-full mt-4" disabled={updateStatus.isPending || !depositStatus}>Save Outcome</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function ExtendDialog({ rental, onComplete }: { rental: any, onComplete: () => void }) {
  const [open, setOpen] = useState(false)
  const [expectedReturnAt, setExpectedReturnAt] = useState(format(new Date(rental.expectedReturnAt), "yyyy-MM-dd'T'HH:mm"))
  
  const extendRental = useExtendRental()
  const { toast } = useToast()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    extendRental.mutate({ 
      id: rental.id, 
      data: { expectedReturnAt: new Date(expectedReturnAt).toISOString() } 
    }, {
      onSuccess: () => {
        toast({ title: "Rental extended" })
        onComplete()
        setOpen(false)
      },
      onError: (err: any) => toast({ title: "Failed to extend rental", description: err.error || err.message, variant: "destructive" })
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">Extend</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="uppercase tracking-tight">Extend Rental</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label>New Expected Return</Label>
            <Input type="datetime-local" required value={expectedReturnAt} onChange={e => setExpectedReturnAt(e.target.value)} min={format(new Date(rental.expectedReturnAt), "yyyy-MM-dd'T'HH:mm")} />
          </div>
          
          <Button type="submit" className="w-full mt-4" disabled={extendRental.isPending}>Save Extension</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
