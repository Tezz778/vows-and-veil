import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2 } from 'lucide-react';

export default function SiteSectionsEditor({ wedding, setWedding }) {
  const sections = Array.isArray(wedding.site_sections) ? wedding.site_sections : [];

  const save = async (next) => {
    try {
      await base44.entities.Wedding.update(wedding.id, { site_sections: next });
      setWedding({ ...wedding, site_sections: next });
    } catch (e) { alert('Could not save: ' + (e.message || 'error')); }
  };

  const add = () => save([...sections, { title: '', body: '' }]);
  const remove = (i) => save(sections.filter((_, idx) => idx !== i));

  const commit = (i, field, value) => {
    save(sections.map((s, idx) => idx === i ? { ...s, [field]: value } : s));
  };

  return (
    <div className="elegant-card p-6">
      <h3 className="serif-heading text-xl text-foreground mb-1">Custom sections</h3>
      <p className="text-sm text-muted-foreground mb-4">Add your own sections — travel tips, dress code, registry, schedule, or anything else guests should know.</p>
      {sections.map((s, i) => (
        <div key={i} className="rounded-xl border border-border p-4 mb-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Section {i + 1}</span>
            <button onClick={() => remove(i)} className="text-muted-foreground hover:text-destructive">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          <Input
            key={`t-${i}-${s.title}`}
            defaultValue={s.title}
            onBlur={(e) => commit(i, 'title', e.target.value)}
            placeholder="Section title (e.g. Travel & Accommodation)"
            className="mb-2"
          />
          <Textarea
            key={`b-${i}-${s.body}`}
            defaultValue={s.body}
            onBlur={(e) => commit(i, 'body', e.target.value)}
            rows={3}
            placeholder="Section content…"
          />
        </div>
      ))}
      <Button variant="outline" onClick={add} className="w-full">
        <Plus className="w-4 h-4 mr-1.5" /> Add section
      </Button>
    </div>
  );
}