import { useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Image } from '@/components/ui/image';
import { Upload, Trash2, Loader2 } from 'lucide-react';

export default function InspirationPhotos({ photos, onChange }) {
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const handleFiles = async (files) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      const uploaded = [];
      for (const file of Array.from(files).slice(0, 8)) {
        const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
        uploaded.push({ url: file_url, caption: '' });
      }
      onChange([...photos, ...uploaded]);
    } catch (e) {
      alert('Could not upload photo: ' + (e.message || 'error'));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const updateCaption = (i, caption) => {
    onChange(photos.map((p, idx) => (idx === i ? { ...p, caption } : p)));
  };

  const removePhoto = (i) => {
    onChange(photos.filter((_, idx) => idx !== i));
  };

  return (
    <div className="elegant-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Upload className="w-5 h-5 text-primary" />
          <h2 className="serif-heading text-xl text-foreground">Inspiration Photos</h2>
        </div>
        <Button
          variant="outline"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Uploading…</>
          ) : (
            <><Upload className="w-4 h-4 mr-1" /> Upload photos</>
          )}
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>
      <p className="text-sm text-muted-foreground mb-5">
        Upload images that capture your vision — these alongside your color palette shape your dashboard theme.
      </p>

      {photos.length === 0 ? (
        <div
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-border rounded-xl py-12 text-center cursor-pointer hover:border-primary/50 hover:bg-accent/30 transition-colors"
        >
          <Upload className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Click to upload inspiration photos</p>
          <p className="text-xs text-muted-foreground/60 mt-1">PNG, JPG up to 8 images</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {photos.map((photo, i) => (
            <div key={i} className="group relative rounded-xl overflow-hidden border border-border bg-secondary/20">
              <div className="aspect-square">
                <Image src={photo.url} alt={photo.caption || 'Inspiration'} className="w-full h-full" fittingType="fill" />
              </div>
              <div className="p-2">
                <Input
                  value={photo.caption || ''}
                  onChange={(e) => updateCaption(i, e.target.value)}
                  placeholder="Add caption…"
                  className="h-8 text-xs"
                />
              </div>
              <button
                onClick={() => removePhoto(i)}
                className="absolute top-2 right-2 p-1.5 rounded-lg bg-background/80 backdrop-blur text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}