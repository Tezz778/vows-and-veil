import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import SiteHeroEditor from './SiteHeroEditor';
import SiteGalleryEditor from './SiteGalleryEditor';
import SiteSectionsEditor from './SiteSectionsEditor';
import SiteRegistryEditor from './SiteRegistryEditor';

export default function SiteCustomizer({ wedding, setWedding }) {
  const [story, setStory] = useState(wedding.site_story || '');
  const [saving, setSaving] = useState(false);

  const saveStory = async () => {
    setSaving(true);
    try {
      await base44.entities.Wedding.update(wedding.id, { site_story: story.trim() || null });
      setWedding({ ...wedding, site_story: story.trim() || null });
    } catch (e) { alert('Could not save: ' + (e.message || 'error')); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-6">
      <SiteHeroEditor wedding={wedding} setWedding={setWedding} />

      <div className="elegant-card p-6">
        <h3 className="serif-heading text-xl text-foreground mb-1">Our story</h3>
        <p className="text-sm text-muted-foreground mb-4">A short section about the two of you — how you met, the proposal, what this day means.</p>
        <Textarea rows={5} value={story} onChange={(e) => setStory(e.target.value)}
          placeholder="We met on a rainy afternoon in October…" />
        <div className="mt-3 flex justify-end">
          <Button onClick={saveStory} disabled={saving} className="bg-primary hover:bg-primary/90">
            {saving ? 'Saving…' : 'Save story'}
          </Button>
        </div>
      </div>

      <SiteGalleryEditor wedding={wedding} setWedding={setWedding} />
      <SiteSectionsEditor wedding={wedding} setWedding={setWedding} />
      <SiteRegistryEditor wedding={wedding} setWedding={setWedding} />
    </div>
  );
}