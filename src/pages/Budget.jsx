import { useEffect, useState, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/PageHeader';
import FeatureGate from '@/components/FeatureGate';
import { hasFeature } from '@/lib/wedding';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Trash2, Pencil, DollarSign, Check } from 'lucide-react';

const CATEGORIES = ['Venue', 'Catering', 'Photography', 'Videography', 'Florals', 'Attire', 'Music', 'Stationery', 'Transport', 'Other'];

export default function Budget() {
  const { wedding, tier } = useOutletContext();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = async () => {
    if (!wedding) return;
    setLoading(true);
    try {
      const list = await base44.entities.BudgetItem.filter({ wedding_id: wedding.id }, 'category', 200);
      setItems(list || []);
    } catch {} finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [wedding]);

  const totals = useMemo(() => {
    const est = items.reduce((s, i) => s + (Number(i.estimated_amount) || 0), 0);
    const actual = items.reduce((s, i) => s + (Number(i.actual_amount) || 0), 0);
    const paid = items.reduce((s, i) => s + (Number(i.paid_amount) || 0), 0);
    return { est, actual, paid, owed: actual - paid };
  }, [items]);

  if (!wedding) return null;
  if (!hasFeature(tier, 'budget')) return <FeatureGate tierLabel="Multiday" />;

  const remove = async (id) => {
    await base44.entities.BudgetItem.delete(id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  return (
    <div>
      <PageHeader eyebrow="The numbers" title="Budget Tracker"
        subtitle="Track what's estimated, paid, and owed — tied to your vendors."
      >
        <Button onClick={() => { setEditing(null); setDialog(true); }} className="bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-1" /> Add item
        </Button>
      </PageHeader>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <Stat label="Estimated" value={totals.est} />
        <Stat label="Actual" value={totals.actual} tone="amber" />
        <Stat label="Paid" value={totals.paid} tone="emerald" />
        <Stat label="Owed" value={totals.owed} tone="rose" />
      </div>

      {loading ? (
        <div className="text-center py-16 text-muted-foreground">Loading…</div>
      ) : items.length === 0 ? (
        <div className="elegant-card p-12 text-center">
          <DollarSign className="w-10 h-10 text-muted-foreground/30 mx-auto mb-4" />
          <p className="serif-heading text-xl text-foreground">No budget items yet</p>
          <p className="text-sm text-muted-foreground mt-1 mb-5">Add your first category to start tracking.</p>
          <Button onClick={() => { setEditing(null); setDialog(true); }} className="bg-primary hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-1" /> Add item
          </Button>
        </div>
      ) : (
        <div className="elegant-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-muted-foreground">
              <tr>
                <th className="text-left font-medium px-4 py-3">Category</th>
                <th className="text-left font-medium px-4 py-3 hidden sm:table-cell">Vendor</th>
                <th className="text-right font-medium px-4 py-3">Est.</th>
                <th className="text-right font-medium px-4 py-3">Actual</th>
                <th className="text-right font-medium px-4 py-3">Paid</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => {
                const fullyPaid = (Number(it.actual_amount) || 0) > 0 && (Number(it.paid_amount) || 0) >= (Number(it.actual_amount) || 0);
                return (
                  <tr key={it.id} className="border-t border-border group">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">{it.category}</span>
                        {fullyPaid && <span className="text-emerald-600"><Check className="w-3.5 h-3.5" /></span>}
                      </div>
                      <span className="text-xs text-muted-foreground sm:hidden">{it.vendor_name}</span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{it.vendor_name || '—'}</td>
                    <td className="px-4 py-3 text-right">${(Number(it.estimated_amount) || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right">${(Number(it.actual_amount) || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-emerald-700">${(Number(it.paid_amount) || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setEditing(it); setDialog(true); }} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground"><Pencil className="w-3.5 h-3.5" /></button>
                        <button onClick={() => remove(it.id)} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <ItemDialog open={dialog} onOpenChange={setDialog} wedding={wedding} editing={editing} onSaved={() => { setDialog(false); load(); }} />
    </div>
  );
}

function Stat({ label, value, tone }) {
  const color = tone === 'emerald' ? 'text-emerald-600' : tone === 'rose' ? 'text-rose-600' : tone === 'amber' ? 'text-amber-600' : 'text-foreground';
  return (
    <div className="elegant-card p-4">
      <p className={`serif-heading text-2xl ${color}`}>${value.toLocaleString()}</p>
      <p className="text-xs text-muted-foreground uppercase tracking-wider mt-0.5">{label}</p>
    </div>
  );
}

function ItemDialog({ open, onOpenChange, wedding, editing, onSaved }) {
  const [cat, setCat] = useState('Venue');
  const [vendor, setVendor] = useState('');
  const [est, setEst] = useState(0);
  const [actual, setActual] = useState(0);
  const [paid, setPaid] = useState(0);
  const [due, setDue] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setCat(editing?.category || 'Venue'); setVendor(editing?.vendor_name || '');
      setEst(editing?.estimated_amount || 0); setActual(editing?.actual_amount || 0);
      setPaid(editing?.paid_amount || 0); setDue(editing?.due_date || '');
    }
  }, [open, editing]);

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        wedding_id: wedding.id, category: cat, vendor_name: vendor.trim(),
        estimated_amount: Number(est) || 0, actual_amount: Number(actual) || 0,
        paid_amount: Number(paid) || 0, due_date: due || null,
      };
      if (editing) await base44.entities.BudgetItem.update(editing.id, payload);
      else await base44.entities.BudgetItem.create(payload);
      onSaved();
    } catch (e) { alert('Could not save: ' + (e.message || 'error')); }
    finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle className="serif-heading text-2xl">{editing ? 'Edit item' : 'Budget item'}</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="c">Category</Label>
              <select id="c" value={cat} onChange={(e) => setCat(e.target.value)} className="mt-1.5 w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div><Label htmlFor="v">Vendor</Label><Input id="v" value={vendor} onChange={(e) => setVendor(e.target.value)} className="mt-1.5" /></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><Label htmlFor="e">Estimated $</Label><Input id="e" type="number" min="0" value={est} onChange={(e) => setEst(e.target.value)} className="mt-1.5" /></div>
            <div><Label htmlFor="a">Actual $</Label><Input id="a" type="number" min="0" value={actual} onChange={(e) => setActual(e.target.value)} className="mt-1.5" /></div>
            <div><Label htmlFor="p">Paid $</Label><Input id="p" type="number" min="0" value={paid} onChange={(e) => setPaid(e.target.value)} className="mt-1.5" /></div>
          </div>
          <div><Label htmlFor="d">Due date</Label><Input id="d" type="date" value={due} onChange={(e) => setDue(e.target.value)} className="mt-1.5" /></div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} disabled={saving} className="bg-primary hover:bg-primary/90">{saving ? 'Saving…' : 'Save'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}