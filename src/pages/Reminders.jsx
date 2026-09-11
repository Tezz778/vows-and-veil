import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/PageHeader';
import FeatureGate from '@/components/FeatureGate';
import { hasFeature, daysUntil } from '@/lib/wedding';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Trash2, Bell, Check, Clock, AlertCircle } from 'lucide-react';

export default function Reminders() {
  const { wedding, tier } = useOutletContext();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState(false);

  const load = async () => {
    if (!wedding) return;
    setLoading(true);
    try {
      const list = await base44.entities.ReminderTask.filter({ wedding_id: wedding.id }, 'due_date', 200);
      setItems(list || []);
    } catch {} finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [wedding]);
  if (!wedding) return null;
  if (!hasFeature(tier, 'reminders')) return <FeatureGate tierLabel="Multiday" />;

  const toggle = async (it) => {
    const done = !it.done;
    setItems((prev) => prev.map((x) => (x.id === it.id ? { ...x, done } : x)));
    await base44.entities.ReminderTask.update(it.id, { done });
  };
  const remove = async (id) => {
    await base44.entities.ReminderTask.delete(id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const pending = items.filter((i) => !i.done).sort((a, b) => (a.due_date || '9999').localeCompare(b.due_date || '9999'));
  const done = items.filter((i) => i.done);

  const urgency = (d) => {
    const days = daysUntil(d);
    if (days === null) return { tone: 'text-muted-foreground', label: '' };
    if (days < 0) return { tone: 'text-rose-600', label: `${Math.abs(days)} days overdue` };
    if (days === 0) return { tone: 'text-amber-600', label: 'Today' };
    if (days <= 7) return { tone: 'text-amber-600', label: `in ${days} days` };
    return { tone: 'text-muted-foreground', label: `in ${days} days` };
  };

  return (
    <div>
      <PageHeader eyebrow="Stay on track" title="Reminders"
        subtitle="Gentle nudges for planning tasks as your day approaches."
      >
        <Button onClick={() => setDialog(true)} className="bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-1" /> Add reminder
        </Button>
      </PageHeader>

      {loading ? (
        <div className="text-center py-16 text-muted-foreground">Loading…</div>
      ) : items.length === 0 ? (
        <div className="elegant-card p-12 text-center">
          <Bell className="w-10 h-10 text-muted-foreground/30 mx-auto mb-4" />
          <p className="serif-heading text-xl text-foreground">No reminders yet</p>
          <p className="text-sm text-muted-foreground mt-1 mb-5">Add tasks like "finalize playlist" or "send thank-you notes".</p>
          <Button onClick={() => setDialog(true)} className="bg-primary hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-1" /> Add your first reminder
          </Button>
        </div>
      ) : (
        <div className="space-y-8">
          {pending.length > 0 && (
            <div>
              <h3 className="serif-heading text-lg text-foreground mb-3">Upcoming ({pending.length})</h3>
              <div className="space-y-2">
                {pending.map((it) => {
                  const u = urgency(it.due_date);
                  const overdue = daysUntil(it.due_date) !== null && daysUntil(it.due_date) < 0;
                  return (
                    <div key={it.id} className="elegant-card p-3.5 flex items-center gap-3 group">
                      <button onClick={() => toggle(it)}
                        className="w-5 h-5 rounded-md border-2 border-border hover:border-primary flex items-center justify-center shrink-0 transition-colors" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{it.title}</p>
                        <p className={`text-xs flex items-center gap-1 ${u.tone}`}>
                          {overdue ? <AlertCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                          {it.due_date ? `${new Date(it.due_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · ${u.label}` : 'No date'}
                        </p>
                      </div>
                      <button onClick={() => remove(it.id)} className="p-1 rounded-lg opacity-100 sm:opacity-0 sm:group-hover:opacity-100 hover:bg-secondary text-muted-foreground hover:text-destructive transition-all">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {done.length > 0 && (
            <div>
              <h3 className="serif-heading text-lg text-muted-foreground mb-3">Completed ({done.length})</h3>
              <div className="space-y-2">
                {done.map((it) => (
                  <div key={it.id} className="elegant-card p-3.5 flex items-center gap-3 group opacity-70">
                    <button onClick={() => toggle(it)} className="w-5 h-5 rounded-md bg-primary border-2 border-primary text-primary-foreground flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3" />
                    </button>
                    <span className="flex-1 text-sm line-through text-muted-foreground">{it.title}</span>
                    <button onClick={() => remove(it.id)} className="p-1 rounded-lg opacity-100 sm:opacity-0 sm:group-hover:opacity-100 hover:bg-secondary text-muted-foreground hover:text-destructive transition-all">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <ReminderDialog open={dialog} onOpenChange={setDialog} wedding={wedding} onSaved={() => { setDialog(false); load(); }} />
    </div>
  );
}

function ReminderDialog({ open, onOpenChange, wedding, onSaved }) {
  const [title, setTitle] = useState('');
  const [due, setDue] = useState('');
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (open) { setTitle(''); setDue(''); } }, [open]);

  const save = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      await base44.entities.ReminderTask.create({ wedding_id: wedding.id, title: title.trim(), due_date: due || null, done: false });
      onSaved();
    } catch (e) { alert('Could not save: ' + (e.message || 'error')); }
    finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader><DialogTitle className="serif-heading text-2xl">Add reminder</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <div><Label htmlFor="t">Task</Label><Input id="t" placeholder="e.g. Finalize ceremony playlist" value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1.5" /></div>
          <div><Label htmlFor="d">Due date</Label><Input id="d" type="date" value={due} onChange={(e) => setDue(e.target.value)} className="mt-1.5" /></div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} disabled={saving || !title.trim()} className="bg-primary hover:bg-primary/90">{saving ? 'Saving…' : 'Add'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}