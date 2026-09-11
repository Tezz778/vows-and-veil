import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/PageHeader';
import { Image } from '@/components/ui/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Trash2, Pencil, Palette } from 'lucide-react';

const CATEGORIES = ['decor', 'attire', 'florals', 'venue', 'stationery', 'other'];

export default function MoodBoard() {
  const { wedding } = useOutletContext();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = async () => {
    if (!wedding) return;
    setLoading(true);
    try {
      const list = await base44.entities.MoodBoard.filter({ wedding_id: wedding.id }, '-created_date', 200);
      setItems(list || []);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [wedding]);

  if (!wedding) return null;

  const openAdd = () => { setEditing(null); setDialogOpen(true); };
  const openEdit = (m) => { setEditing(m); setDialogOpen(true); };

  return (
    <div>
      <PageHeader eyebrow="The Vibe" title="Mood Board"
        subtitle="Collect inspiration — images, color palettes, and style notes — into one vision board."
      >
        <Button onClick={openAdd} className="bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-1" /> Add inspiration
        </Button>
      </PageHeader>

      {loading ? (
        <div className="text-center py-16 text-muted-foreground">Loading your mood board…</div>
      ) : items.length === 0 ? (
        <div className="elegant-card p-12 text-center">
          <Palette className="w-10 h-10 text-muted-foreground/30 mx-auto mb-4" />
          <p className="serif-heading text-xl text-foreground">No inspiration yet</p>
          <p className="text-sm text-muted-foreground mt-1 mb-5">Paste an image URL, note your colors, and capture the feeling.</p>
          <Button onClick={openAdd} className="bg-primary hover:bg-primary/90"><Plus className="w-4 h-4 mr-1" /> Add your first piece</Button>
        </div>
      ) : (
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 [column-fill:_balance]">
          {items.map((m) => {
            const colors = (m.color_palette || '').split(/[, ]+/).filter((c) => c.trim());
            return (
              <div key={m.id} className="elegant-card overflow-hidden mb-4 break-inside-avoid group">
                {m.image_url ? (
                  <Image src={m.image_url} fittingType="fill" className="block w-full h-56" />
                ) : (
                  <div className="w-full h-40 flex items-center justify-center bg-secondary">
                    <Palette className="w-8 h-8 text-muted-foreground/30" />
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="serif-heading text-lg text-foreground">{m.title}</h3>
                      <p className="text-[11px] text-muted-foreground uppercase tracking-wider">{m.category}</p>
                    </div>
                    <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(m)} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => base44.entities.MoodBoard.delete(m.id).then(load)} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                  {colors.length > 0 && (
                    <div className="flex gap-1.5 mt-3">
                      {colors.slice(0, 6).map((c, i) => (
                        <span key={i} className="w-7 h-7 rounded-full border border-border/60" style={{ backgroundColor: c.trim() }} title={c.trim()} />
                      ))}
                    </div>
                  )}
                  {m.style_notes && <p className="text-sm text-muted-foreground mt-3 italic">{m.style_notes}</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <MoodDialog open={dialogOpen} onOpenChange={setDialogOpen} wedding={wedding} editing={editing} onSaved={load} />
    </div>
  );
}

function MoodDialog({ open, onOpenChange, wedding, editing, onSaved }) {
  const [title, setTitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [palette, setPalette] = useState('');
  const [notes, setNotes] = useState('');
  const [category, setCategory] = useState('decor');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle(editing?.title || ''); setImageUrl(editing?.image_url || '');
      setPalette(editing?.color_palette || ''); setNotes(editing?.style_notes || '');
      setCategory(editing?.category || 'decor');
    }
  }, [open, editing]);

  const save = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      const payload = {
        wedding_id: wedding.id, title: title.trim(), image_url: imageUrl.trim(),
        color_palette: palette.trim(), style_notes: notes.trim(), category,
      };
      if (editing) await base44.entities.MoodBoard.update(editing.id, payload);
      else await base44.entities.MoodBoard.create(payload);
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
          <DialogTitle className="serif-heading text-2xl">{editing ? 'Edit inspiration' : 'Add inspiration'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div><Label htmlFor="t">Title</Label><Input id="t" placeholder="e.g. Blush tablescape" value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1.5" /></div>
          <div>
            <Label htmlFor="cat">Category</Label>
            <select id="cat" value={category} onChange={(e) => setCategory(e.target.value)} className="mt-1.5 w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div><Label htmlFor="img">Image URL</Label><Input id="img" placeholder="https://…" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className="mt-1.5" /></div>
          {imageUrl && <Image src={imageUrl} fittingType="fill" className="block w-full h-40 rounded-lg" />}
          <div><Label htmlFor="pal">Color palette</Label><Input id="pal" placeholder="#F8E5E0, #C9A66B, #6B5B45" value={palette} onChange={(e) => setPalette(e.target.value)} className="mt-1.5" />
            <p className="text-xs text-muted-foreground mt-1">Comma-separated hex codes or color names.</p>
          </div>
          <div><Label htmlFor="sn">Style notes</Label><Textarea id="sn" rows={2} placeholder="What you love about this…" value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1.5" /></div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} disabled={saving || !title.trim()} className="bg-primary hover:bg-primary/90">{saving ? 'Saving…' : 'Save'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}