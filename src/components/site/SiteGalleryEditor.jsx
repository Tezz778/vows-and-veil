import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Image } from '@/components/ui/image';
import { Loader2, ImageIcon, X } from 'lucide-react';

export default function SiteGalleryEditor({ wedding, setWedding }) {
  const photos = Array.isArray(wedding.site_photos) ? wedding.site_photos : [];
  const [uploading, setUploading] = useState(false);

  const save = async (next) => {
    try {
      await base44.entities.Wedding.update(wedding.id, { site_photos: next });
      setWedding({ ...wedding, site_photos: next });
    } catch (e) { alert('Could not save: ' + (e.message || 'error')); }
  };

  const onUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await save([...photos, { url: file_url, caption: '' }]);
    } catch (e) { alert('Upload failed: ' + (e.message || 'error')); }
    finally { setUploading(false); }
    e.target.value = '';
  };

  const remove = (i) => save(photos.filter((_, idx) => idx !== i));

  const saveCaption = (i, caption) => {
    save(photos.map((p, idx) => idx === i ? { ...p, caption } : p));
  };

  return (
    <div className="elegant-card p-6">
      <h3 className="serif-heading text-xl text-foreground mb-1">Photo gallery</h3>
      <p className="text-sm text-muted-foreground mb-4">Add photos guests will love — engagement shots, candids, or preview moments.</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {photos.map((p, i) => (
          <div key={i} className="relative">
            <div className="aspect-square rounded-lg overflow-hidden">
              <Image src={p.url} alt={p.caption || ''} fittingType="fill" className="w-full h-full" />
            </div>
            <button onClick={() => remove(i)}
              aria-label="Remove photo" className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80">
              <X className="w-3.5 h-3.5" />
            </button>
            <Input
              key={p.url}
              defaultValue={p.caption}
              onBlur={(e) => saveCaption(i, e.target.value)}
              placeholder="Caption"
              className="mt-1.5 h-8 text-xs"
            />
          </div>
        ))}
        <label className="aspect-square rounded-lg border-2 border-dashed border-border cursor-pointer hover:bg-accent/40 transition-colors flex flex-col items-center justify-center gap-1.5">
          {uploading ? <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" /> : <ImageIcon className="w-6 h-6 text-muted-foreground" />}
          <span className="text-xs text-muted-foreground">Add photo</span>
          <input type="file" accept="image/*" className="hidden" onChange={onUpload} />
        </label>
      </div>
    </div>
  );
}