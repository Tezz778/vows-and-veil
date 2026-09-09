import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Sparkles, Trash2, Loader2, Bookmark } from 'lucide-react';

const CATEGORY_LABELS = {
  send_off: 'Send-Off', dance: 'Dance', ceremony: 'Ceremony', reception: 'Reception', other: 'Other',
};
const CATEGORY_COLORS = {
  send_off: 'bg-rose-100 text-rose-700', dance: 'bg-violet-100 text-violet-700',
  ceremony: 'bg-amber-100 text-amber-700', reception: 'bg-emerald-100 text-emerald-700', other: 'bg-sky-100 text-sky-700',
};

export default function Ideas() {
  const { wedding } = useOutletContext();
  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [context, setContext] = useState('');

  const load = async () => {
    if (!wedding) return;
    setLoading(true);
    try {
      const list = await base44.entities.MomentIdea.filter({ wedding_id: wedding.id }, '-created_date', 100);
      setIdeas(list || []);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => {
    if (wedding) setContext(wedding.style_notes || '');
    load();
  }, [wedding]);

  if (!wedding) return null;

  const generate = async () => {
    setGenerating(true);
    try {
      const res = await base44.functions.invoke('generateMomentIdeas', {
        context, wedding_type: wedding.wedding_type
      });
      const generated = res?.data?.ideas || res?.ideas || [];
      if (generated.length) {
        const records = generated.map((i) => ({
          wedding_id: wedding.id,
          title: i.title,
          description: i.description,
          category: ['send_off','dance','ceremony','reception','other'].includes(i.category) ? i.category : 'other',
        }));
        const created = await base44.entities.MomentIdea.bulkCreate(records);
        setIdeas((prev) => [...(created || []), ...prev]);
      }
    } catch (e) {
      alert('Could not generate ideas: ' + (e.message || 'error'));
    } finally { setGenerating(false); }
  };

  const remove = async (id) => {
    await base44.entities.MomentIdea.delete(id);
    setIdeas((prev) => prev.filter((i) => i.id !== id));
  };

  return (
    <div>
      <PageHeader eyebrow="Make it memorable" title="Moment Idea Generator"
        subtitle="Unique, non-generic ideas for send-offs, dances, and ceremony traditions — tailored to your style."
      />

      <div className="elegant-card p-5 mb-8">
        <Label htmlFor="ctx">Tell us about your style & vision</Label>
        <Textarea id="ctx" rows={2} className="mt-1.5"
          placeholder="e.g. intimate garden wedding, love live music, want something our guests will always remember…"
          value={context} onChange={(e) => setContext(e.target.value)} />
        <div className="flex items-center justify-between mt-3">
          <p className="text-xs text-muted-foreground">We'll craft six distinctive ideas just for you.</p>
          <Button onClick={generate} disabled={generating} className="bg-primary hover:bg-primary/90">
            {generating ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Sparkles className="w-4 h-4 mr-1" />}
            {generating ? 'Crafting ideas…' : 'Generate ideas'}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-muted-foreground">Loading ideas…</div>
      ) : ideas.length === 0 ? (
        <div className="elegant-card p-12 text-center">
          <Sparkles className="w-10 h-10 text-muted-foreground/30 mx-auto mb-4" />
          <p className="serif-heading text-xl text-foreground">No ideas yet</p>
          <p className="text-sm text-muted-foreground mt-1">Describe your vibe above and generate your first set.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {ideas.map((idea) => (
            <div key={idea.id} className="elegant-card p-5 group">
              <div className="flex items-start justify-between gap-3 mb-2">
                <span className={`text-[10px] tracking-widest uppercase px-2 py-0.5 rounded-full ${CATEGORY_COLORS[idea.category] || CATEGORY_COLORS.other}`}>
                  {CATEGORY_LABELS[idea.category] || 'Other'}
                </span>
                <button onClick={() => remove(idea.id)} className="p-1 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-secondary text-muted-foreground hover:text-destructive transition-all">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <h3 className="serif-heading text-lg text-foreground leading-snug">{idea.title}</h3>
              <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{idea.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}