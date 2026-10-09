import { useState, useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useOutletContext, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/PageHeader';
import PullToRefresh from '@/components/PullToRefresh';
import FeatureGate from '@/components/FeatureGate';
import { hasFeature } from '@/lib/wedding';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import ActionSheet from '@/components/ui/action-sheet';
import {
  Check, X, Clock, Mail, Utensils, Users, Armchair, Settings, Plus, Pencil, Trash2, Search
} from 'lucide-react';

const RSVP_BADGE = {
  pending: 'bg-secondary text-muted-foreground',
  yes: 'bg-emerald-100 text-emerald-700',
  no: 'bg-rose-100 text-rose-700',
};

const TIER_BADGE = {
  must_invite: 'bg-primary/10 text-primary',
  should_invite: 'bg-amber-100 text-amber-700',
  nice_to_have: 'bg-secondary text-muted-foreground',
};

const TIER_LABELS = {
  must_invite: 'Must invite',
  should_invite: 'Should invite',
  nice_to_have: 'Nice to have',
};

export default function RSVP() {
  const { wedding, tier } = useOutletContext();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('all');
  const [tierFilter, setTierFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [editDialog, setEditDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [mealDialog, setMealDialog] = useState(false);

  const { data: guests = [], isLoading, refetch } = useQuery({
    queryKey: ['guests', wedding?.id],
    queryFn: () => base44.entities.Guest.filter({ wedding_id: wedding.id }, 'name', 500),
    enabled: !!wedding,
  });

  if (!wedding) return null;
  if (!hasFeature(tier, 'guests')) return <FeatureGate feature="guests" tierLabel="Multiday" />;

  const mealOptions = (wedding.site_meal_options || '')
    .split(',')
    .map((m) => m.trim())
    .filter(Boolean);

  const stats = {
    total: guests.length,
    pending: guests.filter((g) => g.rsvp_status === 'pending').length,
    yes: guests.filter((g) => g.rsvp_status === 'yes').length,
    no: guests.filter((g) => g.rsvp_status === 'no').length,
  };

  const tierStats = {
    must_invite: guests.filter((g) => (g.invite_tier || 'should_invite') === 'must_invite').length,
    should_invite: guests.filter((g) => (g.invite_tier || 'should_invite') === 'should_invite').length,
    nice_to_have: guests.filter((g) => (g.invite_tier || 'should_invite') === 'nice_to_have').length,
  };

  const filtered = useMemo(() => {
    return guests.filter((g) => {
      if (filter !== 'all' && g.rsvp_status !== filter) return false;
      if (tierFilter !== 'all' && (g.invite_tier || 'should_invite') !== tierFilter) return false;
      if (search && !g.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [guests, filter, tierFilter, search]);

  const quickSetRSVP = async (guest, status) => {
    queryClient.setQueryData(['guests', wedding.id], (prev) =>
      prev.map((g) => (g.id === guest.id ? { ...g, rsvp_status: status } : g))
    );
    try {
      await base44.entities.Guest.update(guest.id, { rsvp_status: status });
    } catch {
      queryClient.invalidateQueries({ queryKey: ['guests', wedding.id] });
    }
  };

  const removeGuest = async (id) => {
    queryClient.setQueryData(['guests', wedding.id], (prev) => prev.filter((g) => g.id !== id));
    await base44.entities.Guest.delete(id);
  };

  const load = async () => { await refetch(); };

  return (
    <PullToRefresh onRefresh={load}>
      <div>
        <PageHeader
          eyebrow="Your people"
          title="RSVP Tracker"
          subtitle="Track responses, meal choices, and invite tiers — attending guests flow straight to your seating chart."
        >
          <Button variant="outline" onClick={() => setMealDialog(true)}>
            <Settings className="w-4 h-4 mr-1" /> Meal options
          </Button>
          <Button onClick={() => { setEditing(null); setEditDialog(true); }} className="bg-primary hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-1" /> Add guest
          </Button>
        </PageHeader>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <Stat label="Total" value={stats.total} icon={Users} />
          <Stat label="Attending" value={stats.yes} tone="emerald" icon={Check} />
          <Stat label="Declined" value={stats.no} tone="rose" icon={X} />
          <Stat label="Pending" value={stats.pending} tone="muted" icon={Clock} />
        </div>

        {/* Invite tier breakdown */}
        <div className="elegant-card p-5 mb-6">
          <h3 className="serif-heading text-lg text-foreground mb-4">Invite tiers</h3>
          <div className="grid grid-cols-3 gap-3">
            {Object.entries(TIER_LABELS).map(([key, label]) => (
              <div key={key} className="text-center">
                <span className={`inline-block text-xs px-2 py-0.5 rounded-full mb-2 ${TIER_BADGE[key]}`}>{label}</span>
                <p className="serif-heading text-2xl text-foreground">{tierStats[key]}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Attending → Seating chart link */}
        {stats.yes > 0 && (
          <Link to="/seating" className="elegant-card p-4 mb-6 flex items-center gap-3 hover:shadow-md transition-shadow group">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Armchair className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">{stats.yes} attending guest{stats.yes !== 1 ? 's' : ''} ready to seat</p>
              <p className="text-xs text-muted-foreground">Drag them to tables in the seating chart →</p>
            </div>
            <span className="text-primary text-sm group-hover:translate-x-0.5 transition-transform">Open</span>
          </Link>
        )}

        {/* Filters + search */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {[
              { key: 'all', label: 'All' },
              { key: 'pending', label: 'Pending' },
              { key: 'yes', label: 'Attending' },
              { key: 'no', label: 'Declined' },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors min-h-[44px] ${
                  filter === f.key ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:bg-accent'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <ActionSheet
              value={tierFilter}
              onChange={setTierFilter}
              options={[
                { value: 'all', label: 'All tiers' },
                { value: 'must_invite', label: 'Must invite' },
                { value: 'should_invite', label: 'Should invite' },
                { value: 'nice_to_have', label: 'Nice to have' },
              ]}
              className="flex-1"
            />
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                placeholder="Search guests…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </div>

        {/* Guest list */}
        {isLoading ? (
          <div className="text-center py-16 text-muted-foreground">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="elegant-card p-12 text-center">
            <Users className="w-10 h-10 text-muted-foreground/30 mx-auto mb-4" />
            <p className="serif-heading text-xl text-foreground">
              {guests.length === 0 ? 'No guests yet' : 'No guests match your filters'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {guests.length === 0 ? 'Add your first guest to start tracking RSVPs.' : 'Try adjusting your filters.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((g) => (
              <div key={g.id} className="elegant-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-foreground">{g.name}</p>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${RSVP_BADGE[g.rsvp_status]}`}>
                        {g.rsvp_status === 'yes' ? 'Attending' : g.rsvp_status === 'no' ? 'Declined' : 'Pending'}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${TIER_BADGE[g.invite_tier || 'should_invite']}`}>
                        {TIER_LABELS[g.invite_tier || 'should_invite']}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-xs text-muted-foreground">
                      {g.contact && <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {g.contact}</span>}
                      {g.meal_choice && <span className="flex items-center gap-1"><Utensils className="w-3 h-3" /> {g.meal_choice}</span>}
                      {g.plus_ones > 0 && <span className="flex items-center gap-1"><Users className="w-3 h-3" /> +{g.plus_ones}</span>}
                      {g.table_name && <span className="flex items-center gap-1"><Armchair className="w-3 h-3" /> {g.table_name}</span>}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => { setEditing(g); setEditDialog(true); }} aria-label="Edit guest" className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground min-h-[44px] min-w-[44px] flex items-center justify-center">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => removeGuest(g.id)} aria-label="Delete guest" className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-destructive min-h-[44px] min-w-[44px] flex items-center justify-center">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Quick RSVP buttons */}
                {g.rsvp_status === 'pending' && (
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => quickSetRSVP(g, 'yes')}
                      className="flex-1 py-2 rounded-lg bg-emerald-50 text-emerald-700 text-sm font-medium hover:bg-emerald-100 transition-colors min-h-[44px] flex items-center justify-center gap-1.5"
                    >
                      <Check className="w-4 h-4" /> Attending
                    </button>
                    <button
                      onClick={() => quickSetRSVP(g, 'no')}
                      className="flex-1 py-2 rounded-lg bg-rose-50 text-rose-700 text-sm font-medium hover:bg-rose-100 transition-colors min-h-[44px] flex items-center justify-center gap-1.5"
                    >
                      <X className="w-4 h-4" /> Decline
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <GuestEditDialog
          open={editDialog}
          onOpenChange={setEditDialog}
          wedding={wedding}
          editing={editing}
          mealOptions={mealOptions}
          onSaved={() => { setEditDialog(false); queryClient.invalidateQueries({ queryKey: ['guests', wedding.id] }); }}
        />
        <MealOptionsDialog
          open={mealDialog}
          onOpenChange={setMealDialog}
          wedding={wedding}
          onSaved={() => { setMealDialog(false); queryClient.invalidateQueries({ queryKey: ['wedding'] }); }}
        />
      </div>
    </PullToRefresh>
  );
}

function Stat({ label, value, tone, icon: Icon }) {
  const color = tone === 'emerald' ? 'text-emerald-600' : tone === 'rose' ? 'text-rose-600' : tone === 'muted' ? 'text-muted-foreground' : 'text-foreground';
  return (
    <div className="elegant-card p-4">
      <div className="flex items-center justify-between">
        <p className={`serif-heading text-2xl ${color}`}>{value}</p>
        {Icon && <Icon className="w-4 h-4 text-muted-foreground/40" />}
      </div>
      <p className="text-xs text-muted-foreground uppercase tracking-wider mt-0.5">{label}</p>
    </div>
  );
}

function GuestEditDialog({ open, onOpenChange, wedding, editing, mealOptions, onSaved }) {
  const [name, setName] = useState('');
  const [rsvp, setRsvp] = useState('pending');
  const [contact, setContact] = useState('');
  const [plus, setPlus] = useState(0);
  const [plusOneName, setPlusOneName] = useState('');
  const [meal, setMeal] = useState('');
  const [mealNotes, setMealNotes] = useState('');
  const [inviteTier, setInviteTier] = useState('should_invite');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName(editing?.name || '');
      setRsvp(editing?.rsvp_status || 'pending');
      setContact(editing?.contact || '');
      setPlus(editing?.plus_ones || 0);
      setPlusOneName(editing?.plus_one_name || '');
      setMeal(editing?.meal_choice || '');
      setMealNotes(editing?.meal_notes || '');
      setInviteTier(editing?.invite_tier || 'should_invite');
    }
  }, [open, editing]);

  const save = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const payload = {
        wedding_id: wedding.id,
        name: name.trim(),
        rsvp_status: rsvp,
        contact: contact.trim(),
        plus_ones: Number(plus) || 0,
        plus_one_name: plusOneName.trim(),
        meal_choice: meal.trim(),
        meal_notes: mealNotes.trim(),
        invite_tier: inviteTier,
      };
      if (editing) {
        if (!editing.rsvp_token) payload.rsvp_token = crypto.randomUUID();
        await base44.entities.Guest.update(editing.id, payload);
      } else {
        payload.rsvp_token = crypto.randomUUID();
        await base44.entities.Guest.create(payload);
      }
      onSaved();
    } catch (e) {
      alert('Could not save: ' + (e.message || 'error'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="serif-heading text-2xl">{editing ? 'Edit guest' : 'Add guest'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label htmlFor="gn">Name</Label>
            <Input id="gn" value={name} onChange={(e) => setName(e.target.value)} className="mt-1.5" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="rsvp">RSVP status</Label>
              <ActionSheet
                id="rsvp"
                value={rsvp}
                onChange={setRsvp}
                options={[
                  { value: 'pending', label: 'Pending' },
                  { value: 'yes', label: 'Attending' },
                  { value: 'no', label: 'Declined' },
                ]}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="it">Invite tier</Label>
              <ActionSheet
                id="it"
                value={inviteTier}
                onChange={setInviteTier}
                options={[
                  { value: 'must_invite', label: 'Must invite' },
                  { value: 'should_invite', label: 'Should invite' },
                  { value: 'nice_to_have', label: 'Nice to have' },
                ]}
                className="mt-1.5"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="ct">Contact</Label>
            <Input id="ct" placeholder="Email or phone" value={contact} onChange={(e) => setContact(e.target.value)} className="mt-1.5" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="po">Plus ones</Label>
              <Input id="po" type="number" min="0" value={plus} onChange={(e) => setPlus(e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="pn">Plus one name</Label>
              <Input id="pn" value={plusOneName} onChange={(e) => setPlusOneName(e.target.value)} className="mt-1.5" />
            </div>
          </div>
          <div>
            <Label htmlFor="gm">Meal choice</Label>
            {mealOptions.length > 0 ? (
              <ActionSheet
                id="gm"
                value={meal}
                onChange={setMeal}
                options={[{ value: '', label: 'None' }, ...mealOptions.map((m) => ({ value: m, label: m }))]}
                className="mt-1.5"
              />
            ) : (
              <Input id="gm" placeholder="e.g. Chicken, Vegetarian…" value={meal} onChange={(e) => setMeal(e.target.value)} className="mt-1.5" />
            )}
          </div>
          <div>
            <Label htmlFor="mn">Meal notes / dietary</Label>
            <Input id="mn" placeholder="Allergies, dietary restrictions…" value={mealNotes} onChange={(e) => setMealNotes(e.target.value)} className="mt-1.5" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} disabled={saving || !name.trim()} className="bg-primary hover:bg-primary/90">
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function MealOptionsDialog({ open, onOpenChange, wedding, onSaved }) {
  const [text, setTex] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setTex(wedding.site_meal_options || '');
  }, [open, wedding]);

  const save = async () => {
    setSaving(true);
    try {
      await base44.entities.Wedding.update(wedding.id, { site_meal_options: text.trim() });
      onSaved();
    } catch (e) {
      alert('Could not save: ' + (e.message || 'error'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="serif-heading text-2xl">Meal options</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <p className="text-sm text-muted-foreground">
            Define the meal choices your guests can pick from. Separate each option with a comma.
          </p>
          <Label htmlFor="mo">Options (comma-separated)</Label>
          <Input
            id="mo"
            placeholder="Chicken, Beef, Vegetarian, Vegan, Kids meal"
            value={text}
            onChange={(e) => setTex(e.target.value)}
            className="mt-1.5"
          />
          {text.trim() && (
            <div className="flex flex-wrap gap-2 pt-2">
              {text.split(',').map((m) => m.trim()).filter(Boolean).map((m, i) => (
                <span key={i} className="text-xs px-2 py-1 rounded-full bg-secondary text-muted-foreground">{m}</span>
              ))}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} disabled={saving} className="bg-primary hover:bg-primary/90">
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}