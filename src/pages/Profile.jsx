import { useState, useRef } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Image as ImageIcon, Loader2, Check, Gem, Calendar, MapPin } from 'lucide-react';
import { TIER_LABELS, formatDate } from '@/lib/wedding';

export default function Profile() {
  const { wedding, setWedding, tier } = useOutletContext();
  const [form, setForm] = useState({
    couple_names: wedding?.couple_names || '',
    wedding_date: wedding?.wedding_date || '',
    venue_name: wedding?.venue_name || '',
    venue_location: wedding?.venue_location || '',
  });
  const [photoUrl, setPhotoUrl] = useState(wedding?.profile_photo || '');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileRef = useRef(null);

  const onPhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
      setPhotoUrl(file_url);
      await base44.entities.Wedding.update(wedding.id, { profile_photo: file_url });
      setWedding({ ...wedding, profile_photo: file_url });
    } catch (err) {
      alert('Could not upload photo: ' + (err.message || 'error'));
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      const updated = await base44.entities.Wedding.update(wedding.id, form);
      setWedding(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      alert('Could not save: ' + (err.message || 'error'));
    } finally {
      setSaving(false);
    }
  };

  if (!wedding) return null;

  return (
    <div>
      <PageHeader eyebrow="Account" title="Profile" subtitle="Manage your wedding details and profile photo." />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Photo + tier card */}
        <div className="lg:col-span-1">
          <div className="elegant-card p-6 text-center">
            <div className="relative inline-block">
              {photoUrl ? (
                <img src={photoUrl} alt="Profile" className="w-28 h-28 rounded-full object-cover mx-auto ring-2 ring-border" />
              ) : (
                <div className="w-28 h-28 rounded-full bg-accent flex items-center justify-center mx-auto ring-2 ring-border">
                  <ImageIcon className="w-10 h-10 text-muted-foreground/40" />
                </div>
              )}
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
              </button>
              <input ref={fileRef} type="file" accept="image/*" onChange={onPhotoChange} className="hidden" />
            </div>
            <h2 className="serif-heading text-xl text-foreground mt-4">{wedding.couple_names}</h2>
            <div className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground mt-1">
              <Calendar className="w-3.5 h-3.5" />
              {formatDate(wedding.wedding_date)}
            </div>
            {wedding.venue_name && (
              <div className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground mt-0.5">
                <MapPin className="w-3.5 h-3.5" />
                {wedding.venue_name}
              </div>
            )}
            <div className="soft-divider my-4" />
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Current plan</span>
              <span className="inline-block text-[10px] tracking-widest uppercase px-2 py-0.5 rounded-full bg-accent text-accent-foreground">
                {TIER_LABELS[tier]} Tier
              </span>
            </div>
            <Button asChild variant="outline" size="sm" className="w-full mt-4">
              <Link to="/pricing"><Gem className="w-4 h-4 mr-1.5" /> Manage Plan</Link>
            </Button>
          </div>
        </div>

        {/* Editable details */}
        <div className="lg:col-span-2">
          <div className="elegant-card p-6">
            <h3 className="serif-heading text-lg text-foreground mb-4">Wedding Details</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="couple">Couple names</Label>
                <Input
                  id="couple"
                  value={form.couple_names}
                  onChange={(e) => setForm({ ...form, couple_names: e.target.value })}
                  className="mt-1.5"
                  placeholder="e.g. Jane & John"
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date">Wedding date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={form.wedding_date}
                    onChange={(e) => setForm({ ...form, wedding_date: e.target.value })}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="venue">Venue name</Label>
                  <Input
                    id="venue"
                    value={form.venue_name}
                    onChange={(e) => setForm({ ...form, venue_name: e.target.value })}
                    className="mt-1.5"
                    placeholder="e.g. The Grand Ballroom"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="location">Venue location</Label>
                <Input
                  id="location"
                  value={form.venue_location}
                  onChange={(e) => setForm({ ...form, venue_location: e.target.value })}
                  className="mt-1.5"
                  placeholder="e.g. Napa Valley, CA"
                />
              </div>
            </div>
            <div className="flex items-center gap-3 mt-6">
              <Button onClick={save} disabled={saving} className="bg-primary hover:bg-primary/90">
                {saving ? <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Saving…</> : saved ? <><Check className="w-4 h-4 mr-1.5" /> Saved</> : 'Save changes'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}