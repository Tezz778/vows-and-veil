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
import { Plus, Trash2, Pencil, Plane, Hotel, MapPin } from 'lucide-react';

export default function Travel() {
  const { wedding, tier } = useOutletContext();
  const [accs, setAccs] = useState([]);
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = async () => {
    if (!wedding) return;
    setLoading(true);
    try {
      const [a, g] = await Promise.all([
        base44.entities.Accommodation.filter({ wedding_id: wedding.id }),
        base44.entities.Guest.filter({ wedding_id: wedding.id }),
      ]);
      setAccs(a || []);
      setGuests(g || []);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [wedding]);

  if (!wedding) return null;
  if (!hasFeature(tier, 'travel')) return <FeatureGate tierLabel="Destination" />;

  const roomsReserved = accs.reduce((s, a) => s + (Number(a.rooms_reserved) || 0), 0);
  const needTravel = guests.filter((g) => g.travel_needed);
  const withAccommodation = guests.filter((g) => g.accommodation);

  const openAdd = () => { setEditing(null); setDialogOpen(true); };
  const openEdit = (a) => { setEditing(a); setDialogOpen(true); };

  return (
    <div>
      <PageHeader eyebrow="Getting There" title="Guest Travel & Stays"
        subtitle="Coordinate room blocks, track who needs travel help, and keep arrivals and accommodations organized for your destination celebration."
      >
        <Button onClick={openAdd} className="bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-1" /> Add accommodation
        </Button>
      </PageHeader>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="elegant-card p-4"><p className="serif-heading text-2xl text-foreground">{accs.length}</p><p className="text-xs text-muted-foreground uppercase tracking-wider mt-0.5">Room blocks</p></div>
        <div className="elegant-card p-4"><p className="serif-heading text-2xl text-foreground">{roomsReserved}</p><p className="text-xs text-muted-foreground uppercase tracking-wider mt-0.5">Rooms held</p></div>
        <div className="elegant-card p-4"><p className="serif-heading text-2xl text-primary">{needTravel.length}</p><p className="text-xs text-muted-foreground uppercase tracking-wider mt-0.5">Need travel</p></div>
        <div className="elegant-card p-4"><p className="serif-heading text-2xl text-emerald-600">{withAccommodation.length}</p><p className="text-xs text-muted-foreground uppercase tracking-wider mt-0.5">Housed</p></div>
      </div>

      {/* Accommodations */}
      <section className="mb-10">
        <h2 className="serif-heading text-xl text-foreground mb-4">Accommodations & room blocks</h2>
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading accommodations…</div>
        ) : accs.length === 0 ? (
          <div className="elegant-card p-12 text-center">
            <Hotel className="w-10 h-10 text-muted-foreground/30 mx-auto mb-4" />
            <p className="serif-heading text-xl text-foreground">No accommodations yet</p>
            <p className="text-sm text-muted-foreground mt-1 mb-5">Add hotel room blocks so guests know where to book before the cutoff.</p>
            <Button onClick={openAdd} className="bg-primary hover:bg-primary/90"><Plus className="w-4 h-4 mr-1" /> Add a room block</Button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {accs.map((a) => (
              <div key={a.id} className="elegant-card p-5 group">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h4 className="serif-heading text-lg text-foreground">{a.name}</h4>
                    {a.location && <p className="text-sm text-muted-foreground flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {a.location}</p>}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(a)} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={() => base44.entities.Accommodation.delete(a.id).then(load)} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
                  <div><p className="text-xs text-muted-foreground uppercase tracking-wider">Rooms held</p><p className="text-foreground font-medium">{Number(a.rooms_reserved) || 0}</p></div>
                  <div><p className="text-xs text-muted-foreground uppercase tracking-wider">Nightly rate</p><p className="text-foreground font-medium">${Number(a.room_rate || 0).toLocaleString()}</p></div>
                  {a.block_name && <div><p className="text-xs text-muted-foreground uppercase tracking-wider">Block name</p><p className="text-foreground font-medium">{a.block_name}</p></div>}
                  {a.cutoff_date && <div><p className="text-xs text-muted-foreground uppercase tracking-wider">Book by</p><p className="text-foreground font-medium">{formatDate(a.cutoff_date)}</p></div>}
                </div>
                {a.notes && <p className="text-sm text-muted-foreground mt-3 pt-3 border-t border-border/60">{a.notes}</p>}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Guest travel summary */}
      <section>
        <h2 className="serif-heading text-xl text-foreground mb-4">Guest travel overview</h2>
        <div className="elegant-card overflow-hidden">
          {guests.length === 0 ? (
            <div className="p-10 text-center">
              <Plane className="w-9 h-9 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Add guests first to track their travel and stays here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-accent/40">
                    <th className="text-left font-medium text-muted-foreground px-5 py-3">Guest</th>
                    <th className="text-left font-medium text-muted-foreground px-5 py-3">Needs travel</th>
                    <th className="text-left font-medium text-muted-foreground px-5 py-3">Arrival</th>
                    <th className="text-left font-medium text-muted-foreground px-5 py-3">Accommodation</th>
                  </tr>
                </thead>
                <tbody>
                  {guests.map((g) => (
                    <tr key={g.id} className="border-b border-border/50 last:border-0">
                      <td className="px-5 py-3 font-medium text-foreground">{g.name}</td>
                      <td className="px-5 py-3">
                        {g.travel_needed
                          ? <span className="text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary">Yes</span>
                          : <span className="text-[11px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">Local</span>}
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">{g.arrival_date ? formatDate(g.arrival_date) : '—'}</td>
                      <td className="px-5 py-3 text-muted-foreground">{g.accommodation || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      <AccommodationDialog open={dialogOpen} onOpenChange={setDialogOpen} wedding={wedding} editing={editing} onSaved={load} />
    </div>
  );
}

function AccommodationDialog({ open, onOpenChange, wedding, editing, onSaved }) {
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [roomRate, setRoomRate] = useState(0);
  const [blockName, setBlockName] = useState('');
  const [rooms, setRooms] = useState(0);
  const [cutoff, setCutoff] = useState('');
  const [contact, setContact] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName(editing?.name || ''); setLocation(editing?.location || '');
      setRoomRate(editing?.room_rate || 0); setBlockName(editing?.block_name || '');
      setRooms(editing?.rooms_reserved || 0); setCutoff(editing?.cutoff_date || '');
      setContact(editing?.contact_info || ''); setNotes(editing?.notes || '');
    }
  }, [open, editing]);

  const save = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const payload = {
        wedding_id: wedding.id, name: name.trim(), location: location.trim(),
        room_rate: Number(roomRate) || 0, block_name: blockName.trim(),
        rooms_reserved: Number(rooms) || 0, cutoff_date: cutoff || null,
        contact_info: contact.trim(), notes: notes.trim(),
      };
      if (editing) await base44.entities.Accommodation.update(editing.id, payload);
      else await base44.entities.Accommodation.create(payload);
      onOpenChange(false); onSaved();
    } catch (e) { alert('Could not save: ' + (e.message || 'error')); }
    finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle className="serif-heading text-2xl">{editing ? 'Edit accommodation' : 'Add accommodation'}</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2 max-h-[70vh] overflow-y-auto pr-1">
          <div><Label htmlFor="an">Hotel / property name</Label><Input id="an" value={name} onChange={(e) => setName(e.target.value)} className="mt-1.5" /></div>
          <div><Label htmlFor="al">Location</Label><Input id="al" placeholder="City, area, or address" value={location} onChange={(e) => setLocation(e.target.value)} className="mt-1.5" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label htmlFor="bn">Block name</Label><Input id="bn" placeholder="e.g. Smith Wedding Block" value={blockName} onChange={(e) => setBlockName(e.target.value)} className="mt-1.5" /></div>
            <div><Label htmlFor="cd">Book-by date</Label><Input id="cd" type="date" value={cutoff} onChange={(e) => setCutoff(e.target.value)} className="mt-1.5" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label htmlFor="rr">Nightly rate ($)</Label><Input id="rr" type="number" min="0" value={roomRate} onChange={(e) => setRoomRate(e.target.value)} className="mt-1.5" /></div>
            <div><Label htmlFor="rm">Rooms held</Label><Input id="rm" type="number" min="0" value={rooms} onChange={(e) => setRooms(e.target.value)} className="mt-1.5" /></div>
          </div>
          <div><Label htmlFor="ci">Contact info</Label><Input id="ci" placeholder="Booking phone / email" value={contact} onChange={(e) => setContact(e.target.value)} className="mt-1.5" /></div>
          <div><Label htmlFor="nt">Notes</Label><Textarea id="nt" rows={2} placeholder="Shuttle info, code, what's included…" value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1.5" /></div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} disabled={saving || !name.trim()} className="bg-primary hover:bg-primary/90">{saving ? 'Saving…' : 'Save accommodation'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}