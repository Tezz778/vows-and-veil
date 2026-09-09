import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Users, X } from 'lucide-react';

export default function RehearsalGuestList({ weddingId }) {
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!weddingId) return;
    setLoading(true);
    try {
      const g = await base44.entities.Guest.filter({ wedding_id: weddingId }, 'name', 500);
      setGuests(g || []);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [weddingId]);

  const update = async (g, patch) => {
    setGuests((p) => p.map((x) => x.id === g.id ? { ...x, ...patch } : x));
    try { await base44.entities.Guest.update(g.id, patch); }
    catch (e) { alert('Could not update: ' + (e.message || 'error')); load(); }
  };

  if (loading) return <div className="text-center py-12 text-muted-foreground">Loading…</div>;

  const invited = guests.filter((g) => g.rehearsal_invited);
  const rsvpYes = invited.filter((g) => g.rehearsal_rsvp === 'yes').length;
  const rsvpNo = invited.filter((g) => g.rehearsal_rsvp === 'no').length;
  const rsvpPending = invited.filter((g) => !g.rehearsal_rsvp || g.rehearsal_rsvp === 'pending').length;

  const tables = {};
  invited.forEach((g) => {
    const t = g.rehearsal_table?.trim() || 'Unassigned';
    if (!tables[t]) tables[t] = [];
    tables[t].push(g);
  });

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <Stat label="Invited" value={invited.length} />
        <Stat label="Yes" value={rsvpYes} className="text-green-600" />
        <Stat label="No" value={rsvpNo} className="text-destructive" />
        <Stat label="Pending" value={rsvpPending} className="text-muted-foreground" />
      </div>

      <div className="elegant-card p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-4 h-4 text-primary" />
          <h3 className="serif-heading text-lg text-foreground">Invite & RSVP</h3>
        </div>
        {guests.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">Add guests first from the Guests page, then mark who's invited to the rehearsal.</p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {guests.map((g) => (
              <div key={g.id} className="flex flex-wrap items-center gap-3 p-2.5 rounded-lg border border-border/60">
                <label className="flex items-center gap-2.5 cursor-pointer min-w-[160px]">
                  <input type="checkbox" checked={!!g.rehearsal_invited} onChange={() => update(g, { rehearsal_invited: !g.rehearsal_invited })} className="w-4 h-4 accent-[hsl(var(--primary))]" />
                  <span className="text-sm font-medium text-foreground">{g.name}</span>
                </label>
                {g.rehearsal_invited && (
                  <div className="flex items-center gap-2 ml-auto">
                    <select value={g.rehearsal_rsvp || 'pending'} onChange={(e) => update(g, { rehearsal_rsvp: e.target.value })}
                      className="h-8 rounded-md border border-input bg-transparent text-sm px-2">
                      <option value="pending">Pending</option>
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                    </select>
                    <Input placeholder="Table" value={g.rehearsal_table || ''} onChange={(e) => update(g, { rehearsal_table: e.target.value })}
                      className="h-8 w-28 text-sm" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {invited.length > 0 && (
        <div className="elegant-card p-6">
          <h3 className="serif-heading text-lg text-foreground mb-4">Seating</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.keys(tables).sort().map((t) => (
              <div key={t} className="rounded-xl border border-border/60 p-4">
                <p className="text-sm font-medium text-primary mb-2">{t} <span className="text-muted-foreground">({tables[t].length})</span></p>
                <ul className="space-y-1">
                  {tables[t].map((g) => (
                    <li key={g.id} className="text-sm text-foreground flex items-center gap-2">
                      {g.name}
                      {g.rehearsal_rsvp === 'no' && <X className="w-3 h-3 text-destructive" />}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

function Stat({ label, value, className }) {
  return (
    <div className="elegant-card p-4 text-center">
      <p className={`serif-heading text-2xl ${className || 'text-foreground'}`}>{value}</p>
      <p className="text-xs text-muted-foreground uppercase tracking-wider mt-0.5">{label}</p>
    </div>
  );
}