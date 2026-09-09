import { useEffect, useState, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/PageHeader';
import FeatureGate from '@/components/FeatureGate';
import { hasFeature } from '@/lib/wedding';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Image } from '@/components/ui/image';
import { Plus, Trash2, Image as ImageIcon, Palette, StickyNote, Upload, Loader2 } from 'lucide-react';

export default function MoodBoard() {
  const { wedding, tier } = useOutletContext();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogKind, setDialogKind] = useState('image');

  const load = async () => {
    if (!wedding) return;
    setLoading(true);
    try {
      const list = await base44.entities.MoodBoardItem.filter({ wedding_id: wedding.id }, '-created_date', 200);
      setItems(list || []);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [wedding]);

  if (!wedding) return null;
  if (!hasFeature(tier, 'moodboard')) return <FeatureGate tierLabel="Multiday" />;

  const openAdd = (kind) => { setDialogKind(kind); setDialogOpen(true); };
  const remove = async (id) => { await base44.entities.MoodBoardItem.delete(id); load(); };

  const palette = items.filter((i) => i.kind === 'color');
  const notes = items.filter((i) => i.kind === 'note');
  const images = items.filter((i) => i.kind === 'image');

  return (
    <div>
      <PageHeader eyebrow="The Vision" title="Mood Board"
        subtitle="Collect inspiration — images, colors, and style notes — in one visual board."
      >
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => openAdd('image')}><Upload className="w-3.5 h-3.5 mr-1.5" /> Image</Button>
          <Button variant="outline" size="sm" onClick={() => openAdd('color')}><Palette className="w-3.5 h-3.5 mr-1.5" /> Color</Button>
          <Button variant="outline" size="sm" onClick={() => openAdd('note')}><StickyNote className="w-3.5 h-3.5 mr-1.5" /> Note</Button>
        </div>
      </PageHeader>

      {loading ? (
        <div className="text-center py-16 text-muted-foreground">Loading your mood board…</div>
      ) : items.length === 0 ? (
        <div className="elegant-card p-12 text-center">
          <ImageIcon className="w-10 h-10 text-muted-foreground/30 mx-auto mb-4" />
          <p className="serif-heading text-xl text-foreground">Your board is empty</p>
          <p className="text-sm text-muted-foreground mt-1 mb-5">Add inspiration images, a color palette, and style notes to define your wedding's look.</p>
          <Button onClick={() => openAdd('image')} className="bg-primary hover:bg-primary/90"><Plus className="w-4 h-4 mr-1" /> Add inspiration</Button>
        </div>
      ) : (
        <div className="space-y-10">
          {images.length > 0 && (
            <div>
              <h3 className="text-xs tracking-[0.2em] uppercase text-muted-foreground mb-3">Inspiration</h3>
              <div className="columns-2 sm:columns-3 lg:columns-4 gap-4 [column-fill:_balance]">
                {images.map((it) => (
                  <div key={it.id} className="group relative mb-4 break-inside-avoid rounded-2xl overflow-hidden border border-border/70">
                    <Image src={it.content} alt={it.caption || 'mood board image'} className="w-full" fittingType="fill" />
                    {it.caption && <p className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent text-white text-xs px-3 py-2">{it.caption}</p>}
                    <button onClick={() => remove(it.id)} className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/60"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {palette.length > 0 && (
            <div>
              <h3 className="text-xs tracking-[0.2em] uppercase text-muted-foreground mb-3">Color palette</h3>
              <div className="flex flex-wrap gap-4">
                {palette.map((it) => (
                  <div key={it.id} className="group relative">
                    <div className="w-24 h-24 rounded-2xl border border-border/70 shadow-sm" style={{ backgroundColor: it.content }} />
                    <p className="text-xs text-center text-muted-foreground mt-1.5 font-mono">{it.content}</p>
                    {it.caption && <p className="text-[11px] text-center text-muted-foreground">{it.caption}</p>}
                    <button onClick={() => remove(it.id)} className="absolute -top-1 -right-1 p-1 rounded-full bg-background border border-border shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive"><Trash2 className="w-3 h-3" /></button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {notes.length > 0 && (
            <div>
              <h3 className="text-xs tracking-[0.2em] uppercase text-muted-foreground mb-3">Style notes</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {notes.map((it) => (
                  <div key={it.id} className="group relative elegant-card p-5 bg-secondary/40">
                    <StickyNote className="w-4 h-4 text-muted-foreground mb-2" />
                    <p className="text-sm text-foreground whitespace-pre-wrap">{it.content}</p>
                    {it.caption && <p className="text-xs text-muted-foreground mt-2">{it.caption}</p>}
                    <button onClick={() => remove(it.id)} className="absolute top-3 right-3 p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <AddDialog open={dialogOpen} onOpenChange={setDialogOpen} kind={dialogKind} wedding={wedding} onSaved={load} />
    </div>
  );
}

function AddDialog({ open, onOpenChange, kind, wedding, onSaved }) {
  const [content, setContent] = useState('');
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    if (open) { setContent(''); setCaption(''); }
  }, [open, kind]);

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setContent(file_url);
    } catch (err) { alert('Upload failed: ' + (err.message || 'error')); }
    finally { setUploading(false); }
  };

  const save = async () => {
    if (kind === 'color') {
      if (!content) return;
      const hex = content.startsWith('#') ? content : '#' + content;
      await base44.entities.MoodBoardItem.create({ wedding_id: wedding.id, kind: 'color', content: hex, caption: caption.trim() });
    } else if (kind === 'note') {
      if (!content.trim()) return;
      await base44.entities.MoodBoardItem.create({ wedding_id: wedding.id, kind: 'note', content: content.trim(), caption: caption.trim() });
    } else {
      if (!content) return;
      await base44.entities.MoodBoardItem.create({ wedding_id: wedding.id, kind: 'image', content, caption: caption.trim() });
    }
    setSaving(false);
    onOpenChange(false);
    onSaved();
  };

  const title = kind === 'image' ? 'Add inspiration image' : kind === 'color' ? 'Add a color' : 'Add a style note';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle className="serif-heading text-2xl">{title}</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          {kind === 'image' && (
            <div>
              <Label>Image</Label>
              <input ref={fileRef} type="file" accept="image/*" onChange={onFile} className="hidden" />
              <button onClick={() => fileRef.current?.click()} className="mt-1.5 w-full rounded-xl border-2 border-dashed border-border py-8 flex flex-col items-center gap-2 text-muted-foreground hover:bg-secondary/50 transition-colors">
                {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                <span className="text-sm">{uploading ? 'Uploading…' : content ? 'Uploaded ✓ — click to replace' : 'Click to upload an image'}</span>
              </button>
            </div>
          )}
          {kind === 'color' && (
            <div className="flex items-center gap-3">
              <input type="color" value={content || '#d4a5a5'} onChange={(e) => setContent(e.target.value)} className="w-14 h-14 rounded-lg border border-border cursor-pointer" />
              <div className="flex-1"><Label htmlFor="hex">Hex code</Label><Input id="hex" placeholder="#d4a5a5" value={content} onChange={(e) => setContent(e.target.value)} className="mt-1.5 font-mono" /></div>
            </div>
          )}
          {kind === 'note' && (
            <div><Label htmlFor="nc">Note</Label><Textarea id="nc" rows={4} placeholder="e.g. Soft, garden-party feel — lots of greenery, candles, mismatched glassware." value={content} onChange={(e) => setContent(e.target.value)} className="mt-1.5" /></div>
          )}
          <div><Label htmlFor="cap">Caption (optional)</Label><Input id="cap" value={caption} onChange={(e) => setCaption(e.target.value)} className="mt-1.5" /></div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} disabled={uploading || (kind === 'image' && !content) || (kind === 'note' && !content.trim())} className="bg-primary hover:bg-primary/90">{uploading ? 'Uploading…' : 'Add to board'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}