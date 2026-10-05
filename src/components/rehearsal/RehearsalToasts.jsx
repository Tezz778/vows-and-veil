import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Mic, Plus, Pencil, Trash2 } from 'lucide-react';

export default function RehearsalToasts({ weddingId }) {
  const [toasts, setToasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = async () => {
    if (!weddingId) return;
    setLoading(true);
    try {
      const t = await base44.entities.RehearsalToast.filter({ wedding_id: weddingId }, 'speaking_order', 50);
      setToasts(t || []);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [weddingId]);

  const remove = async (t) => {
    await base44.entities.RehearsalToast.delete(t.id);
    setToasts((p) => p.filter((x) => x.id !== t.id));
  };

  if (loading) return <div className="text-center py-12 text-muted-foreground">Loading…</div>;

  return (
    <div className="elegant-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Mic className="w-4 h-4 text-primary" />
          <h3 className="serif-heading text-lg text-foreground">Toast & speech order</h3>
        </div>
        <Button size="sm" variant="ghost" onClick={() => { setEditing(null); setDialogOpen(true); }} className="text-primary">
          <Plus className="w-3.5 h-3.5 mr-1" /> Add speaker
        </Button>
      </div>
      {toasts.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4">List parents, the wedding party, or anyone giving remarks — in speaking order.</p>
      ) : (
        <ol className="space-y-2">
          {toasts.map((t, i) => (
            <li key={t.id} className="flex items-start justify-between gap-3 rounded-lg border border-border/60 p-3 group">
              <div className="flex items-start gap-3 min-w-0">
                <span className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium shrink-0">{i + 1}</span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">{t.speaker_name}</p>
                  {t.role && <p className="text-xs text-muted-foreground">{t.role}</p>}
                  {t.notes && <p className="text-xs text-muted-foreground mt-0.5">{t.notes}</p>}
                </div>
              </div>
              <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                <button onClick={() => { setEditing(t); setDialogOpen(true); }} aria-label="Edit speaker" className="p-1 rounded hover:bg-secondary text-muted-foreground"><Pencil className="w-3.5 h-3.5" /></button>
                <button onClick={() => remove(t)} aria-label="Delete speaker" className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </li>
          ))}
        </ol>
      )}
      <ToastDialog open={dialogOpen} onOpenChange={setDialogOpen} weddingId={weddingId} editing={editing} onSaved={load} existingCount={toasts.length} />
    </div>
  );
}

function ToastDialog({ open, onOpenChange, weddingId, editing, onSaved, existingCount }) {
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName(editing?.speaker_name || '');
      setRole(editing?.role || '');
      setNotes(editing?.notes || '');
    }
  }, [open, editing]);

  const save = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const data = { wedding_id: weddingId, speaker_name: name.trim(), role: role.trim(), notes: notes.trim() };
      if (editing) await base44.entities.RehearsalToast.update(editing.id, data);
      else await base44.entities.RehearsalToast.create({ ...data, speaking_order: existingCount + 1 });
      onOpenChange(false);
      onSaved();
    } catch (e) { alert('Could not save: ' + (e.message || 'error')); }
    finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle className="serif-heading text-2xl">{editing ? 'Edit speaker' : 'Add speaker'}</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <div><Label htmlFor="sn">Speaker name</Label><Input id="sn" placeholder="e.g. Sarah's father" value={name} onChange={(e) => setName(e.target.value)} className="mt-1.5" /></div>
          <div><Label htmlFor="sr">Role / relationship</Label><Input id="sr" placeholder="e.g. Father of the bride" value={role} onChange={(e) => setRole(e.target.value)} className="mt-1.5" /></div>
          <div><Label htmlFor="snt">Notes</Label><Textarea id="snt" rows={2} placeholder="Topic, length, anything to remember…" value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1.5" /></div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} disabled={saving || !name.trim()} className="bg-primary hover:bg-primary/90">{saving ? 'Saving…' : 'Save'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}