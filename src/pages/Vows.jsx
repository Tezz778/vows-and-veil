import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, Heart, Save, Loader2, Lightbulb, X } from 'lucide-react';

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
  const [helpText, setHelpText] = useState('');

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

  const getHelp = async () => {
    setGenerating(true);
    setHelpText('');
    try {
      const res = await base44.functions.invoke('buildVowDraft', {
        partner1_name: p1, partner2_name: p2, answers, draft_text: draftText
      });
      const text = res?.data?.draft_text || res?.draft_text || '';
      setHelpText(text);
    } catch (e) {
      alert('Could not get suggestions: ' + (e.message || 'error'));
    } finally { setGenerating(false); }
  };

  return (
    <div>
      <PageHeader eyebrow="From the heart" title="Vow Writing Companion"
        subtitle="Guided questions and AI assistance — you write the vows, we help when you're stuck."
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

        {/* Writing area + AI help */}
        <div>
          <div className="elegant-card p-5 sticky top-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="serif-heading text-xl text-foreground">Your vows</h2>
              <Button onClick={getHelp} disabled={generating} size="sm" variant="outline">
                {generating ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Lightbulb className="w-4 h-4 mr-1" />}
                {generating ? 'Thinking…' : 'Get writing help'}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Write your vows in your own words. Stuck? Tap "Get writing help" for angles,
              starting points, and prompts — never finished lines.
            </p>
            <Textarea
              rows={18}
              value={draftText}
              onChange={(e) => setDraftText(e.target.value)}
              placeholder="Start writing your vows here… Take your time. There's no wrong way to begin."
              className="font-body leading-relaxed"
            />

            {helpText && (
              <div className="mt-4 p-4 rounded-xl bg-accent/40 border border-border/60 relative">
                <button
                  onClick={() => setHelpText('')}
                  className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
                  aria-label="Dismiss suggestions"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-2 mb-2.5">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-medium text-foreground">Writing suggestions</h3>
                </div>
                <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed pr-6">{helpText}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}