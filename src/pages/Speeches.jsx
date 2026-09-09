import { useEffect, useState } from 'react';
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
import { Plus, Trash2, Mic, Loader2, Pencil, Copy } from 'lucide-react';

const ROLES = [
  { value: 'best_man', label: 'Best Man' },
  { value: 'maid_of_honor', label: 'Maid of Honor' },
  { value: 'father_of_bride', label: "Father of the Bride" },
  { value: 'mother_of_bride', label: "Mother of the Bride" },
  { value: 'father_of_groom', label: "Father of the Groom" },
  { value: 'mother_of_groom', label: "Mother of the Groom" },
  { value: 'bride', label: 'Bride' },
  { value: 'groom', label: 'Groom' },
  { value: 'other', label: 'Other' },
];

const TONES = ['heartfelt', 'funny', 'formal', 'sentimental'];
const roleLabel = (v) => ROLES.find((r) => r.value === v)?.label || v;

export default function Speeches() {
  const { wedding, tier } = useOutletContext();
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = async () => {
    if (!wedding) return;
    setLoading(true);
    try {
      const list = await base44.entities.SpeechDraft.filter({ wedding_id: wedding.id }, '-created_date', 50);
      setDrafts(list || []);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [wedding]);

  if (!wedding) return null;
  if (!hasFeature(tier, 'speeches')) return <FeatureGate tierLabel="Multiday" />;

  const openNew = () => { setEditing(null); setDialogOpen(true); };
  const openEdit = (d) => { setEditing(d); setDialogOpen(true); };

  return (
    <div>
      <PageHeader eyebrow="Raise a Glass" title="Speech & Toast Writer"
        subtitle="Guided prompts turn into a ready-to-deliver toast — for the best man, maid of honor, parents, and more."
      >
        <Button onClick={openNew} className="bg-primary hover:bg-primary/90"><Plus className="w-4 h-4 mr-1" /> New speech</Button>
      </PageHeader>

      {loading ? (
        <div className="text-center py-16 text-muted-foreground">Loading speeches…</div>
      ) : drafts.length === 0 ? (
        <div className="elegant-card p-12 text-center">
          <Mic className="w-10 h-10 text-muted-foreground/30 mx-auto mb-4" />
          <p className="serif-heading text-xl text-foreground">No speeches yet</p>
          <p className="text-sm text-muted-foreground mt-1 mb-5">Answer a few prompts and we'll draft a heartfelt toast you can edit and deliver.</p>
          <Button onClick={openNew} className="bg-primary hover:bg-primary/90"><Plus className="w-4 h-4 mr-1" /> Start a speech</Button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-5">
          {drafts.map((d) => (
            <div key={d.id} className="elegant-card p-6 group flex flex-col">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <span className="text-[11px] tracking-widest uppercase text-primary">{roleLabel(d.role)}</span>
                  <h3 className="serif-heading text-lg text-foreground">{d.speaker_name || 'Untitled speaker'}</h3>
                  {d.couple_names && <p className="text-xs text-muted-foreground">For {d.couple_names}</p>}
                </div>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-accent text-accent-foreground capitalize">{d.tone || 'heartfelt'}</span>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-4 whitespace-pre-wrap flex-1">{d.draft_text || 'No draft yet — edit to generate.'}</p>
              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border/60">
                <Button variant="outline" size="sm" onClick={() => openEdit(d)}><Pencil className="w-3.5 h-3.5 mr-1" /> Edit</Button>
                {d.draft_text && (
                  <Button variant="ghost" size="sm" onClick={() => { navigator.clipboard?.writeText(d.draft_text); }}>
                    <Copy className="w-3.5 h-3.5 mr-1" /> Copy
                  </Button>
                )}
                <button onClick={() => base44.entities.SpeechDraft.delete(d.id).then(load)} className="ml-auto p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <SpeechDialog open={dialogOpen} onOpenChange={setDialogOpen} wedding={wedding} editing={editing} onSaved={load} />
    </div>
  );
}

function SpeechDialog({ open, onOpenChange, wedding, editing, onSaved }) {
  const [role, setRole] = useState('best_man');
  const [speakerName, setSpeakerName] = useState('');
  const [coupleNames, setCoupleNames] = useState('');
  const [relationship, setRelationship] = useState('');
  const [tone, setTone] = useState('heartfelt');
  const [anecdotes, setAnecdotes] = useState('');
  const [draft, setDraft] = useState('');
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setRole(editing?.role || 'best_man'); setSpeakerName(editing?.speaker_name || '');
      setCoupleNames(editing?.couple_names || wedding?.couple_names || ''); setRelationship(editing?.relationship || '');
      setTone(editing?.tone || 'heartfelt'); setAnecdotes(editing?.prompts?.anecdotes || ''); setDraft(editing?.draft_text || '');
    }
  }, [open, editing, wedding]);

  const generate = async () => {
    setGenerating(true);
    try {
      const res = await base44.functions.invoke('generateToastSpeech', {
        role, speaker_name: speakerName, couple_names: coupleNames, relationship, tone, anecdotes,
      });
      setDraft(res?.data?.draft_text || '');
    } catch (e) { alert('Could not generate: ' + (e.message || 'error')); }
    finally { setGenerating(false); }
  };

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        wedding_id: wedding.id, role, speaker_name: speakerName.trim(),
        couple_names: coupleNames.trim(), relationship: relationship.trim(), tone,
        prompts: { anecdotes: anecdotes.trim() }, draft_text: draft,
      };
      if (editing) await base44.entities.SpeechDraft.update(editing.id, payload);
      else await base44.entities.SpeechDraft.create(payload);
      onOpenChange(false); onSaved();
    } catch (e) { alert('Could not save: ' + (e.message || 'error')); }
    finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle className="serif-heading text-2xl">{editing ? 'Edit speech' : 'New speech'}</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2 max-h-[70vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="sr">Role</Label>
              <select id="sr" value={role} onChange={(e) => setRole(e.target.value)} className="mt-1.5 w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
                {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
            <div>
              <Label htmlFor="st">Tone</Label>
              <select id="st" value={tone} onChange={(e) => setTone(e.target.value)} className="mt-1.5 w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
                {TONES.map((t) => <option key={t} value={t} className="capitalize">{t}</option>)}
              </select>
            </div>
          </div>
          <div><Label htmlFor="sn">Speaker name</Label><Input id="sn" value={speakerName} onChange={(e) => setSpeakerName(e.target.value)} className="mt-1.5" /></div>
          <div><Label htmlFor="sc">Couple's names</Label><Input id="sc" value={coupleNames} onChange={(e) => setCoupleNames(e.target.value)} className="mt-1.5" /></div>
          <div><Label htmlFor="srel">Your relationship to the couple</Label><Input id="srel" placeholder="e.g. Best man, college roommate" value={relationship} onChange={(e) => setRelationship(e.target.value)} className="mt-1.5" /></div>
          <div><Label htmlFor="san">Memories & anecdotes to include</Label><Textarea id="san" rows={3} placeholder="Share a story or two — the AI will weave them in." value={anecdotes} onChange={(e) => setAnecdotes(e.target.value)} className="mt-1.5" /></div>
          <Button onClick={generate} disabled={generating} variant="outline" className="w-full">
            {generating ? <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Drafting…</> : <><Mic className="w-4 h-4 mr-1.5" /> Generate draft</>}
          </Button>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <Label htmlFor="sd">Draft</Label>
              {draft && <button onClick={() => navigator.clipboard?.writeText(draft)} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"><Copy className="w-3 h-3" /> Copy</button>}
            </div>
            <Textarea id="sd" rows={8} value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Your generated speech will appear here — edit freely." className="font-body" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} disabled={saving} className="bg-primary hover:bg-primary/90">{saving ? 'Saving…' : 'Save speech'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}