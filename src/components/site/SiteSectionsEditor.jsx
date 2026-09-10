import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Image } from '@/components/ui/image';
import { Plus, Trash2, Loader2, ImageIcon, X } from 'lucide-react';

export default function SiteSectionsEditor({ wedding, setWedding }) {
  const sections = Array.isArray(wedding.site_sections) ? wedding.site_sections : [];
  const [uploadingIdx, setUploadingIdx] = useState(null);

  const save = async (next) => {
    try {
      await base44.entities.Wedding.update(wedding.id, { site_sections: next });
      setWedding({ ...wedding, site_sections: next });
    } catch (e) { alert('Could not save: ' + (e.message || 'error')); }
  };

  const add = () => save([...sections, { title: '', body: '', image: '' }]);
  const remove = (i) => save(sections.filter((_, idx) => idx !== i));

  const commit = (i, field, value) => {
    save(sections.map((s, idx) => idx === i ? { ...s, [field]: value } : s));
  };

  const onUpload = async (i, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingIdx(i);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      commit(i, 'image', file_url);
    } catch (err) { alert('Upload failed: ' + (err.message || 'error')); }
    finally { setUploadingIdx(null); }
    e.target.value = '';
  };

  const removeImage = (i) => commit(i, 'image', '');

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

          {/* Image upload */}
          <p className="text-xs font-medium text-foreground mt-3 mb-2">Section image (optional)</p>
          {s.image ? (
            <div className="relative rounded-xl overflow-hidden">
              <div className="aspect-[16/9]">
                <Image src={s.image} alt={s.title || 'Section image'} fittingType="fill" className="w-full h-full" />
              </div>
              <button onClick={() => removeImage(i)}
                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center gap-1.5 h-24 rounded-xl border-2 border-dashed border-border cursor-pointer hover:bg-accent/40 transition-colors">
              {uploadingIdx === i ? <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" /> : <ImageIcon className="w-5 h-5 text-muted-foreground" />}
              <span className="text-xs text-muted-foreground">{uploadingIdx === i ? 'Uploading…' : 'Upload an image'}</span>
              <input type="file" accept="image/*" className="hidden" onChange={(e) => onUpload(i, e)} />
            </label>
          )}
        </div>
      ))}
      <Button variant="outline" onClick={add} className="w-full">
        <Plus className="w-4 h-4 mr-1.5" /> Add section
      </Button>
    </div>
  );
}