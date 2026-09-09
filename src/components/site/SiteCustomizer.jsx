import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Image } from '@/components/ui/image';
import { Loader2, ImageIcon, X } from 'lucide-react';
import SiteGalleryEditor from './SiteGalleryEditor';
import SiteSectionsEditor from './SiteSectionsEditor';

export default function SiteCustomizer({ wedding, setWedding }) {
  const [hero, setHero] = useState(wedding.site_hero_image || '');
  const [story, setStory] = useState(wedding.site_story || '');
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

  return (
    <div className="space-y-6">
      <div className="elegant-card p-6">
        <h3 className="serif-heading text-xl text-foreground mb-1">Hero photo</h3>
        <p className="text-sm text-muted-foreground mb-4">A favorite photo of the couple, shown at the top of your site.</p>
        {hero ? (
          <div className="relative rounded-xl overflow-hidden">
            <div className="aspect-[16/9]">
              <Image src={hero} alt="Hero" fittingType="fill" className="w-full h-full" />
            </div>
            <button onClick={removeHero}
              className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80">
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center gap-2 h-32 rounded-xl border-2 border-dashed border-border cursor-pointer hover:bg-accent/40 transition-colors">
            {uploading ? <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" /> : <ImageIcon className="w-6 h-6 text-muted-foreground" />}
            <span className="text-sm text-muted-foreground">Upload a photo</span>
            <input type="file" accept="image/*" className="hidden" onChange={onHeroUpload} />
          </label>
        )}
      </div>

      <div className="elegant-card p-6">
        <h3 className="serif-heading text-xl text-foreground mb-1">Our story</h3>
        <p className="text-sm text-muted-foreground mb-4">A short section about the two of you — how you met, the proposal, what this day means.</p>
        <Textarea rows={5} value={story} onChange={(e) => setStory(e.target.value)}
          placeholder="We met on a rainy afternoon in October…" />
        <div className="mt-3 flex justify-end">
          <Button onClick={() => saveField('site_story', story.trim() || null)} disabled={saving === 'site_story'} className="bg-primary hover:bg-primary/90">
            {saving === 'site_story' ? 'Saving…' : 'Save story'}
          </Button>
        </div>
      </div>

      <SiteGalleryEditor wedding={wedding} setWedding={setWedding} />
      <SiteSectionsEditor wedding={wedding} setWedding={setWedding} />
    </div>
  );
}