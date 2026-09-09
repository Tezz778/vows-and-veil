import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/PageHeader';
import FeatureGate from '@/components/FeatureGate';
import { hasFeature } from '@/lib/wedding';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import {
  Plus, Trash2, Users, Pencil, Plane, Home, Calendar, GripVertical, Mail
} from 'lucide-react';

const RSVP_COLORS = {
  pending: 'bg-secondary text-muted-foreground',
  yes: 'bg-emerald-100 text-emerald-700',
  no: 'bg-rose-100 text-rose-700',
};

export default function Guests() {
  const { wedding, tier } = useOutletContext();
  const [guests, setGuests] = useState([]);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [guestDialog, setGuestDialog] = useState(false);
  const [editingGuest, setEditingGuest] = useState(null);
  const [tableDialog, setTableDialog] = useState(false);

  const isDestination = hasFeature(tier, 'travel');

  const load = async () => {
    if (!wedding) return;
    setLoading(true);
    try {
      const [g, t] = await Promise.all([
        base44.entities.Guest.filter({ wedding_id: wedding.id }, 'name', 500),
        base44.entities.SeatingTable.filter({ wedding_id: wedding.id }, 'name', 100),
      ]);
      setGuests(g || []);
      setTables(t || []);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [wedding]);
  if (!wedding) return null;
  if (!hasFeature(tier, 'guests')) return <FeatureGate tierLabel="Multiday" />;

  const unseated = guests.filter((g) => !g.table_name);

  const onDragEnd = async (result) => {
    const { draggableId, destination } = result;
    if (!destination) return;
    const tableName = destination.droppableId === 'pool' ? '' : destination.droppableId;
    setGuests((prev) => prev.map((g) => (g.id === draggableId ? { ...g, table_name: tableName } : g)));
    try {
      await base44.entities.Guest.update(draggableId, { table_name: tableName });
    } catch { load(); }
  };

  const removeGuest = async (id) => {
    await base44.entities.Guest.delete(id);
    setGuests((prev) => prev.filter((g) => g.id !== id));
  };
  const removeTable = async (id) => {
    const t = tables.find((x) => x.id === id);
    if (!t) return;
    await base44.entities.SeatingTable.delete(id);
    setTables((prev) => prev.filter((x) => x.id !== id));
    setGuests((prev) => prev.map((g) => (g.table_name === t.name ? { ...g, table_name: '' } : g)));
    await base44.entities.Guest.updateMany({ wedding_id: wedding.id, table_name: t.name }, { $set: { table_name: '' } }).catch(() => {});
  };

  const rsvpStats = {
    yes: guests.filter((g) => g.rsvp_status === 'yes').length,
    no: guests.filter((g) => g.rsvp_status === 'no').length,
    pending: guests.filter((g) => g.rsvp_status === 'pending').length,
  };

  const mealCounts = Object.entries(
    guests.reduce((acc, g) => {
      if (g.rsvp_status === 'yes' && g.meal_choice) {
        acc[g.meal_choice] = (acc[g.meal_choice] || 0) + 1;
      }
      return acc;
    }, {})
  ).map(([choice, count]) => ({ choice, count }));

  const invStats = {
    not_sent: guests.filter((g) => (g.invitation_status || 'not_sent') === 'not_sent').length,
    save_the_date: guests.filter((g) => g.invitation_status === 'save_the_date').length,
    invite_sent: guests.filter((g) => g.invitation_status === 'invite_sent').length,
    rsvp_received: guests.filter((g) => g.invitation_status === 'rsvp_received').length,
  };

  const markAllSaveTheDate = async () => {
    const today = new Date().toISOString().slice(0, 10);
    const updates = guests
      .filter((g) => (g.invitation_status || 'not_sent') === 'not_sent')
      .map((g) => ({ id: g.id, invitation_status: 'save_the_date', invite_sent_date: today }));
    if (!updates.length) return;
    try {
      await base44.entities.Guest.bulkUpdate(updates);
      load();
    } catch {}
  };

  return (
    <div>
      <PageHeader eyebrow="Your people" title="Guests & Seating"
        subtitle="Manage your guest list and arrange tables with drag-and-drop."
      >
        <Button variant="outline" onClick={() => { setEditingGuest(null); setGuestDialog(true); }}>
          <Plus className="w-4 h-4 mr-1" /> Add guest
        </Button>
        <Button variant="outline" onClick={() => setTableDialog(true)}>
          <Plus className="w-4 h-4 mr-1" /> Add table
        </Button>
      </PageHeader>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <Stat label="Total guests" value={guests.length} />
        <Stat label="Confirmed" value={rsvpStats.yes} tone="emerald" />
        <Stat label="Declined" value={rsvpStats.no} tone="rose" />
        <Stat label="Pending" value={rsvpStats.pending} />
      </div>

      {/* Meal tracker */}
      {mealCounts.length > 0 && (
        <div className="elegant-card p-5 mb-8">
          <h3 className="serif-heading text-lg text-foreground mb-4">Meal choices</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {mealCounts.map(({ choice, count }) => (
              <div key={choice} className="rounded-xl border border-border/70 bg-secondary/30 p-3 text-center">
                <p className="serif-heading text-2xl text-foreground">{count}</p>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider mt-0.5">{choice}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invitation tracker */}
      <div className="elegant-card p-5 mb-8">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h3 className="serif-heading text-lg text-foreground">Invitations</h3>
          {invStats.not_sent > 0 && (
            <Button variant="outline" size="sm" onClick={markAllSaveTheDate}>
              <Mail className="w-3.5 h-3.5 mr-1.5" /> Mark all save-the-dates sent
            </Button>
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <InvStat label="Not sent" value={invStats.not_sent} tone="muted" />
          <InvStat label="Save-the-date" value={invStats.save_the_date} tone="amber" />
          <InvStat label="Invite sent" value={invStats.invite_sent} tone="blue" />
          <InvStat label="RSVP received" value={invStats.rsvp_received} tone="emerald" />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-muted-foreground">Loading…</div>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Unseated pool */}
            <div className="lg:col-span-1">
              <h3 className="serif-heading text-lg text-foreground mb-3 flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" /> Unseated ({unseated.length})
              </h3>
              <Droppable droppableId="pool">
                {(provided) => (
                  <div ref={provided.innerRef} {...provided.droppableProps}
                    className="elegant-card p-3 min-h-[200px] space-y-2 bg-secondary/40">
                    {unseated.length === 0 && (
                      <p className="text-center text-sm text-muted-foreground py-8">All guests are seated.</p>
                    )}
                    {unseated.map((g, i) => (
                      <Draggable key={g.id} draggableId={g.id} index={i}>
                        {(p) => (
                          <div ref={p.innerRef} {...p.draggableProps} {...p.dragHandleProps}
                            className="bg-card border border-border rounded-lg p-2.5 flex items-center gap-2 text-sm">
                            <GripVertical className="w-3.5 h-3.5 text-muted-foreground/40" />
                            <span className="flex-1 truncate font-medium">{g.name}</span>
                            {g.meal_choice && <span className="text-[10px] text-muted-foreground hidden sm:inline truncate max-w-[80px]">{g.meal_choice}</span>}
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${RSVP_COLORS[g.rsvp_status]}`}>{g.rsvp_status}</span>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>

              {isDestination && (
                <div className="mt-6">
                  <h3 className="serif-heading text-lg text-foreground mb-3 flex items-center gap-2">
                    <Plane className="w-4 h-4 text-primary" /> Travel & Stays
                  </h3>
                  <div className="space-y-2">
                    {guests.filter((g) => g.travel_needed).length === 0 ? (
                      <p className="text-sm text-muted-foreground elegant-card p-4">Mark guests as "travel needed" in their details to track arrivals and stays.</p>
                    ) : guests.filter((g) => g.travel_needed).map((g) => (
                      <div key={g.id} className="elegant-card p-3 text-sm">
                        <p className="font-medium text-foreground">{g.name}</p>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-muted-foreground">
                          {g.arrival_date && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Arrives {g.arrival_date}</span>}
                          {g.departure_date && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Departs {g.departure_date}</span>}
                          {g.accommodation && <span className="flex items-center gap-1"><Home className="w-3 h-3" /> {g.accommodation}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Tables */}
            <div className="lg:col-span-2">
              <h3 className="serif-heading text-lg text-foreground mb-3">Tables</h3>
              {tables.length === 0 ? (
                <div className="elegant-card p-10 text-center">
                  <Users className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No tables yet. Add one to start seating guests.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {tables.map((t) => {
                    const seated = guests.filter((g) => g.table_name === t.name);
                    return (
                      <Droppable key={t.id} droppableId={t.name}>
                        {(provided) => (
                          <div ref={provided.innerRef} {...provided.droppableProps}
                            className="elegant-card p-4 min-h-[160px]">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <p className="serif-heading text-base text-foreground">{t.name}</p>
                                <p className="text-xs text-muted-foreground">{seated.length}/{t.capacity} seated</p>
                              </div>
                              <button onClick={() => removeTable(t.id)} className="p-1 rounded-lg hover:bg-secondary text-muted-foreground hover:text-destructive">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <div className="space-y-1.5">
                              {seated.map((g, i) => (
                                <Draggable key={g.id} draggableId={g.id} index={i}>
                                  {(p) => (
                                    <div ref={p.innerRef} {...p.draggableProps} {...p.dragHandleProps}
                                      className="bg-secondary/60 rounded-lg p-2 flex items-center gap-2 text-sm group">
                                      <GripVertical className="w-3.5 h-3.5 text-muted-foreground/40" />
                                      <span className="flex-1 truncate">{g.name}</span>
                                      <button onClick={() => removeGuest(g.id)} className="opacity-0 group-hover:opacity-100 p-0.5 text-muted-foreground hover:text-destructive">
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>
                                  )}
                                </Draggable>
                              ))}
                              {seated.length === 0 && <p className="text-xs text-muted-foreground/60 text-center py-3">Drag guests here</p>}
                              {provided.placeholder}
                            </div>
                          </div>
                        )}
                      </Droppable>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </DragDropContext>
      )}

      <GuestDialog open={guestDialog} onOpenChange={setGuestDialog} wedding={wedding}
        editing={editingGuest} isDestination={isDestination} onSaved={() => { setGuestDialog(false); load(); }} />
      <TableDialog open={tableDialog} onOpenChange={setTableDialog} wedding={wedding}
        onSaved={() => { setTableDialog(false); load(); }} />
    </div>
  );
}

function Stat({ label, value, tone }) {
  return (
    <div className="elegant-card p-4">
      <p className={`serif-heading text-2xl ${tone === 'emerald' ? 'text-emerald-600' : tone === 'rose' ? 'text-rose-600' : 'text-foreground'}`}>{value}</p>
      <p className="text-xs text-muted-foreground uppercase tracking-wider mt-0.5">{label}</p>
    </div>
  );
}

const INV_TONES = {
  muted: 'text-muted-foreground',
  amber: 'text-amber-600',
  blue: 'text-sky-600',
  emerald: 'text-emerald-600',
};

function InvStat({ label, value, tone }) {
  return (
    <div className="rounded-xl border border-border/70 bg-secondary/30 p-3 text-center">
      <p className={`serif-heading text-2xl ${INV_TONES[tone] || 'text-foreground'}`}>{value}</p>
      <p className="text-[11px] text-muted-foreground uppercase tracking-wider mt-0.5">{label}</p>
    </div>
  );
}

function GuestDialog({ open, onOpenChange, wedding, editing, isDestination, onSaved }) {
  const [name, setName] = useState('');
  const [rsvp, setRsvp] = useState('pending');
  const [contact, setContact] = useState('');
  const [plus, setPlus] = useState(0);
  const [travel, setTravel] = useState(false);
  const [arrival, setArrival] = useState('');
  const [departure, setDeparture] = useState('');
  const [accom, setAccom] = useState('');
  const [meal, setMeal] = useState('');
  const [invStatus, setInvStatus] = useState('not_sent');
  const [invMethod, setInvMethod] = useState('digital');
  const [invDate, setInvDate] = useState('');
  const [followUp, setFollowUp] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName(editing?.name || ''); setRsvp(editing?.rsvp_status || 'pending');
      setContact(editing?.contact || ''); setPlus(editing?.plus_ones || 0);
      setTravel(editing?.travel_needed || false); setArrival(editing?.arrival_date || '');
      setDeparture(editing?.departure_date || '');
      setAccom(editing?.accommodation || '');
      setMeal(editing?.meal_choice || '');
      setInvStatus(editing?.invitation_status || 'not_sent');
      setInvMethod(editing?.invite_method || 'digital');
      setInvDate(editing?.invite_sent_date || '');
      setFollowUp(editing?.follow_up_sent || false);
    }
  }, [open, editing]);

  const save = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const payload = {
        wedding_id: wedding.id, name: name.trim(), rsvp_status: rsvp, contact: contact.trim(),
        plus_ones: Number(plus) || 0, travel_needed: travel, arrival_date: arrival || null, departure_date: departure || null, accommodation: accom.trim(),
        meal_choice: meal.trim(), invitation_status: invStatus, invite_method: invMethod,
        invite_sent_date: invDate || null, follow_up_sent: followUp,
      };
      if (editing) await base44.entities.Guest.update(editing.id, payload);
      else await base44.entities.Guest.create(payload);
      onSaved();
    } catch (e) { alert('Could not save: ' + (e.message || 'error')); }
    finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle className="serif-heading text-2xl">{editing ? 'Edit guest' : 'Add guest'}</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <div><Label htmlFor="gn">Name</Label><Input id="gn" value={name} onChange={(e) => setName(e.target.value)} className="mt-1.5" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="rsvp">RSVP</Label>
              <select id="rsvp" value={rsvp} onChange={(e) => setRsvp(e.target.value)}
                className="mt-1.5 w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
                <option value="pending">Pending</option><option value="yes">Yes</option><option value="no">No</option>
              </select>
            </div>
            <div><Label htmlFor="po">Plus ones</Label><Input id="po" type="number" min="0" value={plus} onChange={(e) => setPlus(e.target.value)} className="mt-1.5" /></div>
          </div>
          <div><Label htmlFor="ct">Contact</Label><Input id="ct" placeholder="Email or phone" value={contact} onChange={(e) => setContact(e.target.value)} className="mt-1.5" /></div>
          <div>
            <Label htmlFor="gm">Meal choice</Label>
            <Input id="gm" placeholder="e.g. Chicken, Vegetarian…" value={meal} onChange={(e) => setMeal(e.target.value)} className="mt-1.5" />
          </div>

          {/* Invitation tracker */}
          <div className="rounded-xl border border-border p-3 space-y-3 bg-secondary/30">
            <p className="text-xs font-medium text-foreground uppercase tracking-wider">Invitation</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="ist">Status</Label>
                <select id="ist" value={invStatus} onChange={(e) => setInvStatus(e.target.value)}
                  className="mt-1.5 w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
                  <option value="not_sent">Not sent</option>
                  <option value="save_the_date">Save-the-date sent</option>
                  <option value="invite_sent">Invite sent</option>
                  <option value="rsvp_received">RSVP received</option>
                </select>
              </div>
              <div>
                <Label htmlFor="im">Method</Label>
                <select id="im" value={invMethod} onChange={(e) => setInvMethod(e.target.value)}
                  className="mt-1.5 w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
                  <option value="digital">Digital</option>
                  <option value="mail">Mailed</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><Label htmlFor="idate">Sent date</Label><Input id="idate" type="date" value={invDate} onChange={(e) => setInvDate(e.target.value)} className="mt-1.5" /></div>
              <label className="flex items-center gap-2 text-sm cursor-pointer self-end pb-2.5">
                <input type="checkbox" checked={followUp} onChange={(e) => setFollowUp(e.target.checked)} className="w-4 h-4 accent-[hsl(var(--primary))]" />
                Follow-up sent
              </label>
            </div>
          </div>

          {isDestination && (
            <div className="rounded-xl border border-border p-3 space-y-3 bg-secondary/30">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={travel} onChange={(e) => setTravel(e.target.checked)} className="w-4 h-4 accent-[hsl(var(--primary))]" />
                Traveling / needs accommodation
              </label>
              {travel && (
                <div className="grid grid-cols-2 gap-3">
                  <div><Label htmlFor="ar">Arrival</Label><Input id="ar" type="date" value={arrival} onChange={(e) => setArrival(e.target.value)} className="mt-1.5" /></div>
                  <div><Label htmlFor="dp">Departure</Label><Input id="dp" type="date" value={departure} onChange={(e) => setDeparture(e.target.value)} className="mt-1.5" /></div>
                  <div className="col-span-2"><Label htmlFor="ac">Accommodation</Label><Input id="ac" placeholder="Hotel / address" value={accom} onChange={(e) => setAccom(e.target.value)} className="mt-1.5" /></div>
                </div>
              )}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} disabled={saving || !name.trim()} className="bg-primary hover:bg-primary/90">{saving ? 'Saving…' : 'Save'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TableDialog({ open, onOpenChange, wedding, onSaved }) {
  const [name, setName] = useState('');
  const [cap, setCap] = useState(8);
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (open) { setName(''); setCap(8); } }, [open]);

  const save = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await base44.entities.SeatingTable.create({ wedding_id: wedding.id, name: name.trim(), capacity: Number(cap) || 8 });
      onSaved();
    } catch (e) { alert('Could not save: ' + (e.message || 'error')); }
    finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader><DialogTitle className="serif-heading text-2xl">Add table</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <div><Label htmlFor="tn">Table name</Label><Input id="tn" placeholder="e.g. Table 1 — Rose" value={name} onChange={(e) => setName(e.target.value)} className="mt-1.5" /></div>
          <div><Label htmlFor="tc">Capacity</Label><Input id="tc" type="number" min="1" value={cap} onChange={(e) => setCap(e.target.value)} className="mt-1.5" /></div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} disabled={saving || !name.trim()} className="bg-primary hover:bg-primary/90">{saving ? 'Saving…' : 'Add table'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}