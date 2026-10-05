import { useState, useMemo, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useOutletContext, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/PageHeader';
import PullToRefresh from '@/components/PullToRefresh';
import FeatureGate from '@/components/FeatureGate';
import { hasFeature, isFreeTier, TIMELINE_FREE_CAP } from '@/lib/wedding';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Trash2, Clock, Camera, Video, Users, Pencil, Sparkles, Loader2 } from 'lucide-react';
import { formatTimePref } from '@/lib/settings';

const DEFAULT_DAYS = {
  single_day: [{ n: 1, label: 'Wedding Day' }],
  multiday: [
    { n: 0, label: 'Rehearsal Dinner' },
    { n: 1, label: 'Welcome Dinner' },
    { n: 2, label: 'Wedding Day' },
    { n: 3, label: 'Next-Day Brunch' },
  ],
  destination: [
    { n: 0, label: 'Rehearsal Dinner' },
    { n: 1, label: 'Arrival & Welcome' },
    { n: 2, label: 'Rehearsal' },
    { n: 3, label: 'Wedding Day' },
    { n: 4, label: 'Farewell Brunch' },
  ],
};

export default function Timeline() {
  const { wedding, tier } = useOutletContext();
  const queryClient = useQueryClient();
  const { data: events = [], isLoading: loading, refetch } = useQuery({
    queryKey: ['timelineEvents', wedding?.id],
    queryFn: () => base44.entities.TimelineEvent.filter({ wedding_id: wedding.id }, 'order', 200),
    enabled: !!wedding,
  });
  const [activeDay, setActiveDay] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [optOpen, setOptOpen] = useState(false);

  const isMultiday = wedding?.wedding_type !== 'single_day';
  const days = DEFAULT_DAYS[wedding?.wedding_type] || DEFAULT_DAYS.single_day;
  const freeTier = isFreeTier(tier);
  const atCap = freeTier && events.length >= TIMELINE_FREE_CAP;

  const dayEvents = useMemo(
    () => events.filter((e) => Number(e.day_number) === Number(activeDay)).sort((a, b) => (a.start_time || '').localeCompare(b.start_time || '')),
    [events, activeDay]
  );

  if (!wedding) return null;
  if (!hasFeature(tier, 'timeline')) return <FeatureGate tierLabel="Multiday" />;

  const load = async () => { await refetch(); };
  const reload = async () => { await queryClient.invalidateQueries({ queryKey: ['timelineEvents', wedding.id] }); };

  const pacingNote = () => {
    const s = wedding.photographer_status;
    if (s === 'both') return { icon: Users, text: "You have both a photographer and videographer — we've added extra buffer time so each moment isn't rushed. Coordinating both needs slower, deliberate pacing." };
    if (s === 'photographer') return { icon: Camera, text: "Photographer-only coverage allows a tighter, snappier timeline with minimal buffers." };
    if (s === 'videographer') return { icon: Video, text: "Videographer-only coverage allows a relaxed pace with light buffers for set-up shots." };
    return { icon: Clock, text: "Add your photographer/videographer in Plan & Tiers to get pacing tuned to your vendor team." };
  };

  const pn = pacingNote();
  const PnIcon = pn.icon;

  const openAdd = () => { setEditing(null); setDialogOpen(true); };
  const openEdit = (ev) => { setEditing(ev); setDialogOpen(true); };

  return (
    <PullToRefresh onRefresh={load}>
    <div>
      <PageHeader eyebrow="The Schedule" title="Timeline Builder"
        subtitle="Arrange your day-of moments into a clear, paced schedule."
      >
        <div className="flex items-center gap-2">
          {!freeTier && (
            <Button onClick={() => setOptOpen(true)} variant="outline">
              <Sparkles className="w-4 h-4 mr-1" /> Optimize
            </Button>
          )}
          <Button onClick={openAdd} disabled={atCap} className="bg-primary hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-1" /> {atCap ? `${TIMELINE_FREE_CAP} of ${TIMELINE_FREE_CAP} events` : 'Add event'}
          </Button>
        </div>
      </PageHeader>

      {/* Pacing note — locked for free tier */}
      {!freeTier && (
        <div className="elegant-card p-4 mb-6 flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center shrink-0">
            <PnIcon className="w-4 h-4 text-accent-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Vendor-aware pacing</p>
            <p className="text-sm text-muted-foreground mt-0.5">{pn.text}</p>
          </div>
        </div>
      )}
      {freeTier && atCap && (
        <div className="elegant-card p-5 mb-6 flex items-center justify-between gap-4 bg-accent/40">
          <div>
            <p className="serif-heading text-lg text-foreground">You've built {TIMELINE_FREE_CAP} of {TIMELINE_FREE_CAP} events</p>
            <p className="text-sm text-muted-foreground mt-0.5">Unlock your full wedding day timeline.</p>
          </div>
          <Button asChild className="bg-primary hover:bg-primary/90 shrink-0">
            <Link to="/pricing">View plans</Link>
          </Button>
        </div>
      )}

      {/* Day tabs */}
      {isMultiday && (
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {days.map((d) => (
            <button key={d.n} onClick={() => setActiveDay(d.n)}
              className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-colors ${
                Number(activeDay) === d.n ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:bg-accent'
              }`}>
              Day {d.n} · {d.label}
            </button>
          ))}
        </div>
      )}

      {/* Timeline */}
      {loading ? (
        <div className="text-center py-16 text-muted-foreground">Loading your timeline…</div>
      ) : dayEvents.length === 0 ? (
        <div className="elegant-card p-12 text-center">
          <Clock className="w-10 h-10 text-muted-foreground/30 mx-auto mb-4" />
          <p className="serif-heading text-xl text-foreground">No events yet</p>
          <p className="text-sm text-muted-foreground mt-1 mb-5">Add moments like first look, ceremony, first dance, and send-off.</p>
          <Button onClick={openAdd} className="bg-primary hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-1" /> Add your first event
          </Button>
        </div>
      ) : (
        <div className="relative pl-8">
          <div className="absolute left-3 top-2 bottom-2 w-px bg-border" />
          <ul className="space-y-4">
            {dayEvents.map((ev) => (
              <li key={ev.id} className="relative">
                <div className="absolute -left-[22px] top-3 w-3 h-3 rounded-full bg-primary ring-4 ring-background" />
                <div className="elegant-card p-4 group">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-3.5 h-3.5 text-primary" />
                        <span className="font-medium text-foreground">{formatTimePref(ev.start_time, wedding?.time_format)}</span>
                        <span className="text-muted-foreground">· {ev.duration_minutes} min</span>
                      </div>
                      <h3 className="serif-heading text-lg text-foreground mt-1">{ev.title}</h3>
                      {ev.notes && <p className="text-sm text-muted-foreground mt-1">{ev.notes}</p>}
                    </div>
                    <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(ev)} aria-label="Edit event" className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground min-h-[44px] min-w-[44px] flex items-center justify-center">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => base44.entities.TimelineEvent.delete(ev.id).then(reload)} aria-label="Delete event" className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-destructive min-h-[44px] min-w-[44px] flex items-center justify-center">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <EventDialog
        open={dialogOpen} onOpenChange={setDialogOpen}
        wedding={wedding} dayNumber={activeDay} dayLabel={days.find((d) => d.n === activeDay)?.label || ''}
        editing={editing} onSaved={reload}
      />
      <OptimizeDialog
        open={optOpen} onOpenChange={setOptOpen}
        wedding={wedding} dayNumber={activeDay} dayLabel={days.find((d) => d.n === activeDay)?.label || ''}
        onApplied={reload}
      />
    </div>
    </PullToRefresh>
  );
}

function EventDialog({ open, onOpenChange, wedding, dayNumber, dayLabel, editing, onSaved }) {
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
      const base = {
        wedding_id: wedding.id,
        day_number: Number(dayNumber),
        day_label: dayLabel,
        title: title.trim(),
        start_time: startTime,
        duration_minutes: Number(duration) || 30,
        notes: notes.trim(),
      };
      if (editing) {
        await base44.entities.TimelineEvent.update(editing.id, base);
      } else {
        await base44.entities.TimelineEvent.create({ ...base, order: Date.now() });
      }
      onOpenChange(false);
      onSaved();
    } catch (e) {
      alert('Could not save: ' + (e.message || 'error'));
    } finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="serif-heading text-2xl">{editing ? 'Edit event' : 'New timeline event'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label htmlFor="t">Event title</Label>
            <Input id="t" placeholder="e.g. First look" value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1.5" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="st">Start time</Label>
              <Input id="st" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="dur">Duration (min)</Label>
              <Input id="dur" type="number" min="5" step="5" value={duration} onChange={(e) => setDuration(e.target.value)} className="mt-1.5" />
            </div>
          </div>
          <div>
            <Label htmlFor="n">Notes</Label>
            <Textarea id="n" rows={2} placeholder="Details, location, who's involved…" value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1.5" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} disabled={saving || !title.trim() || !startTime} className="bg-primary hover:bg-primary/90">
            {saving ? 'Saving…' : 'Save event'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function OptimizeDialog({ open, onOpenChange, wedding, dayNumber, dayLabel, onApplied }) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) { setSuggestions([]); setError(''); }
  }, [open]);

  const generate = async () => {
    setLoading(true); setError('');
    try {
      const res = await base44.functions.invoke('optimizeTimeline', {
        guest_count: wedding.guest_count || 0,
        ceremony_time: '16:00',
        venue: wedding.venue_name || '',
        wedding_type: wedding.wedding_type || 'single_day',
        photographer_status: wedding.photographer_status || 'photographer',
      });
      setSuggestions(res?.data?.events || []);
    } catch (e) { setError('Could not generate: ' + (e.message || 'error')); }
    finally { setLoading(false); }
  };

  const applyAll = async () => {
    if (!suggestions.length) return;
    setApplying(true);
    try {
      const records = suggestions.map((s, i) => ({
        wedding_id: wedding.id,
        day_number: Number(dayNumber),
        day_label: dayLabel,
        title: s.title,
        start_time: s.start_time,
        duration_minutes: Number(s.duration_minutes) || 30,
        notes: s.notes || '',
        order: Date.now() + i,
      }));
      await base44.entities.TimelineEvent.bulkCreate(records);
      onOpenChange(false);
      onApplied();
    } catch (e) { setError('Could not apply: ' + (e.message || 'error')); }
    finally { setApplying(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="serif-heading text-2xl flex items-center gap-2"><Sparkles className="w-5 h-5 text-primary" /> Timeline optimizer</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground -mt-2">
          We'll suggest a paced run-of-show from your guest count, ceremony time, and photo coverage.
        </p>
        <div className="grid grid-cols-3 gap-3 text-sm py-1">
          <div><p className="text-xs text-muted-foreground uppercase tracking-wider">Guests</p><p className="font-medium">{wedding.guest_count || '—'}</p></div>
          <div><p className="text-xs text-muted-foreground uppercase tracking-wider">Venue</p><p className="font-medium truncate">{wedding.venue_name || '—'}</p></div>
          <div><p className="text-xs text-muted-foreground uppercase tracking-wider">Coverage</p><p className="font-medium capitalize">{(wedding.photographer_status || '—').replace('_', ' ')}</p></div>
        </div>

        {suggestions.length > 0 && (
          <div className="max-h-[40vh] overflow-y-auto space-y-2 pr-1">
            {suggestions.map((s, i) => (
              <div key={i} className="flex items-start gap-3 rounded-xl border border-border/70 p-3">
                <div className="text-right shrink-0">
                  <p className="text-sm font-medium text-primary">{formatTimePref(s.start_time, wedding?.time_format)}</p>
                  <p className="text-xs text-muted-foreground">{s.duration_minutes}m</p>
                </div>
                <div>
                  <p className="font-medium text-foreground text-sm">{s.title}</p>
                  <p className="text-xs text-muted-foreground">{s.notes}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          {suggestions.length === 0 ? (
            <Button onClick={generate} disabled={loading} className="bg-primary hover:bg-primary/90">
              {loading ? <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Generating…</> : <><Sparkles className="w-4 h-4 mr-1.5" /> Suggest run-of-show</>}
            </Button>
          ) : (
            <Button onClick={applyAll} disabled={applying} className="bg-primary hover:bg-primary/90">
              {applying ? 'Adding…' : `Add ${suggestions.length} events to Day ${dayNumber}`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}