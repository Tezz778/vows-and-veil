import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { MapPin, Clock, UtensilsCrossed, Plus, Pencil, Trash2 } from 'lucide-react';

const DEFAULT_MOMENTS = [
  { title: 'Rehearsal Walkthrough', start_time: '16:00', duration_minutes: 60, notes: 'Ceremony run-through at the venue' },
  { title: 'Cocktails & Arrival', start_time: '17:30', duration_minutes: 45, notes: '' },
  { title: 'Dinner', start_time: '18:30', duration_minutes: 90, notes: '' },
  { title: 'Toasts & Speeches', start_time: '20:00', duration_minutes: 45, notes: '' },
];

export default function RehearsalSchedule({ weddingId }) {
  const [rehearsal, setRehearsal] = useState(null);
  const [moments, setMoments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = async () => {
    if (!weddingId) return;
    setLoading(true);
    try {
      const list = await base44.entities.RehearsalDinner.filter({ wedding_id: weddingId }, '-created_date', 1);
      const r = list && list[0] ? list[0] : null;
      setRehearsal(r || { wedding_id: weddingId });
      const moms = await base44.entities.TimelineEvent.filter({ wedding_id: weddingId, day_number: 0 }, 'order', 100);
      setMoments(moms || []);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [weddingId]);

  const saveField = async (field, value) => {
    setSaving(true);
    try {
      if (rehearsal.id) {
        await base44.entities.RehearsalDinner.update(rehearsal.id, { [field]: value });
        setRehearsal((p) => ({ ...p, [field]: value }));
      } else {
        const created = await base44.entities.RehearsalDinner.create({ wedding_id: weddingId, [field]: value });
        setRehearsal(created);
      }
    } catch (e) { alert('Could not save: ' + (e.message || 'error')); }
    finally { setSaving(false); }
  };

  const seedDefaults = async () => {
    setSaving(true);
    try {
      const records = DEFAULT_MOMENTS.map((m, i) => ({
        wedding_id: weddingId, day_number: 0, day_label: 'Rehearsal Dinner',
        title: m.title, start_time: m.start_time, duration_minutes: m.duration_minutes,
        notes: m.notes, order: Date.now() + i,
      }));
      await base44.entities.TimelineEvent.bulkCreate(records);
      load();
    } catch (e) { alert('Could not add: ' + (e.message || 'error')); }
    finally { setSaving(false); }
  };

  const deleteMoment = async (m) => {
    await base44.entities.TimelineEvent.delete(m.id);
    setMoments((p) => p.filter((x) => x.id !== m.id));
  };

  if (loading) return <div className="text-center py-12 text-muted-foreground">Loading…</div>;

  const sortedMoments = [...moments].sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="elegant-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-4 h-4 text-primary" />
            <h3 className="serif-heading text-lg text-foreground">Venue</h3>
          </div>
          <div className="space-y-3">
            <div><Label htmlFor="vn">Venue name</Label><Input id="vn" value={rehearsal.venue_name || ''} placeholder="e.g. The Garden Pavilion"
              onChange={(e) => setRehearsal({ ...rehearsal, venue_name: e.target.value })}
              onBlur={(e) => saveField('venue_name', e.target.value)} className="mt-1.5" /></div>
            <div><Label htmlFor="vl">Location</Label><Input id="vl" value={rehearsal.venue_location || ''} placeholder="Address or area"
              onChange={(e) => setRehearsal({ ...rehearsal, venue_location: e.target.value })}
              onBlur={(e) => saveField('venue_location', e.target.value)} className="mt-1.5" /></div>
            <div><Label htmlFor="vd">Date</Label><Input id="vd" type="date" value={rehearsal.dinner_date || ''}
              onChange={(e) => setRehearsal({ ...rehearsal, dinner_date: e.target.value })}
              onBlur={(e) => saveField('dinner_date', e.target.value)} className="mt-1.5" /></div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label htmlFor="at">Start</Label><Input id="at" type="time" value={rehearsal.arrival_time || ''}
                onChange={(e) => setRehearsal({ ...rehearsal, arrival_time: e.target.value })}
                onBlur={(e) => saveField('arrival_time', e.target.value)} className="mt-1.5" /></div>
              <div><Label htmlFor="et">End</Label><Input id="et" type="time" value={rehearsal.end_time || ''}
                onChange={(e) => setRehearsal({ ...rehearsal, end_time: e.target.value })}
                onBlur={(e) => saveField('end_time', e.target.value)} className="mt-1.5" /></div>
              <div><Label htmlFor="gc">Guests</Label><Input id="gc" type="number" min="0" value={rehearsal.guest_count ?? 0}
                onChange={(e) => setRehearsal({ ...rehearsal, guest_count: Number(e.target.value) })}
                onBlur={(e) => saveField('guest_count', Number(e.target.value))} className="mt-1.5" /></div>
            </div>
          </div>
        </div>

        <div className="elegant-card p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              <h3 className="serif-heading text-lg text-foreground">Key moments</h3>
            </div>
            <Button size="sm" variant="ghost" onClick={() => { setEditing(null); setDialogOpen(true); }} className="text-primary">
              <Plus className="w-3.5 h-3.5 mr-1" /> Add
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mb-3">These automatically populate as the first day in your main timeline.</p>
          {sortedMoments.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm text-muted-foreground mb-3">No moments yet.</p>
              <Button size="sm" variant="outline" onClick={seedDefaults} disabled={saving}>Add typical schedule</Button>
            </div>
          ) : (
            <ul className="space-y-2">
              {sortedMoments.map((m) => (
                <li key={m.id} className="flex items-start justify-between gap-3 rounded-lg border border-border/60 p-3 group">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-3 h-3 text-primary" />
                      <span className="font-medium text-foreground">{m.start_time}</span>
                      <span className="text-muted-foreground">· {m.duration_minutes}m</span>
                    </div>
                    <p className="text-sm font-medium text-foreground mt-0.5">{m.title}</p>
                    {m.notes && <p className="text-xs text-muted-foreground mt-0.5">{m.notes}</p>}
                  </div>
                  <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { setEditing(m); setDialogOpen(true); }} className="p-1 rounded hover:bg-secondary text-muted-foreground"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={() => deleteMoment(m)} className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="elegant-card p-6 mb-2">
        <div className="flex items-center gap-2 mb-4">
          <UtensilsCrossed className="w-4 h-4 text-primary" />
          <h3 className="serif-heading text-lg text-foreground">Menu & notes</h3>
        </div>
        <div className="space-y-3">
          <div><Label htmlFor="mn">Menu notes</Label><Textarea id="mn" rows={2} placeholder="Courses, dietary notes, drinks…"
            value={rehearsal.menu_notes || ''}
            onChange={(e) => setRehearsal({ ...rehearsal, menu_notes: e.target.value })}
            onBlur={(e) => saveField('menu_notes', e.target.value)} className="mt-1.5" /></div>
          <div><Label htmlFor="nt">Other notes</Label><Textarea id="nt" rows={2} placeholder="Decor, logistics…"
            value={rehearsal.notes || ''}
            onChange={(e) => setRehearsal({ ...rehearsal, notes: e.target.value })}
            onBlur={(e) => saveField('notes', e.target.value)} className="mt-1.5" /></div>
        </div>
      </div>

      <MomentDialog open={dialogOpen} onOpenChange={setDialogOpen} weddingId={weddingId} editing={editing} onSaved={load} />
    </>
  );
}

function MomentDialog({ open, onOpenChange, weddingId, editing, onSaved }) {
  const [title, setTitle] = useState('');
  const [startTime, setStartTime] = useState('');
  const [duration, setDuration] = useState(30);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle(editing?.title || '');
      setStartTime(editing?.start_time || '');
      setDuration(editing?.duration_minutes || 30);
      setNotes(editing?.notes || '');
    }
  }, [open, editing]);

  const save = async () => {
    if (!title.trim() || !startTime) return;
    setSaving(true);
    try {
      const base = { wedding_id: weddingId, day_number: 0, day_label: 'Rehearsal Dinner',
        title: title.trim(), start_time: startTime, duration_minutes: Number(duration) || 30, notes: notes.trim() };
      if (editing) await base44.entities.TimelineEvent.update(editing.id, base);
      else await base44.entities.TimelineEvent.create({ ...base, order: Date.now() });
      onOpenChange(false);
      onSaved();
    } catch (e) { alert('Could not save: ' + (e.message || 'error')); }
    finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle className="serif-heading text-2xl">{editing ? 'Edit moment' : 'New moment'}</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <div><Label htmlFor="mt">Moment title</Label><Input id="mt" placeholder="e.g. Toasts" value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1.5" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label htmlFor="mst">Start time</Label><Input id="mst" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="mt-1.5" /></div>
            <div><Label htmlFor="md">Duration (min)</Label><Input id="md" type="number" min="5" step="5" value={duration} onChange={(e) => setDuration(e.target.value)} className="mt-1.5" /></div>
          </div>
          <div><Label htmlFor="mn2">Notes</Label><Textarea id="mn2" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1.5" /></div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} disabled={saving || !title.trim() || !startTime} className="bg-primary hover:bg-primary/90">{saving ? 'Saving…' : 'Save'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}