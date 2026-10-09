import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { DragDropContext, Droppable } from '@hello-pangea/dnd';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/PageHeader';
import FeatureGate from '@/components/FeatureGate';
import { hasFeature } from '@/lib/wedding';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Armchair, RefreshCw } from 'lucide-react';
import GuestChip from '@/components/seating/GuestChip';
import TableCard from '@/components/seating/TableCard';

export default function SeatingChart() {
  const { wedding, tier } = useOutletContext();
  const [tables, setTables] = useState([]);
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [tName, setTName] = useState('');
  const [tCapacity, setTCapacity] = useState(8);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!wedding) return;
    setLoading(true);
    try {
      const [t, g] = await Promise.all([
        base44.entities.SeatingTable.filter({ wedding_id: wedding.id }, 'name', 100),
        base44.entities.Guest.filter({ wedding_id: wedding.id }, 'name', 500),
      ]);
      setTables(t || []);
      setGuests(g || []);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [wedding]);

  if (!hasFeature(tier, 'guests')) return <FeatureGate feature="guests" tierLabel="Multiday" />;
  if (!wedding) return null;

  const unassigned = guests.filter((g) => !g.table_name);
  const guestsAt = (tableId) => {
    const table = tables.find((t) => t.id === tableId);
    if (!table) return [];
    return guests.filter((g) => g.table_name === table.name);
  };

  const handleDragEnd = async (result) => {
    const { destination, draggableId } = result;
    if (!destination) return;
    const destId = destination.droppableId;
    let newTableName = null;
    if (destId !== 'unassigned') {
      const table = tables.find((t) => t.id === destId);
      if (!table) return;
      newTableName = table.name;
      const current = guests.filter((g) => g.table_name === table.name);
      const moving = guests.find((g) => g.id === draggableId);
      if (moving?.table_name !== table.name && current.length >= (table.capacity || 8)) return;
    }
    setGuests((prev) => prev.map((g) => (g.id === draggableId ? { ...g, table_name: newTableName } : g)));
    try {
      await base44.entities.Guest.update(draggableId, { table_name: newTableName });
    } catch { load(); }
  };

  const addTable = async () => {
    if (!tName.trim()) return;
    setSaving(true);
    try {
      await base44.entities.SeatingTable.create({
        wedding_id: wedding.id,
        name: tName.trim(),
        capacity: Number(tCapacity) || 8,
      });
      setDialogOpen(false);
      setTName('');
      setTCapacity(8);
      load();
    } catch (e) {
      alert('Could not save: ' + (e.message || 'error'));
    } finally { setSaving(false); }
  };

  const deleteTable = async (table) => {
    const tableGuests = guests.filter((g) => g.table_name === table.name);
    await Promise.all(
      tableGuests.map((g) => base44.entities.Guest.update(g.id, { table_name: null }))
    );
    await base44.entities.SeatingTable.delete(table.id);
    load();
  };

  const seated = guests.length - unassigned.length;

  return (
    <div>
      <PageHeader
        eyebrow="Guests & Seating"
        title="Seating Chart"
        subtitle="Drag guests to tables. Seats stay in sync with your guest list as RSVPs change."
      >
        <Button variant="ghost" size="sm" onClick={load} className="mr-1">
          <RefreshCw className="w-4 h-4" />
        </Button>
        <Button onClick={() => setDialogOpen(true)} className="bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-1" /> Add table
        </Button>
      </PageHeader>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <Stat label="Tables" value={tables.length} />
        <Stat label="Guests" value={guests.length} />
        <Stat label="Seated" value={seated} tone="emerald" />
        <Stat label="Unassigned" value={unassigned.length} tone={unassigned.length > 0 ? 'amber' : 'muted'} />
      </div>

      {loading ? (
        <div className="text-center py-16 text-muted-foreground">Loading seating chart…</div>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <div className="elegant-card p-4">
                <h3 className="serif-heading text-lg text-foreground mb-1">Unassigned</h3>
                <p className="text-xs text-muted-foreground mb-3">{unassigned.length} guests</p>
                <Droppable droppableId="unassigned">
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`min-h-[200px] space-y-2 rounded-xl p-2 transition-colors ${
                        snapshot.isDraggingOver ? 'bg-accent/60' : 'bg-secondary/20'
                      }`}
                    >
                      {unassigned.map((guest, index) => (
                        <GuestChip key={guest.id} guest={guest} index={index} />
                      ))}
                      {provided.placeholder}
                      {unassigned.length === 0 && !snapshot.isDraggingOver && (
                        <p className="text-xs text-muted-foreground/40 text-center py-8 select-none">
                          All guests are seated
                        </p>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            </div>

            <div className="lg:col-span-2">
              {tables.length === 0 ? (
                <div className="elegant-card p-12 text-center">
                  <Armchair className="w-10 h-10 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="serif-heading text-xl text-foreground">No tables yet</p>
                  <p className="text-sm text-muted-foreground mt-1 mb-5">Add your first table to start seating guests.</p>
                  <Button onClick={() => setDialogOpen(true)} className="bg-primary hover:bg-primary/90">
                    <Plus className="w-4 h-4 mr-1" /> Add table
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {tables.map((table) => (
                    <TableCard
                      key={table.id}
                      table={table}
                      guests={guestsAt(table.id)}
                      onDelete={() => deleteTable(table)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </DragDropContext>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="serif-heading text-2xl">New table</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="tn">Table name</Label>
              <Input id="tn" placeholder="e.g. Table 1, Head Table" value={tName} onChange={(e) => setTName(e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="tc">Capacity</Label>
              <Input id="tc" type="number" min="1" max="50" value={tCapacity} onChange={(e) => setTCapacity(e.target.value)} className="mt-1.5" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={addTable} disabled={saving || !tName.trim()} className="bg-primary hover:bg-primary/90">
              {saving ? 'Saving…' : 'Add table'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Stat({ label, value, tone }) {
  const color = tone === 'emerald' ? 'text-emerald-600' : tone === 'amber' ? 'text-amber-600' : 'text-foreground';
  return (
    <div className="elegant-card p-4">
      <p className={`serif-heading text-2xl ${color}`}>{value}</p>
      <p className="text-xs text-muted-foreground uppercase tracking-wider mt-0.5">{label}</p>
    </div>
  );
}