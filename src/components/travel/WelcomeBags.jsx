import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import ActionSheet from '@/components/ui/action-sheet';
import { Plus, Trash2, Pencil, Gift } from 'lucide-react';

const STATUSES = [
  { v: 'not_started', label: 'Not started' },
  { v: 'in_progress', label: 'In progress' },
  { v: 'delivered', label: 'Delivered' },
];

export default function WelcomeBags({ weddingId }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = async () => {
    if (!weddingId) return;
    setLoading(true);
    try {
      const list = await base44.entities.WelcomeBag.filter({ wedding_id: weddingId }, 'guest_name', 200);
      setItems(list || []);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [weddingId]);

  const remove = async (it) => { await base44.entities.WelcomeBag.delete(it.id); setItems((p) => p.filter((x) => x.id !== it.id)); };

  if (loading) return <div className="text-center py-12 text-muted-foreground">Loading…</div>;

  const delivered = items.filter((i) => i.status === 'delivered').length;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h2 className="serif-heading text-xl text-foreground">Welcome Bags & Gifting</h2>
        <Button size="sm" onClick={() => { setEditing(null); setDialogOpen(true); }} className="bg-primary hover:bg-primary/90"><Plus className="w-4 h-4 mr-1" /> Add bag</Button>
      </div>
      <p className="text-sm text-muted-foreground mb-5">Tie welcome bags and gifts to hotel room assignments so they're ready when guests arrive.</p>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="elegant-card p-4"><p className="serif-heading text-2xl text-foreground">{items.length}</p><p className="text-xs text-muted-foreground uppercase tracking-wider mt-0.5">Bags planned</p></div>
        <div className="elegant-card p-4"><p className="serif-heading text-2xl text-emerald-600">{delivered}</p><p className="text-xs text-muted-foreground uppercase tracking-wider mt-0.5">Delivered</p></div>
      </div>

      {items.length === 0 ? (
        <div className="elegant-card p-10 text-center">
          <Gift className="w-9 h-9 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Add a welcome bag for each room — note the contents and delivery status.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {items.map((it) => (
            <div key={it.id} className="elegant-card p-5 group">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h4 className="serif-heading text-lg text-foreground">{it.guest_name}</h4>
                  {it.room_number && <p className="text-sm text-muted-foreground">Room {it.room_number}</p>}
                </div>
                <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  <button onClick={() => { setEditing(it); setDialogOpen(true); }} aria-label="Edit welcome bag" className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground"><Pencil className="w-3.5 h-3.5" /></button>
                  <button onClick={() => remove(it)} aria-label="Delete welcome bag" className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
              {it.contents && <p className="text-sm text-muted-foreground mt-2">{it.contents}</p>}
              <span className={`inline-block mt-3 text-[11px] px-2 py-0.5 rounded-full ${
                it.status === 'delivered' ? 'bg-emerald-100 text-emerald-700' : it.status === 'in_progress' ? 'bg-primary/10 text-primary' : 'bg-secondary text-muted-foreground'
              }`}>{STATUSES.find((s) => s.v === it.status)?.label || 'Not started'}</span>
              {it.notes && <p className="text-xs text-muted-foreground mt-2 pt-2 border-t border-border/60">{it.notes}</p>}
            </div>
          ))}
        </div>
      )}
      <BagDialog open={dialogOpen} onOpenChange={setDialogOpen} weddingId={weddingId} editing={editing} onSaved={load} />
    </div>
  );
}

function BagDialog({ open, onOpenChange, weddingId, editing, onSaved }) {
  const [name, setName] = useState('');
  const [room, setRoom] = useState('');
  const [contents, setContents] = useState('');
  const [status, setStatus] = useState('not_started');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName(editing?.guest_name || ''); setRoom(editing?.room_number || '');
      setContents(editing?.contents || ''); setStatus(editing?.status || 'not_started');
      setNotes(editing?.notes || '');
    }
  }, [open, editing]);

  const save = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const data = { wedding_id: weddingId, guest_name: name.trim(), room_number: room.trim(),
        contents: contents.trim(), status, notes: notes.trim() };
      if (editing) await base44.entities.WelcomeBag.update(editing.id, data);
      else await base44.entities.WelcomeBag.create(data);
      onOpenChange(false); onSaved();
    } catch (e) { alert('Could not save: ' + (e.message || 'error')); }
    finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle className="serif-heading text-2xl">{editing ? 'Edit welcome bag' : 'Add welcome bag'}</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <div><Label htmlFor="wgn">Guest / room name</Label><Input id="wgn" value={name} onChange={(e) => setName(e.target.value)} className="mt-1.5" /></div>
          <div><Label htmlFor="wr">Room number</Label><Input id="wr" placeholder="e.g. 214" value={room} onChange={(e) => setRoom(e.target.value)} className="mt-1.5" /></div>
          <div><Label htmlFor="wc">Contents</Label><Textarea id="wc" rows={2} placeholder="What's in the bag…" value={contents} onChange={(e) => setContents(e.target.value)} className="mt-1.5" /></div>
          <div><Label htmlFor="ws">Status</Label>
            <ActionSheet id="ws" value={status} onChange={setStatus} options={STATUSES.map((s) => ({ value: s.v, label: s.label }))} className="mt-1.5" />
          </div>
          <div><Label htmlFor="wn">Notes</Label><Input id="wn" value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1.5" /></div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} disabled={saving || !name.trim()} className="bg-primary hover:bg-primary/90">{saving ? 'Saving…' : 'Save'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}