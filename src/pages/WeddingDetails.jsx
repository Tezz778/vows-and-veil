import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, Save, Palette, Link2 } from 'lucide-react';
import InspirationPhotos from '@/components/InspirationPhotos';

export default function WeddingDetails() {
  const { wedding, setWedding } = useOutletContext();
  const [colors, setColors] = useState([]);
  const [inspirations, setInspirations] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [styleNotes, setStyleNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (wedding) {
      setColors(wedding.wedding_colors || []);
      setInspirations(wedding.pinterest_inspirations || []);
      setPhotos(wedding.inspiration_photos || []);
      setStyleNotes(wedding.style_notes || '');
    }
  }, [wedding]);

  if (!wedding) return null;

  const addColor = () => {
    if (colors.length >= 6) return;
    setColors([...colors, '#D4A5A5']);
  };
  const updateColor = (i, val) => setColors(colors.map((c, idx) => (idx === i ? val : c)));
  const removeColor = (i) => setColors(colors.filter((_, idx) => idx !== i));

  const addInspiration = () => setInspirations([...inspirations, { url: '', description: '' }]);
  const updateInspiration = (i, field, val) => setInspirations(inspirations.map((ins, idx) => (idx === i ? { ...ins, [field]: val } : ins)));
  const removeInspiration = (i) => setInspirations(inspirations.filter((_, idx) => idx !== i));

  const save = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const updated = await base44.entities.Wedding.update(wedding.id, {
        wedding_colors: colors,
        pinterest_inspirations: inspirations.filter((ins) => ins.url.trim()),
        inspiration_photos: photos,
        style_notes: styleNotes.trim(),
      });
      setWedding({ ...wedding, wedding_colors: colors, pinterest_inspirations: inspirations.filter((ins) => ins.url.trim()), inspiration_photos: photos, style_notes: styleNotes.trim() });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      alert('Could not save: ' + (e.message || 'error'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Your Style"
        title="Wedding Details"
        subtitle="Set your colors, gather inspiration, and personalize your planning experience."
      >
        <Button onClick={save} disabled={saving} className="bg-primary hover:bg-primary/90">
          {saving ? <><Save className="w-4 h-4 mr-1" /> Saving…</> : <><Save className="w-4 h-4 mr-1" /> Save changes</>}
        </Button>
      </PageHeader>

      {saved && (
        <div className="elegant-card p-3 mb-6 bg-emerald-50 border-emerald-200">
          <p className="text-sm text-emerald-700 text-center">Your wedding details have been saved. Your dashboard now reflects your colors.</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Colors */}
        <div className="elegant-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Palette className="w-5 h-5 text-primary" />
            <h2 className="serif-heading text-xl text-foreground">Wedding Colors</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-5">Choose up to 6 colors. The first color sets the accent across your dashboard and planning tools.</p>

          <div className="space-y-3">
            {colors.map((color, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="relative">
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => updateColor(i, e.target.value)}
                    className="w-12 h-12 rounded-lg border border-border cursor-pointer p-0.5 bg-transparent"
                  />
                </div>
                <Input
                  value={color}
                  onChange={(e) => updateColor(i, e.target.value)}
                  className="flex-1 font-mono text-sm uppercase"
                  placeholder="#RRGGBB"
                />
                {i === 0 && <span className="text-[10px] tracking-wider uppercase text-primary font-medium whitespace-nowrap">Primary</span>}
                <button onClick={() => removeColor(i)} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-destructive transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {colors.length < 6 && (
            <Button variant="outline" onClick={addColor} className="mt-4 w-full border-dashed">
              <Plus className="w-4 h-4 mr-1" /> Add color
            </Button>
          )}

          {colors.length > 0 && (
            <div className="mt-5 pt-5 border-t border-border/60">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Preview</p>
              <div className="flex gap-2 h-12 rounded-xl overflow-hidden border border-border">
                {colors.map((c, i) => (
                  <div key={i} className="flex-1" style={{ backgroundColor: c }} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Pinterest Inspirations */}
        <div className="elegant-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Link2 className="w-5 h-5 text-primary" />
            <h2 className="serif-heading text-xl text-foreground">Pinterest Inspirations</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-5">Paste links to Pinterest boards or pins that capture your vision.</p>

          <div className="space-y-3">
            {inspirations.map((ins, i) => (
              <div key={i} className="flex flex-col gap-2 p-3 rounded-xl bg-secondary/30">
                <div className="flex items-center gap-2">
                  <Input
                    value={ins.url}
                    onChange={(e) => updateInspiration(i, 'url', e.target.value)}
                    placeholder="https://pinterest.com/pin/…"
                    className="flex-1 text-sm"
                  />
                  <button onClick={() => removeInspiration(i)} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-destructive transition-colors shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <Input
                  value={ins.description}
                  onChange={(e) => updateInspiration(i, 'description', e.target.value)}
                  placeholder="What inspires you about this? (optional)"
                  className="text-sm"
                />
              </div>
            ))}
          </div>

          {inspirations.length === 0 && (
            <p className="text-sm text-muted-foreground italic text-center py-4">No inspiration links yet.</p>
          )}

          <Button variant="outline" onClick={addInspiration} className="mt-4 w-full border-dashed">
            <Plus className="w-4 h-4 mr-1" /> Add inspiration link
          </Button>
        </div>
      </div>

      {/* Inspiration Photos */}
      <div className="mt-6">
        <InspirationPhotos photos={photos} onChange={setPhotos} />
      </div>

      {/* Style Notes */}
      <div className="elegant-card p-6 mt-6">
        <h2 className="serif-heading text-xl text-foreground mb-2">Style Notes</h2>
        <p className="text-sm text-muted-foreground mb-4">Describe your overall aesthetic, mood, and any details that define your celebration.</p>
        <Textarea
          value={styleNotes}
          onChange={(e) => setStyleNotes(e.target.value)}
          rows={4}
          placeholder="e.g. Romantic garden party with soft blush tones, vintage-inspired details, and natural greenery…"
        />
      </div>
    </div>
  );
}