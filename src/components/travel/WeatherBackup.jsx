import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { CloudRain } from 'lucide-react';

export default function WeatherBackup({ weddingId }) {
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!weddingId) return;
    setLoading(true);
    try {
      const list = await base44.entities.WeatherBackup.filter({ wedding_id: weddingId }, '-created_date', 1);
      setRecord(list && list[0] ? list[0] : { wedding_id: weddingId });
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [weddingId]);

  const saveField = async (field, value) => {
    setSaving(true);
    try {
      if (record.id) {
        await base44.entities.WeatherBackup.update(record.id, { [field]: value });
        setRecord((p) => ({ ...p, [field]: value }));
      } else {
        const created = await base44.entities.WeatherBackup.create({ wedding_id: weddingId, [field]: value });
        setRecord(created);
      }
    } catch (e) { alert('Could not save: ' + (e.message || 'error')); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="text-center py-12 text-muted-foreground">Loading…</div>;

  return (
    <div>
      <h2 className="serif-heading text-xl text-foreground mb-2">Weather & Backup Plan</h2>
      <p className="text-sm text-muted-foreground mb-5">Note the forecast and an indoor or alternate plan so you're ready if the weather turns.</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="elegant-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <CloudRain className="w-4 h-4 text-primary" />
            <h3 className="serif-heading text-lg text-foreground">Forecast</h3>
          </div>
          <div className="space-y-3">
            <div><Label htmlFor="wf">Expected weather</Label><Textarea id="wf" rows={3} placeholder="e.g. 78°F, partly cloudy, 10% chance of rain"
              value={record.forecast || ''} onChange={(e) => setRecord({ ...record, forecast: e.target.value })}
              onBlur={(e) => saveField('forecast', e.target.value)} className="mt-1.5" /></div>
            <div><Label htmlFor="wia">Indoor / alternate venue</Label><Input id="wia" placeholder="e.g. The ballroom at The Pavilion"
              value={record.indoor_alternative || ''} onChange={(e) => setRecord({ ...record, indoor_alternative: e.target.value })}
              onBlur={(e) => saveField('indoor_alternative', e.target.value)} className="mt-1.5" /></div>
          </div>
        </div>

        <div className="elegant-card p-6">
          <h3 className="serif-heading text-lg text-foreground mb-4">Backup plan</h3>
          <div className="space-y-3">
            <div><Label htmlFor="wbp">If the weather turns…</Label><Textarea id="wbp" rows={3} placeholder="Move ceremony indoors, redirect shuttle, notify vendor…"
              value={record.backup_plan || ''} onChange={(e) => setRecord({ ...record, backup_plan: e.target.value })}
              onBlur={(e) => saveField('backup_plan', e.target.value)} className="mt-1.5" /></div>
            <div><Label htmlFor="wn">Other notes</Label><Textarea id="wn" rows={2} placeholder="Tent rental, contact at venue…"
              value={record.notes || ''} onChange={(e) => setRecord({ ...record, notes: e.target.value })}
              onBlur={(e) => saveField('notes', e.target.value)} className="mt-1.5" /></div>
          </div>
        </div>
      </div>
      {saving && <p className="text-xs text-muted-foreground mt-3 text-right">Saving…</p>}
    </div>
  );
}