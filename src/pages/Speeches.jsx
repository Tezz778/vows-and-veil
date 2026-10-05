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
import ActionSheet from '@/components/ui/action-sheet';
import { Plus, Trash2, Pencil, Sparkles, Mic, Link2, Copy, Check, Ban } from 'lucide-react';

const ROLES = [
  { value: 'best_man', label: 'Best Man' },
  { value: 'maid_of_honor', label: 'Maid of Honor' },
  { value: 'father_of_bride', label: "Father of the Bride" },
  { value: 'mother_of_bride', label: 'Mother of the Bride' },
  { value: 'parent', label: 'Parent' },
  { value: 'other', label: 'Other' },
];

const PROMPT_QUESTIONS = [
  'How do you know the couple (or one of them)?',
  'A favorite memory or funny story you keep coming back to.',
  'One thing you admire about them as a couple.',
  'A wish or promise for their future together.',
];

export default function Speeches() {
  const { wedding, tier } = useOutletContext();
  const [speeches, setSpeeches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const load = async () => {
    if (!wedding) return;
    setLoading(true);
    try {
      const list = await base44.entities.Speech.filter({ wedding_id: wedding.id }, '-created_date', 50);
      setSpeeches(list || []);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [wedding]);

  if (!hasFeature(tier, 'speeches')) return <FeatureGate feature="speeches" tierLabel="Multiday" />;
  if (!wedding) return null;

  const openAdd = () => { setEditing(null); setDialogOpen(true); };
  const openEdit = (s) => { setEditing(s); setDialogOpen(true); };

  const generateShareLink = async (s) => {
    const gen = () => (crypto.randomUUID?.() || Math.random().toString(36).slice(2)) + (crypto.randomUUID?.() || Math.random().toString(36).slice(2));
    try {
      await base44.entities.Speech.update(s.id, { share_token: gen(), share_enabled: true, share_status: 'not_started' });
      load();
    } catch (e) { alert('Could not create link: ' + (e.message || 'error')); }
  };

  const revokeShareLink = async (s) => {
    try {
      await base44.entities.Speech.update(s.id, { share_enabled: false });
      load();
    } catch (e) { alert('Could not revoke: ' + (e.message || 'error')); }
  };

  const copyLink = (s) => {
    navigator.clipboard?.writeText(`${window.location.origin}/speech/${s.share_token}`);
    setCopiedId(s.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div>
      <PageHeader eyebrow="The Toasts" title="Speech & Toast Generator"
        subtitle="Guided prompts become a heartfelt, ready-to-read draft for every speaker."
      >
        <Button onClick={openAdd} className="bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-1" /> New speech
        </Button>
      </PageHeader>

      {loading ? (
        <div className="text-center py-16 text-muted-foreground">Loading speeches…</div>
      ) : speeches.length === 0 ? (
        <div className="elegant-card p-12 text-center">
          <Mic className="w-10 h-10 text-muted-foreground/30 mx-auto mb-4" />
          <p className="serif-heading text-xl text-foreground">No speeches yet</p>
          <p className="text-sm text-muted-foreground mt-1 mb-5">Draft a best man, maid of honor, or parent toast with guided prompts.</p>
          <Button onClick={openAdd} className="bg-primary hover:bg-primary/90"><Plus className="w-4 h-4 mr-1" /> Start a speech</Button>
        </div>
      ) : (
        <div className="space-y-4">
          {speeches.map((s) => {
            const roleLabel = ROLES.find((r) => r.value === s.role)?.label || 'Speaker';
            return (
              <div key={s.id} className="elegant-card p-5 group">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="serif-heading text-lg text-foreground">{s.speaker_name}</h3>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mt-0.5">{roleLabel}{s.relationship ? ` · ${s.relationship}` : ''}</p>
                  </div>
                  <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(s)} aria-label="Edit speech" className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={() => base44.entities.Speech.delete(s.id).then(load)} aria-label="Delete speech" className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
                {s.draft_text ? (
                  <p className="text-sm text-muted-foreground mt-3 whitespace-pre-wrap line-clamp-4">{s.draft_text}</p>
                ) : (
                  <p className="text-sm text-muted-foreground/60 mt-3 italic">No draft yet — open to generate.</p>
                )}
                <div className="mt-4 pt-3 border-t border-border/60 flex items-center gap-2 flex-wrap">
                  {s.share_enabled ? (
                    <>
                      <span className={`text-[10px] tracking-wider uppercase px-2 py-0.5 rounded-full ${
                        (s.share_status || 'not_started') === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                        (s.share_status || 'not_started') === 'in_progress' ? 'bg-amber-100 text-amber-700' :
                        'bg-secondary text-muted-foreground'
                      }`}>
                        {(s.share_status || 'not_started').replace('_', ' ')}
                      </span>
                      <span className="text-xs text-muted-foreground truncate max-w-[140px] sm:max-w-[200px]">/speech/{s.share_token?.slice(0, 12)}…</span>
                      <div className="flex items-center gap-1 ml-auto">
                        <button onClick={() => copyLink(s)} aria-label="Copy share link" className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground" title="Copy link">
                          {copiedId === s.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                        <button onClick={() => revokeShareLink(s)} aria-label="Revoke share link" className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-destructive" title="Revoke link">
                          <Ban className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </>
                  ) : (
                    <button onClick={() => generateShareLink(s)} className="ml-auto text-xs text-primary hover:text-primary/80 flex items-center gap-1.5">
                      <Link2 className="w-3.5 h-3.5" /> Share with speaker
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <SpeechDialog open={dialogOpen} onOpenChange={setDialogOpen} wedding={wedding} editing={editing} onSaved={load} />
    </div>
  );
}

function SpeechDialog({ open, onOpenChange, wedding, editing, onSaved }) {
  const [speaker, setSpeaker] = useState('');
  const [role, setRole] = useState('best_man');
  const [relationship, setRelationship] = useState('');
  const [answers, setAnswers] = useState(['', '', '', '']);
  const [draft, setDraft] = useState('');
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setSpeaker(editing?.speaker_name || ''); setRole(editing?.role || 'best_man');
      setRelationship(editing?.relationship || '');
      const p = editing?.prompts || {};
      setAnswers(PROMPT_QUESTIONS.map((q) => (p[q] != null ? String(p[q]) : '')));
      setDraft(editing?.draft_text || '');
    }
  }, [open, editing]);

  const promptsObject = () => {
    const obj = {};
    PROMPT_QUESTIONS.forEach((q, i) => { if (answers[i] && answers[i].trim()) obj[q] = answers[i].trim(); });
    return obj;
  };

  const generate = async () => {
    setGenerating(true);
    try {
      const res = await fetch('/api/functions/generateSpeech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          speaker_name: speaker, role, relationship,
          couple_names: wedding.couple_names,
          prompts: promptsObject(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setDraft(data.draft_text || '');
    } catch (e) {
      alert('Could not generate: ' + (e.message || 'error'));
    } finally { setGenerating(false); }
  };

  const save = async () => {
    if (!speaker.trim()) return;
    setSaving(true);
    try {
      const payload = {
        wedding_id: wedding.id, speaker_name: speaker.trim(), role, relationship: relationship.trim(),
        prompts: promptsObject(), draft_text: draft,
      };
      if (editing) await base44.entities.Speech.update(editing.id, payload);
      else await base44.entities.Speech.create(payload);
      onOpenChange(false);
      onSaved();
    } catch (e) {
      alert('Could not save: ' + (e.message || 'error'));
    } finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="serif-heading text-2xl">{editing ? 'Edit speech' : 'New speech'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div><Label htmlFor="sp">Speaker name</Label><Input id="sp" value={speaker} onChange={(e) => setSpeaker(e.target.value)} className="mt-1.5" /></div>
            <div>
              <Label htmlFor="rl">Role</Label>
              <ActionSheet id="rl" value={role} onChange={setRole} options={ROLES} className="mt-1.5" />
            </div>
          </div>
          <div><Label htmlFor="rs">Relationship to the couple</Label><Input id="rs" placeholder="e.g. College roommate of the groom" value={relationship} onChange={(e) => setRelationship(e.target.value)} className="mt-1.5" /></div>

          <div className="rounded-xl border border-border p-3 space-y-3 bg-secondary/30">
            <p className="text-xs font-medium text-foreground uppercase tracking-wider">Guided prompts</p>
            {PROMPT_QUESTIONS.map((q, i) => (
              <div key={i}>
                <Label className="text-xs text-muted-foreground">{q}</Label>
                <Textarea rows={2} value={answers[i]} onChange={(e) => setAnswers((a) => a.map((v, j) => j === i ? e.target.value : v))} className="mt-1" />
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={generate} disabled={generating || !speaker.trim()} className="w-full">
              <Sparkles className="w-3.5 h-3.5 mr-1.5" /> {generating ? 'Drafting…' : draft ? 'Regenerate draft' : 'Generate draft'}
            </Button>
          </div>

          <div>
            <Label htmlFor="dr">Draft</Label>
            <Textarea id="dr" rows={8} value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Your generated draft will appear here — edit it to make it yours." className="mt-1.5" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} disabled={saving || !speaker.trim()} className="bg-primary hover:bg-primary/90">{saving ? 'Saving…' : 'Save speech'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}