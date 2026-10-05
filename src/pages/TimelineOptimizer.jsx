import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/PageHeader';
import FeatureGate from '@/components/FeatureGate';
import { hasFeature } from '@/lib/wedding';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import ActionSheet from '@/components/ui/action-sheet';
import { Sparkles, Clock, Wand2, Check } from 'lucide-react';

const VENUE_TYPES = ['indoor', 'outdoor', 'mixed', 'religious', 'banquet_hall'];

export default function TimelineOptimizer() {
  const { wedding, tier } = useOutletContext();
  const [guestCount, setGuestCount] = useState(wedding?.guest_count || 100);
  const [ceremonyTime, setCeremonyTime] = useState('16:00');
  const [venueType, setVenueType] = useState('indoor');
  const [events, setEvents] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [importing, setImporting] = useState(false);
  const [imported, setImported] = useState(false);

  if (!hasFeature(tier, 'optimizer')) return <FeatureGate feature="optimizer" tierLabel="Single Day" />;
  if (!wedding) return null;

  const generate = async () => {
    setGenerating(true);
    setImported(false);
    try {
      const res = await base44.functions.invoke('optimizeTimeline', {
        guest_count: Number(guestCount) || 100,
        ceremony_time: ceremonyTime,
        venue_type: venueType,
        wedding_type: wedding.wedding_type,
        photographer_status: wedding.photographer_status,
      });
      setEvents(res?.data?.events || res?.events || []);
    } catch (e) {
      alert('Could not generate: ' + (e.message || 'error'));
    } finally { setGenerating(false); }
  };

  const importAll = async () => {
    if (!events.length) return;
    setImporting(true);
    try {
      const records = events.map((ev, i) => ({
        wedding_id: wedding.id,
        day_number: ev.day_number || 1,
        day_label: 'Wedding Day',
        title: ev.title,
        start_time: ev.start_time,
        duration_minutes: Number(ev.duration_minutes) || 30,
        notes: ev.notes || '',
        order: i,
      }));
      await base44.entities.TimelineEvent.bulkCreate(records);
      setImported(true);
    } catch (e) {
      alert('Could not import: ' + (e.message || 'error'));
    } finally { setImporting(false); }
  };

  return (
    <div>
      <PageHeader eyebrow="Smart Planning" title="Timeline Optimizer"
        subtitle="Tell us the basics — AI suggests a paced run-of-show you can add to your timeline."
      />

      <div className="elegant-card p-6 mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="gc">Guest count</Label>
            <Input id="gc" type="number" min="1" value={guestCount} onChange={(e) => setGuestCount(e.target.value)} className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="ct">Ceremony start time</Label>
            <Input id="ct" type="time" value={ceremonyTime} onChange={(e) => setCeremonyTime(e.target.value)} className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="vt">Venue type</Label>
            <ActionSheet id="vt" value={venueType} onChange={setVenueType} options={VENUE_TYPES.map((v) => ({ value: v, label: v.replace(/_/g, ' ') }))} className="mt-1.5" />
          </div>
        </div>
        <Button onClick={generate} disabled={generating} className="bg-primary hover:bg-primary/90 mt-5">
          <Wand2 className="w-4 h-4 mr-1.5" /> {generating ? 'Building run-of-show…' : 'Generate run-of-show'}
        </Button>
      </div>

      {events.length > 0 && (
        <>
          <div className="flex items-center justify-between mb-4">
            <h3 className="serif-heading text-xl text-foreground">Suggested run-of-show</h3>
            <Button onClick={importAll} disabled={importing || imported} className="bg-primary hover:bg-primary/90">
              {imported ? <><Check className="w-4 h-4 mr-1.5" /> Added to timeline</> : <><Sparkles className="w-4 h-4 mr-1.5" /> {importing ? 'Adding…' : 'Add to timeline'}</>}
            </Button>
          </div>
          <div className="relative pl-8">
            <div className="absolute left-3 top-2 bottom-2 w-px bg-border" />
            <ul className="space-y-4">
              {events.map((ev, i) => (
                <li key={i} className="relative">
                  <div className="absolute -left-[22px] top-3 w-3 h-3 rounded-full bg-primary ring-4 ring-background" />
                  <div className="elegant-card p-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-3.5 h-3.5 text-primary" />
                      <span className="font-medium text-foreground">{ev.start_time}</span>
                      <span className="text-muted-foreground">· {ev.duration_minutes} min</span>
                    </div>
                    <h4 className="serif-heading text-lg text-foreground mt-1">{ev.title}</h4>
                    {ev.notes && <p className="text-sm text-muted-foreground mt-1">{ev.notes}</p>}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}