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
import { UtensilsCrossed, Clock, MapPin, Users } from 'lucide-react';

export default function Rehearsal() {
  const { wedding, tier } = useOutletContext();
  const [rehearsal, setRehearsal] = useState(null);
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!wedding) return;
    setLoading(true);
    try {
      const list = await base44.entities.RehearsalDinner.filter({ wedding_id: wedding.id }, '-created_date', 1);
      const r = list && list[0] ? list[0] : null;
      setRehearsal(r || { wedding_id: wedding.id });
      const g = await base44.entities.Guest.filter({ wedding_id: wedding.id }, 'name', 500);
      setGuests(g || []);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [wedding]);

  if (!wedding) return null;
  if (!hasFeature(tier, 'rehearsal')) return <FeatureGate tierLabel="Destination" />;

  const attending = guests.filter((g) => g.attending_rehearsal);

  const toggleAttend = async (g) => {
    await base44.entities.Guest.update(g.id, { attending_rehearsal: !g.attending_rehearsal });
    setGuests((prev) => prev.map((x) => x.id === g.id ? { ...x, attending_rehearsal: !x.attending_rehearsal } : x));
  };

  const saveField = async (field, value) => {
    setSaving(true);
    try {
      if (rehearsal.id) {
        await base44.entities.RehearsalDinner.update(rehearsal.id, { [field]: value });
        setRehearsal((prev) => ({ ...prev, [field]: value }));
      } else {
        const created = await base44.entities.RehearsalDinner.create({ wedding_id: wedding.id, [field]: value });
        setRehearsal(created);
      }
    } catch (e) {
      alert('Could not save: ' + (e.message || 'error'));
    } finally { setSaving(false); }
  };

  return (
    <div>
      <PageHeader eyebrow="The Night Before" title="Rehearsal Dinner"
        subtitle="A separate plan for the rehearsal — venue, timeline, menu, and guest list."
      />

      {loading ? (
        <div className="text-center py-16 text-muted-foreground">Loading…</div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
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
                <div className="grid grid-cols-2 gap-3">
                  <div><Label htmlFor="vd">Date</Label><Input id="vd" type="date" value={rehearsal.dinner_date || ''}
                    onChange={(e) => setRehearsal({ ...rehearsal, dinner_date: e.target.value })}
                    onBlur={(e) => saveField('dinner_date', e.target.value)} className="mt-1.5" /></div>
                  <div><Label htmlFor="gc">Guest count</Label><Input id="gc" type="number" min="0" value={rehearsal.guest_count ?? 0}
                    onChange={(e) => setRehearsal({ ...rehearsal, guest_count: Number(e.target.value) })}
                    onBlur={(e) => saveField('guest_count', Number(e.target.value))} className="mt-1.5" /></div>
                </div>
              </div>
            </div>

            <div className="elegant-card p-6">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-4 h-4 text-primary" />
                <h3 className="serif-heading text-lg text-foreground">Evening timeline</h3>
              </div>
              <div className="space-y-3">
                <div><Label htmlFor="at">Arrival time</Label><Input id="at" type="time" value={rehearsal.arrival_time || ''}
                  onChange={(e) => setRehearsal({ ...rehearsal, arrival_time: e.target.value })}
                  onBlur={(e) => saveField('arrival_time', e.target.value)} className="mt-1.5" /></div>
                <div><Label htmlFor="dt">Dinner time</Label><Input id="dt" type="time" value={rehearsal.dinner_time || ''}
                  onChange={(e) => setRehearsal({ ...rehearsal, dinner_time: e.target.value })}
                  onBlur={(e) => saveField('dinner_time', e.target.value)} className="mt-1.5" /></div>
                <div><Label htmlFor="tt">Toasts time</Label><Input id="tt" type="time" value={rehearsal.toasts_time || ''}
                  onChange={(e) => setRehearsal({ ...rehearsal, toasts_time: e.target.value })}
                  onBlur={(e) => saveField('toasts_time', e.target.value)} className="mt-1.5" /></div>
              </div>
            </div>
          </div>

          <div className="elegant-card p-6 mb-8">
            <div className="flex items-center gap-2 mb-4">
              <UtensilsCrossed className="w-4 h-4 text-primary" />
              <h3 className="serif-heading text-lg text-foreground">Menu & notes</h3>
            </div>
            <div className="space-y-3">
              <div><Label htmlFor="mn">Menu notes</Label><Textarea id="mn" rows={2} placeholder="Courses, dietary notes, drinks…"
                value={rehearsal.menu_notes || ''}
                onChange={(e) => setRehearsal({ ...rehearsal, menu_notes: e.target.value })}
                onBlur={(e) => saveField('menu_notes', e.target.value)} className="mt-1.5" /></div>
              <div><Label htmlFor="nt">Other notes</Label><Textarea id="nt" rows={2} placeholder="Speeches, decor, logistics…"
                value={rehearsal.notes || ''}
                onChange={(e) => setRehearsal({ ...rehearsal, notes: e.target.value })}
                onBlur={(e) => saveField('notes', e.target.value)} className="mt-1.5" /></div>
            </div>
          </div>

          <div className="elegant-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                <h3 className="serif-heading text-lg text-foreground">Rehearsal guest list</h3>
              </div>
              <span className="text-sm text-muted-foreground">{attending.length} attending</span>
            </div>
            {guests.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">Add guests first from the Guests page, then check who's invited to the rehearsal.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-80 overflow-y-auto pr-1">
                {guests.map((g) => (
                  <label key={g.id} className="flex items-center gap-3 p-2.5 rounded-lg border border-border/60 hover:bg-secondary/40 cursor-pointer">
                    <input type="checkbox" checked={!!g.attending_rehearsal} onChange={() => toggleAttend(g)} className="w-4 h-4 accent-[hsl(var(--primary))]" />
                    <span className="text-sm text-foreground">{g.name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}