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
import { Plus, Trash2, Pencil, Briefcase } from 'lucide-react';

const CATEGORIES = [
  { value: 'venue', label: 'Venue' },
  { value: 'photography', label: 'Photography' },
  { value: 'videography', label: 'Videography' },
  { value: 'catering', label: 'Catering' },
  { value: 'bar', label: 'Bar' },
  { value: 'florist', label: 'Florist' },
  { value: 'music', label: 'Music' },
  { value: 'officiant', label: 'Officiant' },
  { value: 'beauty', label: 'Beauty' },
  { value: 'stationery', label: 'Stationery' },
  { value: 'rentals', label: 'Rentals' },
  { value: 'transportation', label: 'Transportation' },
  { value: 'planner', label: 'Planner' },
  { value: 'other', label: 'Other' },
];

const STATUS = {
  not_contacted: { label: 'Not contacted', cls: 'bg-secondary text-muted-foreground' },
  contacted: { label: 'Contacted', cls: 'bg-amber-100 text-amber-700' },
  contracted: { label: 'Contracted', cls: 'bg-sky-100 text-sky-700' },
  deposit_paid: { label: 'Deposit paid', cls: 'bg-indigo-100 text-indigo-700' },
  confirmed: { label: 'Confirmed', cls: 'bg-emerald-100 text-emerald-700' },
  cancelled: { label: 'Cancelled', cls: 'bg-rose-100 text-rose-700' },
};

const catLabel = (v) => CATEGORIES.find((c) => c.value === v)?.label || v;

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
      const list = await base44.entities.Vendor.filter({ wedding_id: wedding.id });
      setVendors(list || []);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [wedding]);

  if (!wedding) return null;
  if (!hasFeature(tier, 'vendors')) return <FeatureGate tierLabel="Single Day" />;

  const totalCost = vendors.reduce((s, v) => s + (Number(v.total_cost) || 0), 0);
  const totalDeposit = vendors.reduce((s, v) => s + (Number(v.deposit_amount) || 0), 0);
  const confirmed = vendors.filter((v) => v.booking_status === 'confirmed').length;

  const grouped = CATEGORIES.map((c) => ({ ...c, items: vendors.filter((v) => v.category === c.value) })).filter((g) => g.items.length);

  const openAdd = () => { setEditing(null); setDialogOpen(true); };
  const openEdit = (v) => { setEditing(v); setDialogOpen(true); };

  return (
    <div>
      <PageHeader eyebrow="The Team" title="Vendors & Contracts"
        subtitle="Track contacts, booking status, payments, and contract notes for every vendor."
      >
        <Button onClick={openAdd} className="bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-1" /> Add vendor
        </Button>
      </PageHeader>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="elegant-card p-4"><p className="serif-heading text-2xl text-foreground">{vendors.length}</p><p className="text-xs text-muted-foreground uppercase tracking-wider mt-0.5">Vendors</p></div>
        <div className="elegant-card p-4"><p className="serif-heading text-2xl text-emerald-600">{confirmed}</p><p className="text-xs text-muted-foreground uppercase tracking-wider mt-0.5">Confirmed</p></div>
        <div className="elegant-card p-4"><p className="serif-heading text-2xl text-foreground">${totalCost.toLocaleString()}</p><p className="text-xs text-muted-foreground uppercase tracking-wider mt-0.5">Total cost</p></div>
        <div className="elegant-card p-4"><p className="serif-heading text-2xl text-foreground">${totalDeposit.toLocaleString()}</p><p className="text-xs text-muted-foreground uppercase tracking-wider mt-0.5">Deposits</p></div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-muted-foreground">Loading vendors…</div>
      ) : vendors.length === 0 ? (
        <div className="elegant-card p-12 text-center">
          <Briefcase className="w-10 h-10 text-muted-foreground/30 mx-auto mb-4" />
          <p className="serif-heading text-xl text-foreground">No vendors yet</p>
          <p className="text-sm text-muted-foreground mt-1 mb-5">Add your venue, photographer, caterer, and more to keep everything in one place.</p>
          <Button onClick={openAdd} className="bg-primary hover:bg-primary/90"><Plus className="w-4 h-4 mr-1" /> Add your first vendor</Button>
        </div>
      ) : (
        <div className="space-y-8">
          {grouped.map((g) => (
            <div key={g.value}>
              <h3 className="text-xs tracking-[0.2em] uppercase text-muted-foreground mb-3">{g.label}</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                {g.items.map((v) => {
                  const st = STATUS[v.booking_status] || STATUS.not_contacted;
                  const pct = v.total_cost > 0 ? Math.min(100, Math.round((v.deposit_paid ? (Number(v.deposit_amount) || 0) / v.total_cost : 0) * 100)) : 0;
                  return (
                    <div key={v.id} className="elegant-card p-5 group">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h4 className="serif-heading text-lg text-foreground">{v.name}</h4>
                          {v.contact_name && <p className="text-sm text-muted-foreground">{v.contact_name}</p>}
                          {v.contact_info && <p className="text-xs text-muted-foreground">{v.contact_info}</p>}
                        </div>
                        <span className={`text-[11px] px-2.5 py-1 rounded-full whitespace-nowrap ${st.cls}`}>{st.label}</span>
                      </div>
                      {(v.total_cost > 0 || v.deposit_amount > 0) && (
                        <div className="mt-4">
                          <div className="flex justify-between text-xs text-muted-foreground mb-1">
                            <span>${(v.deposit_paid ? (Number(v.deposit_amount) || 0) : 0).toLocaleString()} of ${Number(v.total_cost || 0).toLocaleString()}</span>
                            <span>{pct}%</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                            <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                          {v.balance_due_date && <p className="text-xs text-muted-foreground mt-1.5">Balance due {v.balance_due_date}</p>}
                        </div>
                      )}
                      {v.contract_notes && <p className="text-sm text-muted-foreground mt-3 pt-3 border-t border-border/60">{v.contract_notes}</p>}
                      <div className="flex gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEdit(v)} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground"><Pencil className="w-3.5 h-3.5" /></button>
                        <button onClick={() => base44.entities.Vendor.delete(v.id).then(load)} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <VendorDialog open={dialogOpen} onOpenChange={setDialogOpen} wedding={wedding} editing={editing} onSaved={load} />
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
  const [depositAmount, setDepositAmount] = useState(0);
  const [depositPaid, setDepositPaid] = useState(false);
  const [balanceDue, setBalanceDue] = useState('');
  const [schedule, setSchedule] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName(editing?.name || ''); setCategory(editing?.category || 'venue');
      setContactName(editing?.contact_name || ''); setContactInfo(editing?.contact_info || '');
      setStatus(editing?.booking_status || 'not_contacted');
      setTotalCost(editing?.total_cost || 0); setDepositAmount(editing?.deposit_amount || 0);
      setDepositPaid(editing?.deposit_paid || false); setBalanceDue(editing?.balance_due_date || '');
      setSchedule(editing?.payment_schedule || ''); setNotes(editing?.contract_notes || '');
    }
  }, [open, editing]);

  const save = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const payload = {
        wedding_id: wedding.id, name: name.trim(), category,
        contact_name: contactName.trim(), contact_info: contactInfo.trim(),
        booking_status: status, total_cost: Number(totalCost) || 0,
        deposit_amount: Number(depositAmount) || 0, deposit_paid: depositPaid,
        balance_due_date: balanceDue || null, payment_schedule: schedule.trim(),
        contract_notes: notes.trim(),
      };
      if (editing) await base44.entities.Vendor.update(editing.id, payload);
      else await base44.entities.Vendor.create(payload);
      onOpenChange(false); onSaved();
    } catch (e) { alert('Could not save: ' + (e.message || 'error')); }
    finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle className="serif-heading text-2xl">{editing ? 'Edit vendor' : 'Add vendor'}</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2 max-h-[70vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-3">
            <div><Label htmlFor="vn">Vendor name</Label><Input id="vn" value={name} onChange={(e) => setName(e.target.value)} className="mt-1.5" /></div>
            <div>
              <Label htmlFor="vc">Category</Label>
              <select id="vc" value={category} onChange={(e) => setCategory(e.target.value)} className="mt-1.5 w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
                {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label htmlFor="cn">Contact name</Label><Input id="cn" value={contactName} onChange={(e) => setContactName(e.target.value)} className="mt-1.5" /></div>
            <div><Label htmlFor="ci">Contact info</Label><Input id="ci" placeholder="Email / phone" value={contactInfo} onChange={(e) => setContactInfo(e.target.value)} className="mt-1.5" /></div>
          </div>
          <div>
            <Label htmlFor="bs">Booking status</Label>
            <select id="bs" value={status} onChange={(e) => setStatus(e.target.value)} className="mt-1.5 w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
              {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label htmlFor="tc">Total cost ($)</Label><Input id="tc" type="number" min="0" value={totalCost} onChange={(e) => setTotalCost(e.target.value)} className="mt-1.5" /></div>
            <div><Label htmlFor="da">Deposit amount ($)</Label><Input id="da" type="number" min="0" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} className="mt-1.5" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3 items-end">
            <div><Label htmlFor="bd">Balance due date</Label><Input id="bd" type="date" value={balanceDue} onChange={(e) => setBalanceDue(e.target.value)} className="mt-1.5" /></div>
            <label className="flex items-center gap-2 text-sm cursor-pointer pb-2">
              <input type="checkbox" checked={depositPaid} onChange={(e) => setDepositPaid(e.target.checked)} className="w-4 h-4 accent-[hsl(var(--primary))]" /> Deposit paid
            </label>
          </div>
          <div><Label htmlFor="ps">Payment schedule</Label><Textarea id="ps" rows={2} placeholder="e.g. 50% on signing, 50% 2 weeks before" value={schedule} onChange={(e) => setSchedule(e.target.value)} className="mt-1.5" /></div>
          <div><Label htmlFor="n">Contract notes</Label><Textarea id="n" rows={3} placeholder="Key terms, what's included, deadlines…" value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1.5" /></div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} disabled={saving || !name.trim()} className="bg-primary hover:bg-primary/90">{saving ? 'Saving…' : 'Save vendor'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}