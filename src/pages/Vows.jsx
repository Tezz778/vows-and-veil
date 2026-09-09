import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, Heart, Save, Loader2 } from 'lucide-react';

const QUESTIONS = [
  'How did the two of you meet? What stood out about that first encounter?',
  'What is a specific memory that makes you laugh every time you think of it?',
  'When did you realize this was the person you wanted to build a life with?',
  'What do you most admire about your partner — a quality others might miss?',
  'What is something your partner does, big or small, that makes you feel loved?',
  'What promise do you most want to make for the life ahead of you both?',
  'Is there a shared dream or adventure you can\'t wait to begin together?',
];

export default function Vows() {
  const { wedding } = useOutletContext();
  const [draft, setDraft] = useState(null);
  const [answers, setAnswers] = useState({});
  const [p1, setP1] = useState('');
  const [p2, setP2] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [draftText, setDraftText] = useState('');

  const load = async () => {
    if (!wedding) return;
    setLoading(true);
    try {
      const list = await base44.entities.VowDraft.filter({ wedding_id: wedding.id }, '-created_date', 1);
      if (list && list.length) {
        setDraft(list[0]);
        setAnswers(list[0].answers || {});
        setP1(list[0].partner1_name || '');
        setP2(list[0].partner2_name || '');
        setDraftText(list[0].draft_text || '');
      } else {
        const names = (wedding.couple_names || '').split(/[&+,]/).map((s) => s.trim()).filter(Boolean);
        setP1(names[0] || '');
        setP2(names[1] || '');
      }
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [wedding]);
  if (!wedding) return null;

  const saveAnswers = async () => {
    setSaving(true);
    try {
      const payload = { wedding_id: wedding.id, partner1_name: p1, partner2_name: p2, answers, draft_text: draftText };
      if (draft) {
        await base44.entities.VowDraft.update(draft.id, payload);
      } else {
        const created = await base44.entities.VowDraft.create(payload);
        setDraft(created);
      }
    } catch (e) {
      alert('Could not save: ' + (e.message || 'error'));
    } finally { setSaving(false); }
  };

  const generateDraft = async () => {
    setGenerating(true);
    try {
      const res = await base44.functions.invoke('buildVowDraft', {
        partner1_name: p1, partner2_name: p2, answers
      });
      const text = res?.data?.draft_text || res?.draft_text || '';
      setDraftText(text);
      if (draft) {
        await base44.entities.VowDraft.update(draft.id, { draft_text: text });
      }
    } catch (e) {
      alert('Could not generate draft: ' + (e.message || 'error'));
    } finally { setGenerating(false); }
  };

  return (
    <div>
      <PageHeader eyebrow="From the heart" title="Vow Writing Companion"
        subtitle="Guided questions to surface your story — you write the vows, we help organize them."
      >
        <Button onClick={saveAnswers} variant="outline" disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />} Save
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Questions */}
        <div>
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div>
              <Label htmlFor="p1">Partner one</Label>
              <Input id="p1" value={p1} onChange={(e) => setP1(e.target.value)} className="mt-1.5" placeholder="Name" />
            </div>
            <div>
              <Label htmlFor="p2">Partner two</Label>
              <Input id="p2" value={p2} onChange={(e) => setP2(e.target.value)} className="mt-1.5" placeholder="Name" />
            </div>
          </div>

          <div className="space-y-4">
            {QUESTIONS.map((q, i) => (
              <div key={i} className="elegant-card p-4">
                <div className="flex items-start gap-2.5 mb-2">
                  <Heart className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <p className="text-sm font-medium text-foreground">{q}</p>
                </div>
                <Textarea rows={3} placeholder="Write freely — this is just for the two of you…"
                  value={answers[q] || ''} onChange={(e) => setAnswers((a) => ({ ...a, [q]: e.target.value }))} />
              </div>
            ))}
          </div>
        </div>

        {/* Draft */}
        <div>
          <div className="elegant-card p-5 sticky top-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="serif-heading text-xl text-foreground">Your structured draft</h2>
              <Button onClick={generateDraft} disabled={generating} size="sm" className="bg-primary hover:bg-primary/90">
                {generating ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Sparkles className="w-4 h-4 mr-1" />}
                {generating ? 'Organizing…' : 'Organize draft'}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              We organize your answers into a scaffold of sections — you shape it into your own voice. This is a starting point, not finished vows.
            </p>
            {draftText ? (
              <Textarea rows={20} value={draftText} onChange={(e) => setDraftText(e.target.value)} className="font-body leading-relaxed" />
            ) : (
              <div className="text-center py-16 border border-dashed border-border rounded-xl">
                <Sparkles className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Answer a few questions, then tap “Organize draft”.</p>
                <p className="text-xs text-muted-foreground/70 mt-1">You can edit the result freely.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}