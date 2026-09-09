import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/PageHeader';
import FeatureGate from '@/components/FeatureGate';
import { hasFeature, formatDate } from '@/lib/wedding';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Trash2, Clock, Users, MapPin, Pencil, Utensils } from 'lucide-react';

export default function Rehearsal() {
  const { wedding, tier } = useOutletContext();
  const [dinner, setDinner] = useState(null);
  const [guests, setGuests] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editDetails, setEditDetails] = useState(false);
  const [guestDialog, setGuestDialog] = useState(false);
  const [tlDialog, setTlDialog] = useState(false);
  const [editingGuest, setEditingGuest] = useState(null);
  const [editingTl, setEditingTl] = useState(null);

  const load = async () => {
    if (!wedding) return;
    setLoading(true);
    try {
      const [d, g, t] = await Promise.all([
        base44.entities.RehearsalDinner.filter({ wedding_id: wedding.id }, '-created_date', 1),
        base44.entities.RehearsalGuest.filter({ wedding_id: wedding.id }, 'name', 200),
        base44.entities.RehearsalTimelineItem.filter({ wedding_id: wedding.id }, 'order', 200),
      ]);
      setDinner((d && d[0]) || null);
      setGuests(g || []);
      setTimeline((t || []).sort((a, b) => (a.time || '').localeCompare(b.time || '')));
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [wedding]);

  if (!wedding) return null;
  if (!hasFeature(tier, 'rehearsal')) return <FeatureGate tierLabel="Multiday" />;

  const rsvpStats = {
    yes: guests.filter((g) => g.rsvp_status === 'yes').length,
    no: guests.filter((g) => g.rsvp_status === 'no').length,
    pending: guests.filter((g) => g.rsvp_status === 'pending').length,
  };

  return (
    <div>
      <PageHeader eyebrow="The Night Before" title="Rehearsal Dinner"
        subtitle="Plan the rehearsal — venue, timeline, and guest list — all in one place."
      />

      {loading ? (
        <div className="text-center py-16 text-muted-foreground">Loading…</div>
      ) : (
        <div className="space-y-10">
          {/* Details */}
          <section className="elegant-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="serif-heading text-lg text-foreground flex items-center gap-2"><Utensils className="w-4 h-4 text-primary" /> Dinner details</h3>
              <Button variant="ghost" size="sm" onClick={() => setEditDetails(true)}><Pencil className="w-3.5 h-3.5 mr-1" /> Edit</Button>
            </div>
            {dinner ? (
              <div className="grid sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
                <Detail icon={MapPin} label="Venue" value={dinner.venue_name} />
                <Detail icon={MapPin} label="Location" value={dinner.venue_location} />
                <Detail icon={Clock} label="Date & time" value={dinner.date ? `${formatDate(dinner.date)}${dinner.time ? ' · ' + dinner.time : ''}` : ''} />
                {dinner.notes && <div className="sm:col-span-2 pt-3 border-t border-border/60"><p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Notes</p><p className="text-foreground whitespace-pre-wrap">{dinner.notes}</p></div>}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-sm text-muted-foreground mb-3">No details yet — add your venue, date, and notes.</p>
                <Button onClick={() => setEditDetails(true)} className="bg-primary hover:bg-primary/90"><Plus className="w-4 h-4 mr-1" /> Add details</Button>
              </div>
            )}
          </section>

          {/* Timeline */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="serif-heading text-lg text-foreground flex items-center gap-2"><Clock className="w-4 h-4 text-primary" /> Run of show</h3>
              <Button variant="outline" size="sm" onClick={() => { setEditingTl(null); setTlDialog(true); }}><Plus className="w-3.5 h-3.5 mr-1" /> Add item</Button>
            </div>
            {timeline.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8 elegant-card">No timeline items yet. Add arrivals, toasts, dinner, and any activities.</p>
            ) : (
              <div className="relative pl-8">
                <div className="absolute left-3 top-2 bottom-2 w-px bg-border" />
                <ul className="space-y-3">
                  {timeline.map((it) => (
                    <li key={it.id} className="relative group">
                      <div className="absolute -left-[22px] top-3 w-3 h-3 rounded-full bg-primary ring-4 ring-background" />
                      <div className="elegant-card p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2 text-sm"><Clock className="w-3.5 h-3.5 text-primary" /><span className="font-medium">{it.time}</span><span className="text-muted-foreground">· {it.duration_minutes} min</span></div>
                            <h4 className="serif-heading text-base text-foreground mt-0.5">{it.title}</h4>
                            {it.notes && <p className="text-sm text-muted-foreground mt-0.5">{it.notes}</p>}
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => { setEditingTl(it); setTlDialog(true); }} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground"><Pencil className="w-3.5 h-3.5" /></button>
                            <button onClick={() => base44.entities.RehearsalTimelineItem.delete(it.id).then(load)} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          {/* Guest list */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="serif-heading text-lg text-foreground flex items-center gap-2"><Users className="w-4 h-4 text-primary" /> Guest list</h3>
              <Button variant="outline" size="sm" onClick={() => { setEditingGuest(null); setGuestDialog(true); }}><Plus className="w-3.5 h-3.5 mr-1" /> Add guest</Button>
            </div>
            <div className="flex gap-3 mb-4 text-sm">
              <span className="text-emerald-600">{rsvpStats.yes} yes</span>
              <span className="text-rose-600">{rsvpStats.no} no</span>
              <span className="text-muted-foreground">{rsvpStats.pending} pending</span>
              <span className="text-muted-foreground/60">· {guests.length} total</span>
            </div>
            {guests.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8 elegant-card">No guests added yet.</p>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {guests.map((g) => (
                  <div key={g.id} className="elegant-card p-4 group">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium text-foreground truncate">{g.name}</p>
                        {g.contact && <p className="text-xs text-muted-foreground truncate">{g.contact}</p>}
                      </div>
                      <select value={g.rsvp_status} onChange={(e) => base44.entities.RehearsalGuest.update(g.id, { rsvp_status: e.target.value }).then(load)} className="text-xs h-7 rounded-md border border-input bg-background px-1.5">
                        <option value="pending">Pending</option>
                        <option value="yes">Yes</option>
                        <option value="no">No</option>
                      </select>
                    </div>
                    <div className="flex gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setEditingGuest(g); setGuestDialog(true); }} className="p-1 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground"><Pencil className="w-3 h-3" /></button>
                      <button onClick={() => base44.entities.RehearsalGuest.delete(g.id).then(load)} className="p-1 rounded-lg hover:bg-secondary text-muted-foreground hover:text-destructive"><Trash2 className="w-3 h-3" /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      <DetailsDialog open={editDetails} onOpenChange={setEditDetails} wedding={wedding} dinner={dinner} onSaved={load} />
      <GuestDialog open={guestDialog} onOpenChange={setGuestDialog} wedding={wedding} editing={editingGuest} onSaved={load} />
      <TimelineDialog open={tlDialog} onOpenChange={setTlDialog} wedding={wedding} editing={editingTl} onSaved={load} />
    </div>
  );
}

function Detail({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className="text-foreground">{value || '—'}</p>
      </div>
    </div>
  );
}

function DetailsDialog({ open, onOpenChange, wedding, dinner, onSaved }) {
  const [venue, setVenue] = useState('');
  const [loc, setLoc] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setVenue(dinner?.venue_name || ''); setLoc(dinner?.venue_location || '');
      setDate(dinner?.date || ''); setTime(dinner?.time || ''); setNotes(dinner?.notes || '');
    }
  }, [open, dinner]);

  const save = async () => {
    setSaving(true);
    try {
      const payload = { wedding_id: wedding.id, venue_name: venue.trim(), venue_location: loc.trim(), date: date || null, time, notes: notes.trim() };
      if (dinner) await base44.entities.RehearsalDinner.update(dinner.id, payload);
      else await base44.entities.RehearsalDinner.create(payload);
      onOpenChange(false); onSaved();
    } catch (e) { alert('Could not save: ' + (e.message || 'error')); }
    finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle className="serif-heading text-2xl">Dinner details</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <div><Label htmlFor="rv">Venue name</Label><Input id="rv" value={venue} onChange={(e) => setVenue(e.target.value)} className="mt-1.5" /></div>
          <div><Label htmlFor="rl">Location</Label><Input id="rl" placeholder="Address or area" value={loc} onChange={(e) => setLoc(e.target.value)} className="mt-1.5" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label htmlFor="rd">Date</Label><Input id="rd" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1.5" /></div>
            <div><Label htmlFor="rt">Time</Label><Input id="rt" type="time" value={time} onChange={(e) => setTime(e.target.value)} className="mt-1.5" /></div>
          </div>
          <div><Label htmlFor="rn">Notes</Label><Textarea id="rn" rows={3} placeholder="Menu, theme, host, any special plans…" value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1.5" /></div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} disabled={saving} className="bg-primary hover:bg-primary/90">{saving ? 'Saving…' : 'Save'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function GuestDialog({ open, onOpenChange, wedding, editing, onSaved }) {
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [rsvp, setRsvp] = useState('pending');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) { setName(editing?.name || ''); setContact(editing?.contact || ''); setRsvp(editing?.rsvp_status || 'pending'); }
  }, [open, editing]);

  const save = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const payload = { wedding_id: wedding.id, name: name.trim(), contact: contact.trim(), rsvp_status: rsvp };
      if (editing) await base44.entities.RehearsalGuest.update(editing.id, payload);
      else await base44.entities.RehearsalGuest.create(payload);
      onOpenChange(false); onSaved();
    } catch (e) { alert('Could not save: ' + (e.message || 'error')); }
    finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader><DialogTitle className="serif-heading text-2xl">{editing ? 'Edit guest' : 'Add guest'}</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <div><Label htmlFor="gn">Name</Label><Input id="gn" value={name} onChange={(e) => setName(e.target.value)} className="mt-1.5" /></div>
          <div><Label htmlFor="gc">Contact</Label><Input id="gc" placeholder="Email or phone" value={contact} onChange={(e) => setContact(e.target.value)} className="mt-1.5" /></div>
          <div>
            <Label htmlFor="gr">RSVP</Label>
            <select id="gr" value={rsvp} onChange={(e) => setRsvp(e.target.value)} className="mt-1.5 w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
              <option value="pending">Pending</option><option value="yes">Yes</option><option value="no">No</option>
            </select>
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

function TimelineDialog({ open, onOpenChange, wedding, editing, onSaved }) {
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState(30);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) { setTitle(editing?.title || ''); setTime(editing?.time || ''); setDuration(editing?.duration_minutes || 30); setNotes(editing?.notes || ''); }
  }, [open, editing]);

  const save = async () => {
    if (!title.trim() || !time) return;
    setSaving(true);
    try {
      const payload = { wedding_id: wedding.id, title: title.trim(), time, duration_minutes: Number(duration) || 30, notes: notes.trim(), order: Date.now() };
      if (editing) await base44.entities.RehearsalTimelineItem.update(editing.id, payload);
      else await base44.entities.RehearsalTimelineItem.create(payload);
      onOpenChange(false); onSaved();
    } catch (e) { alert('Could not save: ' + (e.message || 'error')); }
    finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle className="serif-heading text-2xl">{editing ? 'Edit item' : 'Add timeline item'}</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <div><Label htmlFor="tt">Title</Label><Input id="tt" placeholder="e.g. Arrivals, Toast, Dinner" value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1.5" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label htmlFor="ttime">Time</Label><Input id="ttime" type="time" value={time} onChange={(e) => setTime(e.target.value)} className="mt-1.5" /></div>
            <div><Label htmlFor="tdur">Duration (min)</Label><Input id="tdur" type="number" min="5" step="5" value={duration} onChange={(e) => setDuration(e.target.value)} className="mt-1.5" /></div>
          </div>
          <div><Label htmlFor="tn">Notes</Label><Textarea id="tn" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1.5" /></div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} disabled={saving || !title.trim() || !time} className="bg-primary hover:bg-primary/90">{saving ? 'Saving…' : 'Save'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}