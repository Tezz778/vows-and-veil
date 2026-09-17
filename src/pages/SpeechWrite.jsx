import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, Check, Loader2, PenTool, Heart } from 'lucide-react';

const PROMPT_QUESTIONS = [
  'How do you know the couple (or one of them)?',
  'A favorite memory or funny story you keep coming back to.',
  'One thing you admire about them as a couple.',
  'A wish or promise for their future together.',
];

const ROLE_LABELS = {
  best_man: 'Best Man',
  maid_of_honor: 'Maid of Honor',
  father_of_bride: "Father of the Bride",
  mother_of_bride: 'Mother of the Bride',
  parent: 'Parent',
  other: 'Speaker',
};

export default function SpeechWrite() {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [speech, setSpeech] = useState(null);
  const [answers, setAnswers] = useState(['', '', '', '']);
  const [draft, setDraft] = useState('');
  const [saveState, setSaveState] = useState('idle'); // idle | saving | saved
  const [generating, setGenerating] = useState(false);
  const [completed, setCompleted] = useState(false);
  const initRef = useRef(false);
  const saveTimer = useRef(null);

  const invoke = useCallback(async (payload) => {
    const res = await base44.functions.invoke('speech-share', payload);
    return res.data || res;
  }, []);

  // Load speech on mount
  useEffect(() => {
    (async () => {
      try {
        const data = await invoke({ action: 'get', token });
        if (data.error) throw new Error(data.error);
        setSpeech(data);
        const p = data.prompts || {};
        setAnswers(PROMPT_QUESTIONS.map((q) => (p[q] != null ? String(p[q]) : '')));
        setDraft(data.draft_text || '');
        setCompleted(data.share_status === 'completed');
      } catch (e) {
        setError(e.message || 'Could not load speech');
      } finally {
        setLoading(false);
      }
    })();
  }, [token, invoke]);

  // Debounced auto-save
  useEffect(() => {
    if (loading || !speech) return;
    if (!initRef.current) { initRef.current = true; return; }

    if (saveTimer.current) clearTimeout(saveTimer.current);
    setSaveState('saving');
    saveTimer.current = setTimeout(async () => {
      try {
        const promptsObj = {};
        PROMPT_QUESTIONS.forEach((q, i) => { if (answers[i].trim()) promptsObj[q] = answers[i].trim(); });
        await invoke({
          action: 'save',
          token,
          draft_text: draft,
          prompts: promptsObj,
          share_status: completed ? 'completed' : (draft.trim() ? 'in_progress' : 'not_started'),
        });
        setSaveState('saved');
      } catch {
        setSaveState('idle');
      }
    }, 1500);

    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [draft, answers, completed, loading, speech, token, invoke]);

  const generate = async () => {
    setGenerating(true);
    try {
      const promptsObj = {};
      PROMPT_QUESTIONS.forEach((q, i) => { if (answers[i].trim()) promptsObj[q] = answers[i].trim(); });
      const data = await invoke({ action: 'generate', token, prompts: promptsObj });
      if (data.error) throw new Error(data.error);
      setDraft(data.draft_text || '');
      setCompleted(false);
    } catch (e) {
      alert('Could not generate: ' + (e.message || 'error'));
    } finally {
      setGenerating(false);
    }
  };

  const toggleComplete = async () => {
    const newCompleted = !completed;
    setCompleted(newCompleted);
    try {
      const promptsObj = {};
      PROMPT_QUESTIONS.forEach((q, i) => { if (answers[i].trim()) promptsObj[q] = answers[i].trim(); });
      await invoke({
        action: 'save',
        token,
        draft_text: draft,
        prompts: promptsObj,
        share_status: newCompleted ? 'completed' : (draft.trim() ? 'in_progress' : 'not_started'),
      });
    } catch { /* auto-save will retry */ }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-6">
        <div className="text-center max-w-md">
          <Heart className="w-10 h-10 text-muted-foreground/30 mx-auto mb-4" />
          <h1 className="serif-heading text-2xl text-foreground mb-2">{error.includes('revoked') ? 'Link Revoked' : 'Speech Not Found'}</h1>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (!speech) return null;

  const roleLabel = ROLE_LABELS[speech.role] || 'Speaker';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-5 py-4 flex items-center justify-between">
          <div>
            <h1 className="serif-heading text-lg text-primary leading-none">Vows & Veil</h1>
            <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mt-1">Speech Writer</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">For</p>
            <p className="text-sm font-medium text-foreground">{speech.couple_names}</p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-5 py-8">
        {/* Speaker intro */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-accent mb-3">
            <PenTool className="w-6 h-6 text-primary" />
          </div>
          <h2 className="serif-heading text-3xl text-foreground">{speech.speaker_name}</h2>
          <p className="text-sm text-muted-foreground uppercase tracking-wider mt-1">
            {roleLabel}{speech.relationship ? ` · ${speech.relationship}` : ''}
          </p>
        </div>

        {completed && (
          <div className="elegant-card p-4 mb-6 bg-emerald-50 border-emerald-200 flex items-center gap-3">
            <Check className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="text-sm font-medium text-emerald-800">Your speech is marked as complete</p>
              <p className="text-xs text-emerald-600">{speech.couple_names} can see your draft. You can still edit it below.</p>
            </div>
          </div>
        )}

        {/* Guided prompts */}
        <div className="elegant-card p-6 mb-6">
          <h3 className="serif-heading text-lg text-foreground mb-1">Guided Prompts</h3>
          <p className="text-xs text-muted-foreground mb-4">Answer these to give the AI something to work with. Skip any that don't apply.</p>
          <div className="space-y-4">
            {PROMPT_QUESTIONS.map((q, i) => (
              <div key={i}>
                <Label className="text-xs text-muted-foreground">{q}</Label>
                <Textarea
                  rows={2}
                  value={answers[i]}
                  onChange={(e) => setAnswers((a) => a.map((v, j) => (j === i ? e.target.value : v)))}
                  className="mt-1"
                  placeholder="Type your answer…"
                />
              </div>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={generate}
            disabled={generating}
            className="w-full mt-4"
          >
            <Sparkles className="w-3.5 h-3.5 mr-1.5" />
            {generating ? 'Drafting…' : draft ? 'Regenerate draft' : 'Generate draft'}
          </Button>
        </div>

        {/* Draft editor */}
        <div className="elegant-card p-6 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="serif-heading text-lg text-foreground">Your Draft</h3>
            <span className="text-xs text-muted-foreground">
              {saveState === 'saving' ? 'Saving…' : saveState === 'saved' ? 'Saved' : ''}
            </span>
          </div>
          <Textarea
            rows={12}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Your generated draft will appear here — or write your own from the heart. Edit freely to make it yours."
            className="resize-y"
          />
        </div>

        {/* Complete toggle */}
        <div className="flex flex-col items-center gap-3 pb-8">
          <Button
            onClick={toggleComplete}
            variant={completed ? 'outline' : 'default'}
            className={completed ? '' : 'bg-primary hover:bg-primary/90'}
          >
            {completed ? (
              <>Reopen for editing</>
            ) : (
              <><Check className="w-4 h-4 mr-1.5" /> Mark as complete</>
            )}
          </Button>
          <p className="text-xs text-muted-foreground">
            Your work saves automatically. {completed ? 'The couple can see your draft.' : 'Mark complete when you are happy with it.'}
          </p>
        </div>
      </main>
    </div>
  );
}