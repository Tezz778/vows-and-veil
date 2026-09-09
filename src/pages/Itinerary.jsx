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
import { Plus, Trash2, Pencil, MapPin, Clock } from 'lucide-react';

export default function Itinerary() {
  const { wedding, tier } = useOutletContext();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = async () => {
    if (!wedding) return;
    setLoading(true);
    try {
      const list = await base44.entities.ItineraryItem.filter({ wedding_id: wedding.id }, 'order', 100);
      setItems(list || []);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [wedding]);

  if (!wedding) return null;
  if (!hasFeature(tier, 'itinerary')) return <FeatureGate tierLabel="Destination" />;

  const days = Array.from(new Set(items.map((i) => i.day_label || 'Day 1').filter(Boolean)));
  const grouped = days.map((d) => ({
    day: d,
    date: items.find((i) => (i.day_label || 'Day 1') === d)?.date || '',
    entries: items
      .filter((i) => (i.day_label || 'Day 1') === d)
      .sort((a, b) => (a.time || '').localeCompare(b.time || '')),
  }));

  const openAdd = () => { setEditing(null); setDialogOpen(true); };
  const openEdit = (it) => { setEditing(it); setDialogOpen(true); };

  return (
    <div>
      <PageHeader eyebrow="The Weekend" title="Weekend Itinerary"
        subtitle="Build the guest-facing schedule for your destination weekend — welcome drinks, ceremony, reception, and the morning-after brunch."
      >
        <Button onClick={openAdd} className="bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-1" /> Add event
        </Button>
      </PageHeader>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
        <div className="elegant-card p-4"><p className="serif-heading text-2xl text-foreground">{items.length}</p><p className="text-xs text-muted-foreground uppercase tracking-wider mt-0.5">Events</p></div>
        <div className="elegant-card p-4"><p className="serif-heading text-2xl text-foreground">{days.length}</p><p className="text-xs text-muted-foreground uppercase tracking-wider mt-0.5">Days</p></div>
        <div className="elegant-card p-4"><p className="serif-heading text-2xl text-foreground">{items.filter((i) => i.location).length}</p><p className="text-xs text-muted-foreground uppercase tracking-wider mt-0.5">With venue</p></div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-muted-foreground">Loading itinerary…</div>
      ) : items.length === 0 ? (
        <div className="elegant-card p-12 text-center">
          <MapPin className="w-10 h-10 text-muted-foreground/30 mx-auto mb-4" />
          <p className="serif-heading text-xl text-foreground">No events yet</p>
          <p className="text-sm text-muted-foreground mt-1 mb-5">Sketch out the full weekend so guests know where to be and when.</p>
          <Button onClick={openAdd} className="bg-primary hover:bg-primary/90"><Plus className="w-4 h-4 mr-1" /> Add the first event</Button>
        </div>
      ) : (
        <div className="space-y-8">
          {grouped.map((g) => (
            <div key={g.day}>
              <div className="flex items-baseline gap-3 mb-3">
                <h3 className="serif-heading text-xl text-primary">{g.day}</h3>
                {g.date && <span className="text-xs text-muted-foreground">{new Date(g.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>}
              </div>
              <div className="relative pl-6 space-y-3">
                <div className="absolute left-2 top-1 bottom-1 w-px bg-border" />
                {g.entries.map((it) => (
                  <div key={it.id} className="elegant-card p-5 group relative">
                    <div className="absolute -left-[18px] top-6 w-3 h-3 rounded-full bg-primary ring-4 ring-background" />
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground uppercase tracking-wider">{it.time || 'TBD'}</span>
                        </div>
                        <h4 className="serif-heading text-lg text-foreground">{it.title}</h4>
                        {it.location && <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5"><MapPin className="w-3.5 h-3.5" /> {it.location}</p>}
                        {it.description && <p className="text-sm text-muted-foreground mt-2">{it.description}</p>}
                        {it.dress_code && <p className="text-xs text-muted-foreground mt-2"><span className="uppercase tracking-wider">Dress:</span> {it.dress_code}</p>}
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEdit(it)} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground"><Pencil className="w-3.5 h-3.5" /></button>
                        <button onClick={() => base44.entities.ItineraryItem.delete(it.id).then(load)} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <ItineraryDialog open={dialogOpen} onOpenChange={setDialogOpen} wedding={wedding} editing={editing} onSaved={load} />
    </div>
  );
}

function ItineraryDialog({ open, onOpenChange, wedding, editing, onSaved }) {
  const [dayLabel, setDayLabel] = useState('Day 1');
  const [date, setDate] = useState('');
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [dress, setDress] = useState('');
  const [order, setOrder] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setDayLabel(editing?.day_label || 'Day 1');
      setDate(editing?.date || (wedding?.wedding_date || ''));
      setTitle(editing?.title || '');
      setTime(editing?.time || '');
      setLocation(editing?.location || '');
      setDescription(editing?.description || '');
      setDress(editing?.dress_code || '');
      setOrder(editing?.order ?? 0);
    }
  }, [open, editing, wedding]);

  const save = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      const payload = {
        wedding_id: wedding.id, day_label: dayLabel.trim() || 'Day 1',
        date: date || null, title: title.trim(), time: time.trim(),
        location: location.trim(), description: description.trim(),
        dress_code: dress.trim(), order: Number(order) || 0,
      };
      if (editing) await base44.entities.ItineraryItem.update(editing.id, payload);
      else await base44.entities.ItineraryItem.create(payload);
      onOpenChange(false); onSaved();
    } catch (e) { alert('Could not save: ' + (e.message || 'error')); }
    finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle className="serif-heading text-2xl">{editing ? 'Edit event' : 'Add event'}</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2 max-h-[70vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-3">
            <div><Label htmlFor="dl">Day label</Label><Input id="dl" placeholder="e.g. Friday, Welcome Night" value={dayLabel} onChange={(e) => setDayLabel(e.target.value)} className="mt-1.5" /></div>
            <div><Label htmlFor="dt">Date</Label><Input id="dt" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1.5" /></div>
          </div>
          <div><Label htmlFor="ti">Event title</Label><Input id="ti" placeholder="e.g. Welcome Drinks" value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1.5" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label htmlFor="tm">Time</Label><Input id="tm" placeholder="e.g. 6:00 PM" value={time} onChange={(e) => setTime(e.target.value)} className="mt-1.5" /></div>
            <div><Label htmlFor="lo">Location</Label><Input id="lo" placeholder="Venue / address" value={location} onChange={(e) => setLocation(e.target.value)} className="mt-1.5" /></div>
          </div>
          <div><Label htmlFor="ds">Description</Label><Textarea id="ds" rows={2} placeholder="What guests should expect" value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1.5" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label htmlFor="dr">Dress code</Label><Input id="dr" placeholder="e.g. Resort casual" value={dress} onChange={(e) => setDress(e.target.value)} className="mt-1.5" /></div>
            <div><Label htmlFor="od">Order</Label><Input id="od" type="number" value={order} onChange={(e) => setOrder(e.target.value)} className="mt-1.5" /></div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} disabled={saving || !title.trim()} className="bg-primary hover:bg-primary/90">{saving ? 'Saving…' : 'Save event'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}