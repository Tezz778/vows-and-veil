import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Image } from '@/components/ui/image';
import { formatDate } from '@/lib/wedding';
import { Loader2, ImageIcon, X, Calendar, MapPin, Save } from 'lucide-react';

export default function SiteHeroEditor({ wedding, setWedding }) {
  const [hero, setHero] = useState(wedding.site_hero_image || '');
  const [message, setMessage] = useState(wedding.site_message || '');
  const [saving, setSaving] = useState('');
  const [uploading, setUploading] = useState(false);

  const uploadFile = async (file) => {
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      return file_url;
    } catch (e) {
      alert('Upload failed: ' + (e.message || 'error'));
      return null;
    } finally { setUploading(false); }
  };

  const saveField = async (field, value) => {
    setSaving(field);
    try {
      await base44.entities.Wedding.update(wedding.id, { [field]: value });
      setWedding({ ...wedding, [field]: value });
    } catch (e) { alert('Could not save: ' + (e.message || 'error')); }
    finally { setSaving(''); }
  };

  const onHeroUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadFile(file);
    if (url) { setHero(url); await saveField('site_hero_image', url); }
  };

  const removeHero = async () => {
    setHero('');
    await saveField('site_hero_image', null);
  };

  const saveMessage = async () => {
    await saveField('site_message', message.trim() || null);
  };

  const hasImage = !!hero;

  return (
    <div className="elegant-card p-6">
      <h3 className="serif-heading text-xl text-foreground mb-1">Hero section</h3>
      <p className="text-sm text-muted-foreground mb-5">
        The top of your wedding site. Add a favorite photo of the two of you, your wedding date, and a personal welcome message for guests.
      </p>

      {/* Live preview */}
      <p className="text-xs font-medium text-foreground mb-2">Live preview</p>
      <div className="rounded-xl overflow-hidden border border-border mb-6">
        <div className="relative aspect-[16/9]">
          {hasImage ? (
            <>
              <Image src={hero} alt="Hero preview" fittingType="fill" className="w-full h-full" />
              <div className="absolute inset-0 bg-black/45" />
            </>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-b from-accent/60 via-background to-background flex items-center justify-center">
              <ImageIcon className="w-8 h-8 text-muted-foreground/40" />
            </div>
          )}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
            <p className={`text-[9px] tracking-[0.3em] uppercase mb-2 ${hasImage ? 'text-white/85' : 'text-muted-foreground'}`}>We're getting married</p>
            <h4 className={`serif-heading text-2xl sm:text-3xl leading-tight mb-2 ${hasImage ? 'text-white' : 'text-primary'}`}>
              {wedding.couple_names || 'Our Wedding'}
            </h4>
            <div className={`flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs ${hasImage ? 'text-white/90' : 'text-muted-foreground'}`}>
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {formatDate(wedding.wedding_date)}</span>
              {wedding.venue_name && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {wedding.venue_name}</span>}
            </div>
            {message && (
              <p className={`mt-3 text-sm italic max-w-md leading-relaxed ${hasImage ? 'text-white/95' : 'text-foreground/80'}`}>
                {message}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Photo upload */}
      <p className="text-xs font-medium text-foreground mb-2">Hero photo</p>
      {hasImage ? (
        <div className="relative rounded-xl overflow-hidden mb-5">
          <div className="aspect-[16/9]">
            <Image src={hero} alt="Hero" fittingType="fill" className="w-full h-full" />
          </div>
          <button onClick={removeHero}
            aria-label="Remove hero photo" className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80">
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center gap-2 h-28 rounded-xl border-2 border-dashed border-border cursor-pointer hover:bg-accent/40 transition-colors mb-5">
          {uploading ? <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" /> : <ImageIcon className="w-6 h-6 text-muted-foreground" />}
          <span className="text-sm text-muted-foreground">{uploading ? 'Uploading…' : 'Upload a photo'}</span>
          <input type="file" accept="image/*" className="hidden" onChange={onHeroUpload} />
        </label>
      )}

      {/* Wedding date (read-only display) */}
      <p className="text-xs font-medium text-foreground mb-2">Wedding date</p>
      <div className="flex items-center gap-2 h-10 px-3 rounded-md border border-input bg-secondary/40 text-sm text-muted-foreground mb-5">
        <Calendar className="w-4 h-4 text-primary" />
        {formatDate(wedding.wedding_date) || 'Set your wedding date in onboarding'}
      </div>

      {/* Welcome message */}
      <p className="text-xs font-medium text-foreground mb-2">Welcome message</p>
      <Textarea rows={3} value={message} onChange={(e) => setMessage(e.target.value)}
        placeholder="e.g. We're so excited to celebrate this day with the people we love most…" />
      <p className="text-xs text-muted-foreground mt-1.5">Shown prominently in your hero. Leave blank to hide.</p>
      <div className="mt-3 flex justify-end">
        <Button onClick={saveMessage} disabled={saving === 'site_message'} size="sm" className="bg-primary hover:bg-primary/90">
          <Save className="w-3.5 h-3.5 mr-1.5" /> {saving === 'site_message' ? 'Saving…' : 'Save message'}
        </Button>
      </div>
    </div>
  );
}