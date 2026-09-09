import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DollarSign, Plus, Pencil, Trash2, ArrowRight } from 'lucide-react';

const CATEGORY = 'Rehearsal Dinner';

export default function RehearsalBudget({ weddingId }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = async () => {
    if (!weddingId) return;
    setLoading(true);
    try {
      const all = await base44.entities.BudgetItem.filter({ wedding_id: weddingId }, 'category', 200);
      setItems((all || []).filter((i) => i.category === CATEGORY));
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [weddingId]);

  const remove = async (it) => {
    await base44.entities.BudgetItem.delete(it.id);
    setItems((p) => p.filter((x) => x.id !== it.id));
  };

  if (loading) return <div className="text-center py-12 text-muted-foreground">Loading…</div>;

  const totalEst = items.reduce((s, i) => s + (i.estimated_amount || 0), 0);
  const totalActual = items.reduce((s, i) => s + (i.actual_amount || 0), 0);

  return (
    <div className="elegant-card p-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-primary" />
          <h3 className="serif-heading text-lg text-foreground">Rehearsal budget</h3>
        </div>
        <Button size="sm" variant="ghost" onClick={() => { setEditing(null); setDialogOpen(true); }} className="text-primary">
          <Plus className="w-3.5 h-3.5 mr-1" /> Add line
        </Button>
      </div>
      <p className="text-xs text-muted-foreground mb-4">These feed into your <Link to="/budget" className="text-primary hover:underline inline-flex items-center">main budget tracker <ArrowRight className="w-3 h-3 ml-0.5" /></Link></p>

      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="rounded-xl bg-secondary/50 p-4 text-center">
          <p className="serif-heading text-2xl text-foreground">${totalEst.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Estimated</p>
        </div>
        <div className="rounded-xl bg-secondary/50 p-4 text-center">
          <p className="serif-heading text-2xl text-foreground">${totalActual.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Actual</p>
        </div>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4">Add line items like venue, catering, and decor.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((it) => (
            <li key={it.id} className="flex items-center justify-between gap-3 rounded-lg border border-border/60 p-3 group">
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">{it.vendor_name || 'Untitled'}</p>
                <p className="text-xs text-muted-foreground">Est ${it.estimated_amount || 0} · Actual ${it.actual_amount || 0}</p>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => { setEditing(it); setDialogOpen(true); }} className="p-1 rounded hover:bg-secondary text-muted-foreground"><Pencil className="w-3.5 h-3.5" /></button>
                <button onClick={() => remove(it)} className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <BudgetDialog open={dialogOpen} onOpenChange={setDialogOpen} weddingId={weddingId} editing={editing} onSaved={load} />
    </div>
  );
}

function BudgetDialog({ open, onOpenChange, weddingId, editing, onSaved }) {
  const [name, setName] = useState('');
  const [est, setEst] = useState('');
  const [actual, setActual] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName(editing?.vendor_name || '');
      setEst(editing?.estimated_amount || '');
      setActual(editing?.actual_amount || '');
    }
  }, [open, editing]);

  const save = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const data = { wedding_id: weddingId, category: CATEGORY, vendor_name: name.trim(),
        estimated_amount: Number(est) || 0, actual_amount: Number(actual) || 0 };
      if (editing) await base44.entities.BudgetItem.update(editing.id, data);
      else await base44.entities.BudgetItem.create(data);
      onOpenChange(false);
      onSaved();
    } catch (e) { alert('Could not save: ' + (e.message || 'error')); }
    finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle className="serif-heading text-2xl">{editing ? 'Edit line item' : 'Add line item'}</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <div><Label htmlFor="bn">Description</Label><Input id="bn" placeholder="e.g. Catering" value={name} onChange={(e) => setName(e.target.value)} className="mt-1.5" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label htmlFor="be">Estimated ($)</Label><Input id="be" type="number" min="0" value={est} onChange={(e) => setEst(e.target.value)} className="mt-1.5" /></div>
            <div><Label htmlFor="ba">Actual ($)</Label><Input id="ba" type="number" min="0" value={actual} onChange={(e) => setActual(e.target.value)} className="mt-1.5" /></div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} disabled={saving || !name.trim()} className="bg-primary hover:bg-primary/90">{saving ? 'Saving…' : 'Save'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}