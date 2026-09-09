import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/PageHeader';
import FeatureGate from '@/components/FeatureGate';
import { hasFeature } from '@/lib/wedding';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Trash2, Camera, Share2, Check, Copy } from 'lucide-react';

const CATEGORIES = ['Getting Ready', 'Ceremony', 'Portraits', 'Reception', 'Details', 'Family', 'Other'];

export default function ShotList() {
  const { wedding, tier } = useOutletContext();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState(false);
  const [copied, setCopied] = useState(false);

  const load = async () => {
    if (!wedding) return;
    setLoading(true);
    try {
      const list = await base44.entities.ShotListItem.filter({ wedding_id: wedding.id }, 'category', 200);
      setItems(list || []);
    } catch {} finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [wedding]);
  if (!wedding) return null;
  if (!hasFeature(tier, 'shotlist')) return <FeatureGate tierLabel="Multiday" />;

  const toggle = async (it) => {
    const done = !it.done;
    setItems((prev) => prev.map((x) => (x.id === it.id ? { ...x, done } : x)));
    await base44.entities.ShotListItem.update(it.id, { done });
  };
  const remove = async (id) => {
    await base44.entities.ShotListItem.delete(id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const share = async () => {
    const lines = [
      `Must-Have Shot List — ${wedding.couple_names}`,
      `${wedding.wedding_date} · ${wedding.venue_name || ''}`.trim(),
      '',
      ...items.map((i) => `${i.done ? '[x]' : '[ ]'} ${i.category}: ${i.description}`),
    ];
    const text = lines.join('\n');
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert(text);
    }
  };

  const grouped = CATEGORIES.map((c) => ({ cat: c, items: items.filter((i) => (i.category || 'Other') === c) })).filter((g) => g.items.length);
  const doneCount = items.filter((i) => i.done).length;

  return (
    <div>
      <PageHeader eyebrow="Don't miss a moment" title="Shot List"
        subtitle="Build your must-have shots and share them with your photographer & videographer."
      >
        <Button variant="outline" onClick={share} disabled={items.length === 0}>
          {copied ? <Check className="w-4 h-4 mr-1 text-emerald-600" /> : <Share2 className="w-4 h-4 mr-1" />}
          {copied ? 'Copied!' : 'Share list'}
        </Button>
        <Button onClick={() => setDialog(true)} className="bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-1" /> Add shot
        </Button>
      </PageHeader>

      <div className="elegant-card p-4 mb-6 flex items-center gap-4">
        <div className="flex-1">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>{doneCount} of {items.length} captured</span>
            <span>{items.length ? Math.round((doneCount / items.length) * 100) : 0}%</span>
          </div>
          <div className="h-2 rounded-full bg-secondary overflow-hidden">
            <div className="h-full bg-primary transition-all" style={{ width: `${items.length ? (doneCount / items.length) * 100 : 0}%` }} />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-muted-foreground">Loading…</div>
      ) : items.length === 0 ? (
        <div className="elegant-card p-12 text-center">
          <Camera className="w-10 h-10 text-muted-foreground/30 mx-auto mb-4" />
          <p className="serif-heading text-xl text-foreground">No shots yet</p>
          <p className="text-sm text-muted-foreground mt-1 mb-5">Add must-have moments like first look, vows, grand exit.</p>
          <Button onClick={() => setDialog(true)} className="bg-primary hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-1" /> Add your first shot
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map((g) => (
            <div key={g.cat}>
              <h3 className="serif-heading text-lg text-foreground mb-3">{g.cat}</h3>
              <div className="space-y-2">
                {g.items.map((it) => (
                  <div key={it.id} className="elegant-card p-3 flex items-center gap-3 group">
                    <button onClick={() => toggle(it)}
                      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                        it.done ? 'bg-primary border-primary text-primary-foreground' : 'border-border hover:border-primary'
                      }`}>
                      {it.done && <Check className="w-3 h-3" />}
                    </button>
                    <span className={`flex-1 text-sm ${it.done ? 'line-through text-muted-foreground' : 'text-foreground'}`}>{it.description}</span>
                    <button onClick={() => remove(it.id)} className="p-1 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-secondary text-muted-foreground hover:text-destructive transition-all">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <ShotDialog open={dialog} onOpenChange={setDialog} wedding={wedding} onSaved={() => { setDialog(false); load(); }} />
    </div>
  );
}

function ShotDialog({ open, onOpenChange, wedding, onSaved }) {
  const [desc, setDesc] = useState('');
  const [cat, setCat] = useState('Ceremony');
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (open) { setDesc(''); setCat('Ceremony'); } }, [open]);

  const save = async () => {
    if (!desc.trim()) return;
    setSaving(true);
    try {
      await base44.entities.ShotListItem.create({ wedding_id: wedding.id, description: desc.trim(), category: cat, done: false });
      onSaved();
    } catch (e) { alert('Could not save: ' + (e.message || 'error')); }
    finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle className="serif-heading text-2xl">Add shot</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label htmlFor="d">Description</Label>
            <Input id="d" placeholder="e.g. First look under the oak tree" value={desc} onChange={(e) => setDesc(e.target.value)} className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="c">Category</Label>
            <select id="c" value={cat} onChange={(e) => setCat(e.target.value)} className="mt-1.5 w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} disabled={saving || !desc.trim()} className="bg-primary hover:bg-primary/90">{saving ? 'Saving…' : 'Add'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}