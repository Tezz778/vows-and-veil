import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/PageHeader';
import FeatureGate from '@/components/FeatureGate';
import { hasFeature } from '@/lib/wedding';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import ActionSheet from '@/components/ui/action-sheet';
import { Plus, Trash2, Pencil, Briefcase } from 'lucide-react';

const CATEGORIES = ['venue', 'catering', 'photography', 'videography', 'florist', 'music', 'stationery', 'beauty', 'attire', 'transport', 'officiant', 'other'];
const STATUSES = ['not_contacted', 'contacted', 'contract_signed', 'deposit_paid', 'confirmed', 'cancelled'];

const STATUS_TONE = {
  not_contacted: 'bg-secondary text-muted-foreground',
  contacted: 'bg-amber-100 text-amber-700',
  contract_signed: 'bg-sky-100 text-sky-700',
  deposit_paid: 'bg-violet-100 text-violet-700',
  confirmed: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-rose-100 text-rose-700',
};

const money = (n) => (Number(n || 0)).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

export default function Vendors() {
  const { wedding, tier } = useOutletContext();
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = async () => {
    if (!wedding) return;
    setLoading(true);
    try {
      const list = await base44.entities.Vendor.filter({ wedding_id: wedding.id }, '-created_date', 200);
      setVendors(list || []);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [wedding]);

  if (!hasFeature(tier, 'vendors')) return <FeatureGate feature="vendors" tierLabel="Single Day" />;
  if (!wedding) return null;

  const confirmed = vendors.filter((v) => v.booking_status === 'confirmed').length;
  const totalCost = vendors.reduce((s, v) => s + Number(v.total_cost || 0), 0);
  const totalPaid = vendors.filter((v) => v.deposit_paid).reduce((s, v) => s + Number(v.deposit_amount || 0), 0);

  const openAdd = () => { setEditing(null); setDialogOpen(true); };
  const openEdit = (v) => { setEditing(v); setDialogOpen(true); };

  return (
    <div>
      <PageHeader eyebrow="The Team" title="Vendors & Contracts"
        subtitle="Track contacts, booking status, payment schedules, and contract notes for every vendor."
      >
        <Button onClick={openAdd} className="bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-1" /> Add vendor
        </Button>
      </PageHeader>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <Stat label="Vendors" value={vendors.length} />
        <Stat label="Confirmed" value={confirmed} tone="emerald" />
        <Stat label="Total budget" value={money(totalCost)} />
        <Stat label="Deposits paid" value={money(totalPaid)} tone="violet" />
      </div>

      {loading ? (
        <div className="text-center py-16 text-muted-foreground">Loading vendors…</div>
      ) : vendors.length === 0 ? (
        <div className="elegant-card p-12 text-center">
          <Briefcase className="w-10 h-10 text-muted-foreground/30 mx-auto mb-4" />
          <p className="serif-heading text-xl text-foreground">No vendors yet</p>
          <p className="text-sm text-muted-foreground mt-1 mb-5">Add your venue, caterer, florist, photographer, and more.</p>
          <Button onClick={openAdd} className="bg-primary hover:bg-primary/90"><Plus className="w-4 h-4 mr-1" /> Add your first vendor</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {vendors.map((v) => (
            <div key={v.id} className="elegant-card p-5 group">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="serif-heading text-lg text-foreground">{v.name}</h3>
                    <span className={`text-[10px] tracking-wider uppercase px-2 py-0.5 rounded-full ${STATUS_TONE[v.booking_status] || ''}`}>
                      {v.booking_status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mt-0.5">{v.category}</p>
                </div>
                <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(v)} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground"><Pencil className="w-3.5 h-3.5" /></button>
                  <button onClick={() => base44.entities.Vendor.delete(v.id).then(load)} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
              <div className="mt-3 space-y-1 text-sm">
                {v.contact_name && <p className="text-foreground">{v.contact_name}</p>}
                {v.contact_info && <p className="text-muted-foreground">{v.contact_info}</p>}
              </div>
              {(Number(v.total_cost) > 0 || Number(v.deposit_amount) > 0) && (
                <div className="mt-4 pt-3 border-t border-border/60 grid grid-cols-3 gap-2 text-xs">
                  <div><p className="text-muted-foreground uppercase tracking-wider">Total</p><p className="font-medium text-foreground mt-0.5">{money(v.total_cost)}</p></div>
                  <div><p className="text-muted-foreground uppercase tracking-wider">Deposit</p><p className="font-medium text-foreground mt-0.5">{money(v.deposit_amount)}{v.deposit_paid ? ' ✓' : ''}</p></div>
                  <div><p className="text-muted-foreground uppercase tracking-wider">Balance</p><p className="font-medium text-foreground mt-0.5">{money(v.balance_due)}</p></div>
                </div>
              )}
              {v.contract_notes && <p className="mt-3 text-sm text-muted-foreground italic line-clamp-2">{v.contract_notes}</p>}
            </div>
          ))}
        </div>
      )}

      <VendorDialog open={dialogOpen} onOpenChange={setDialogOpen} wedding={wedding} editing={editing} onSaved={load} />
    </div>
  );
}

function Stat({ label, value, tone }) {
  return (
    <div className="elegant-card p-4">
      <p className={`serif-heading text-2xl ${tone === 'emerald' ? 'text-emerald-600' : tone === 'violet' ? 'text-violet-600' : 'text-foreground'}`}>{value}</p>
      <p className="text-xs text-muted-foreground uppercase tracking-wider mt-0.5">{label}</p>
    </div>
  );
}

function VendorDialog({ open, onOpenChange, wedding, editing, onSaved }) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('venue');
  const [contactName, setContactName] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [status, setStatus] = useState('not_contacted');
  const [totalCost, setTotalCost] = useState(0);
  const [deposit, setDeposit] = useState(0);
  const [depositPaid, setDepositPaid] = useState(false);
  const [balance, setBalance] = useState(0);
  const [schedule, setSchedule] = useState('');
  const [notes, setNotes] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName(editing?.name || ''); setCategory(editing?.category || 'venue');
      setContactName(editing?.contact_name || ''); setContactInfo(editing?.contact_info || '');
      setStatus(editing?.booking_status || 'not_contacted');
      setTotalCost(editing?.total_cost || 0); setDeposit(editing?.deposit_amount || 0);
      setDepositPaid(editing?.deposit_paid || false); setBalance(editing?.balance_due || 0);
      setSchedule(editing?.payment_schedule || ''); setNotes(editing?.contract_notes || '');
      setDueDate(editing?.due_date || '');
    }
  }, [open, editing]);

  const save = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const payload = {
        wedding_id: wedding.id, name: name.trim(), category,
        contact_name: contactName.trim(), contact_info: contactInfo.trim(),
        booking_status: status,
        total_cost: Number(totalCost) || 0, deposit_amount: Number(deposit) || 0,
        deposit_paid: depositPaid, balance_due: Number(balance) || 0,
        payment_schedule: schedule.trim(), contract_notes: notes.trim(),
        due_date: dueDate || null,
      };
      if (editing) await base44.entities.Vendor.update(editing.id, payload);
      else await base44.entities.Vendor.create(payload);
      onOpenChange(false);
      onSaved();
    } catch (e) {
      alert('Could not save: ' + (e.message || 'error'));
    } finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="serif-heading text-2xl">{editing ? 'Edit vendor' : 'New vendor'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div><Label htmlFor="vn">Vendor name</Label><Input id="vn" value={name} onChange={(e) => setName(e.target.value)} className="mt-1.5" /></div>
            <div>
              <Label htmlFor="vc">Category</Label>
              <ActionSheet id="vc" value={category} onChange={setCategory} options={CATEGORIES.map((c) => ({ value: c, label: c.replace(/_/g, ' ') }))} className="mt-1.5" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label htmlFor="cn">Contact name</Label><Input id="cn" value={contactName} onChange={(e) => setContactName(e.target.value)} className="mt-1.5" /></div>
            <div><Label htmlFor="ci">Contact info</Label><Input id="ci" placeholder="Email / phone" value={contactInfo} onChange={(e) => setContactInfo(e.target.value)} className="mt-1.5" /></div>
          </div>
          <div>
            <Label htmlFor="bs">Booking status</Label>
            <ActionSheet id="bs" value={status} onChange={setStatus} options={STATUSES.map((s) => ({ value: s, label: s.replace(/_/g, ' ') }))} className="mt-1.5" />
          </div>
          <div className="rounded-xl border border-border p-3 space-y-3 bg-secondary/30">
            <p className="text-xs font-medium text-foreground uppercase tracking-wider">Payments</p>
            <div className="grid grid-cols-3 gap-3">
              <div><Label htmlFor="tc">Total cost</Label><Input id="tc" type="number" min="0" value={totalCost} onChange={(e) => setTotalCost(e.target.value)} className="mt-1.5" /></div>
              <div><Label htmlFor="dp">Deposit</Label><Input id="dp" type="number" min="0" value={deposit} onChange={(e) => setDeposit(e.target.value)} className="mt-1.5" /></div>
              <div><Label htmlFor="bl">Balance</Label><Input id="bl" type="number" min="0" value={balance} onChange={(e) => setBalance(e.target.value)} className="mt-1.5" /></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><Label htmlFor="dd">Balance due date</Label><Input id="dd" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="mt-1.5" /></div>
              <label className="flex items-center gap-2 text-sm cursor-pointer self-end pb-2.5">
                <input type="checkbox" checked={depositPaid} onChange={(e) => setDepositPaid(e.target.checked)} className="w-4 h-4 accent-[hsl(var(--primary))]" /> Deposit paid
              </label>
            </div>
            <div><Label htmlFor="ps">Payment schedule</Label><Input id="ps" placeholder="e.g. 50% on signing, 50% day-of" value={schedule} onChange={(e) => setSchedule(e.target.value)} className="mt-1.5" /></div>
          </div>
          <div><Label htmlFor="nt">Contract notes</Label><Textarea id="nt" rows={3} placeholder="Key terms, cancellation policy, what's included…" value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1.5" /></div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} disabled={saving || !name.trim()} className="bg-primary hover:bg-primary/90">{saving ? 'Saving…' : 'Save vendor'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}