import { AdminLayout } from "@/components/layout/AdminLayout"
import { useListCustomers, useCreateCustomer, useUpdateCustomer, type Customer } from "@workspace/api-client-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Plus, UserCircle, Phone, Pencil } from "lucide-react"
import { Link } from "wouter"
import { useState, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { useQueryClient } from "@tanstack/react-query"
import { getListCustomersQueryKey } from "@workspace/api-client-react"

export default function Customers() {
  const { data: customers, isLoading } = useListCustomers()
  const [search, setSearch] = useState("")

  const filtered = useMemo(() => {
    return customers?.filter(c => 
      search === "" || 
      c.name.toLowerCase().includes(search.toLowerCase()) || 
      c.phone.includes(search) || 
      (c.email && c.email.toLowerCase().includes(search.toLowerCase()))
    ) || []
  }, [customers, search])

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="font-bold uppercase tracking-tight text-xl">Customers</h2>
            <p className="font-mono text-sm text-muted-foreground">Manage client records and history</p>
          </div>
          <AddCustomerDialog />
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground" />
          <Input 
            placeholder="Search by name, phone, email..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-card"
          />
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {[1,2,3,4,5].map(i => <div key={i} className="h-16 bg-card animate-pulse border border-border" />)}
          </div>
        ) : (
          <div className="bg-card border border-border overflow-hidden">
            <div className="divide-y divide-border">
              {filtered.map(customer => (
                <div key={customer.id} className="p-4 hover:bg-muted/20 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-muted flex items-center justify-center shrink-0">
                      <UserCircle className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="font-bold uppercase tracking-tight text-sm">{customer.name}</h3>
                      <div className="font-mono text-xs text-muted-foreground mt-1 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                        <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {customer.phone}</span>
                        {customer.email && <span>{customer.email}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 self-end md:self-auto">
                    <span className="text-xs font-mono text-muted-foreground hidden sm:block">Since {new Date(customer.createdAt).getFullYear()}</span>
                    <Button variant="outline" size="sm" className="h-8" asChild>
                      <Link href={`/admin/rentals?customerId=${customer.id}`}>View History</Link>
                    </Button>
                    <EditCustomerDialog customer={customer} />
                  </div>
                </div>
              ))}
              {filtered.length === 0 && (
                <div className="p-8 text-center text-muted-foreground font-mono">
                  No customers found.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

function EditCustomerDialog({ customer }: { customer: Customer }) {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: customer.name, phone: customer.phone, email: customer.email ?? "", notes: customer.notes ?? "",
  })
  const updateCustomer = useUpdateCustomer()
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    updateCustomer.mutate({ id: customer.id, data: {
      name: formData.name.trim(), phone: formData.phone.trim(),
      email: formData.email.trim() || null, notes: formData.notes.trim() || null,
    } }, {
      onSuccess: () => {
        toast({ title: "Customer updated" })
        queryClient.invalidateQueries({ queryKey: getListCustomersQueryKey() })
        setOpen(false)
      },
      onError: (error: any) => toast({ title: "Could not update customer", description: error.error || error.message, variant: "destructive" }),
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button variant="outline" size="sm" className="h-8" aria-label={`Edit ${customer.name}`}><Pencil className="w-4 h-4" /></Button></DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Edit Customer</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2"><Label htmlFor={`customer-name-${customer.id}`}>Full Name</Label><Input id={`customer-name-${customer.id}`} required value={formData.name} onChange={event => setFormData({ ...formData, name: event.target.value })} /></div>
          <div className="space-y-2"><Label htmlFor={`customer-phone-${customer.id}`}>Phone</Label><Input id={`customer-phone-${customer.id}`} type="tel" required value={formData.phone} onChange={event => setFormData({ ...formData, phone: event.target.value })} /></div>
          <div className="space-y-2"><Label htmlFor={`customer-email-${customer.id}`}>Email</Label><Input id={`customer-email-${customer.id}`} type="email" value={formData.email} onChange={event => setFormData({ ...formData, email: event.target.value })} /></div>
          <div className="space-y-2"><Label htmlFor={`customer-notes-${customer.id}`}>Notes</Label><Input id={`customer-notes-${customer.id}`} value={formData.notes} onChange={event => setFormData({ ...formData, notes: event.target.value })} /></div>
          <Button className="w-full" type="submit" disabled={updateCustomer.isPending}>Save Changes</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function AddCustomerDialog() {
  const [open, setOpen] = useState(false)
  const createCustomer = useCreateCustomer()
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    notes: ""
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createCustomer.mutate({ data: formData }, {
      onSuccess: () => {
        toast({ title: "Customer Added" })
        queryClient.invalidateQueries({ queryKey: getListCustomersQueryKey() })
        setOpen(false)
        setFormData({ name: "", phone: "", email: "", notes: "" })
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="shrink-0"><Plus className="w-4 h-4 mr-2" /> New Customer</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="uppercase tracking-tight">Add Customer</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label>Full Name</Label>
            <Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
          </div>
          <div className="space-y-2">
            <Label>Phone Number</Label>
            <Input required type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
          </div>
          <div className="space-y-2">
            <Label>Email (Optional)</Label>
            <Input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
          </div>
          <div className="space-y-2">
            <Label>Notes (Optional)</Label>
            <Input value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
          </div>
          <Button type="submit" className="w-full mt-6" disabled={createCustomer.isPending}>Save Customer</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
