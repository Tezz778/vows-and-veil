import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import ActionSheet from '@/components/ui/action-sheet';
import { Plus, Trash2, Pencil, ClipboardCheck, Check } from 'lucide-react';

const CATEGORIES = [
  { v: 'documents', label: 'Documents' },
  { v: 'essentials', label: 'Essentials' },
  { v: 'attire', label: 'Attire' },
  { v: 'other', label: 'Other' },
];

const DEFAULTS = [
  { title: 'Passport (valid 6+ months)', category: 'documents' },
  { title: 'Visa / entry permit', category: 'documents' },
  { title: 'Marriage license documents', category: 'documents' },
  { title: 'Travel insurance', category: 'documents' },
  { title: 'Phone charger + adapter', category: 'essentials' },
  { title: 'Medications', category: 'essentials' },
  { title: 'Wedding attire', category: 'attire' },
];

export default function PackingDocs({ weddingId }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = async () => {
    if (!weddingId) return;
    setLoading(true);
    try {
      const list = await base44.entities.PackingItem.filter({ wedding_id: weddingId }, 'category', 200);
      setItems(list || []);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [weddingId]);

  const toggle = async (it) => {
    setItems((p) => p.map((x) => x.id === it.id ? { ...x, done: !x.done } : x));
    try { await base44.entities.PackingItem.update(it.id, { done: !it.done }); } catch (e) { load(); }
  };

  const remove = async (it) => { await base44.entities.PackingItem.delete(it.id); setItems((p) => p.filter((x) => x.id !== it.id)); };

  const seedDefaults = async () => {
    const records = DEFAULTS.map((d) => ({ wedding_id: weddingId, title: d.title, category: d.category, done: false }));
    await base44.entities.PackingItem.bulkCreate(records);
    load();
  };

  if (loading) return <div className="text-center py-12 text-muted-foreground">Loading…</div>;

  const done = items.filter((i) => i.done).length;
  const byCategory = CATEGORIES.map((c) => ({ ...c, items: items.filter((i) => i.category === c.v) }));

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h2 className="serif-heading text-xl text-foreground">Packing & Documents</h2>
        <div className="flex gap-2">
          {items.length === 0 && <Button size="sm" variant="outline" onClick={seedDefaults}>Add typical checklist</Button>}
          <Button size="sm" onClick={() => { setEditing(null); setDialogOpen(true); }} className="bg-primary hover:bg-primary/90"><Plus className="w-4 h-4 mr-1" /> Add item</Button>
        </div>
      </div>
      <p className="text-sm text-muted-foreground mb-5">Especially useful for international destinations — passports, visas, entry requirements, and the essentials.</p>

      {items.length > 0 && (
        <div className="elegant-card p-4 mb-6 flex items-center gap-3">
          <ClipboardCheck className="w-5 h-5 text-primary" />
          <p className="text-sm text-foreground">{done} of {items.length} ready</p>
          <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
            <div className="h-full bg-primary transition-all" style={{ width: `${items.length ? (done / items.length) * 100 : 0}%` }} />
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <div className="elegant-card p-10 text-center">
          <ClipboardCheck className="w-9 h-9 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground mb-4">Start your travel checklist, or add a typical one to customize.</p>
          <Button size="sm" variant="outline" onClick={seedDefaults}>Add typical checklist</Button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-6">
          {byCategory.map((c) => c.items.length > 0 && (
            <div key={c.v}>
              <h3 className="text-xs text-muted-foreground uppercase tracking-wider mb-3">{c.label}</h3>
              <ul className="space-y-2">
                {c.items.map((it) => (
                  <li key={it.id} className="flex items-start justify-between gap-3 rounded-lg border border-border/60 p-3 group">
                    <label className="flex items-start gap-3 cursor-pointer flex-1">
                      <button onClick={() => toggle(it)} className={`w-5 h-5 rounded-md border shrink-0 mt-0.5 flex items-center justify-center ${
                        it.done ? 'bg-primary border-primary' : 'border-input'
                      }`}>{it.done && <Check className="w-3.5 h-3.5 text-primary-foreground" />}</button>
                      <div className="min-w-0">
                        <p className={`text-sm font-medium ${it.done ? 'text-muted-foreground line-through' : 'text-foreground'}`}>{it.title}</p>
                        {it.notes && <p className="text-xs text-muted-foreground mt-0.5">{it.notes}</p>}
                      </div>
                    </label>
                    <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setEditing(it); setDialogOpen(true); }} className="p-1 rounded hover:bg-secondary text-muted-foreground"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => remove(it)} className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
      <PackingDialog open={dialogOpen} onOpenChange={setDialogOpen} weddingId={weddingId} editing={editing} onSaved={load} />
    </div>
  );
}

function PackingDialog({ open, onOpenChange, weddingId, editing, onSaved }) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('essentials');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle(editing?.title || ''); setCategory(editing?.category || 'essentials');
      setNotes(editing?.notes || '');
    }
  }, [open, editing]);

  const save = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      const data = { wedding_id: weddingId, title: title.trim(), category, notes: notes.trim() };
      if (editing) await base44.entities.PackingItem.update(editing.id, data);
      else await base44.entities.PackingItem.create({ ...data, done: false });
      onOpenChange(false); onSaved();
    } catch (e) { alert('Could not save: ' + (e.message || 'error')); }
    finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle className="serif-heading text-2xl">{editing ? 'Edit item' : 'Add item'}</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <div><Label htmlFor="pt">Item</Label><Input id="pt" placeholder="e.g. Passport" value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1.5" /></div>
          <div><Label htmlFor="pc">Category</Label>
            <ActionSheet id="pc" value={category} onChange={setCategory} options={CATEGORIES.map((c) => ({ value: c.v, label: c.label }))} className="mt-1.5" />
          </div>
          <div><Label htmlFor="pn">Notes</Label><Textarea id="pn" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1.5" /></div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} disabled={saving || !title.trim()} className="bg-primary hover:bg-primary/90">{saving ? 'Saving…' : 'Save'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}