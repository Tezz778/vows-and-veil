import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, ExternalLink } from 'lucide-react';

function isSafeUrl(url) {
  if (!url || typeof url !== 'string') return false;
  try {
    const parsed = new URL(url.trim());
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch { return false; }
}

export default function SiteRegistryEditor({ wedding, setWedding }) {
  const items = Array.isArray(wedding.site_registry) ? wedding.site_registry : [];

  const save = async (next) => {
    try {
      await base44.entities.Wedding.update(wedding.id, { site_registry: next });
      setWedding({ ...wedding, site_registry: next });
    } catch (e) {
      alert('Could not save: ' + (e.message || 'error'));
    }
  };

  const add = () => save([...items, { store_name: '', url: '', description: '' }]);
  const remove = (i) => save(items.filter((_, idx) => idx !== i));

  const commit = (i, field, value) => {
    if (field === 'url' && value && !isSafeUrl(value)) {
      alert('Only http:// and https:// links are allowed.');
      return;
    }
    save(items.map((it, idx) => (idx === i ? { ...it, [field]: value } : it)));
  };

  return (
    <div className="elegant-card p-6">
      <h3 className="serif-heading text-xl text-foreground mb-1">Registry</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Add the stores where you're registered so guests can find your wish lists.
      </p>

      {items.map((it, i) => (
        <div key={i} className="rounded-xl border border-border p-4 mb-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Registry {i + 1}</span>
            <button onClick={() => remove(i)} className="text-muted-foreground hover:text-destructive">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          <Input
            key={`n-${i}-${it.store_name}`}
            defaultValue={it.store_name}
            onBlur={(e) => commit(i, 'store_name', e.target.value)}
            placeholder="Store name (e.g. Amazon, Crate & Barrel)"
            className="mb-2"
          />
          <Input
            key={`u-${i}-${it.url}`}
            defaultValue={it.url}
            onBlur={(e) => commit(i, 'url', e.target.value)}
            placeholder="https://…"
            className="mb-2"
          />
          <Input
            key={`d-${i}-${it.description}`}
            defaultValue={it.description}
            onBlur={(e) => commit(i, 'description', e.target.value)}
            placeholder="Short note (optional)"
          />
        </div>
      ))}

      <Button variant="outline" onClick={add} className="w-full">
        <Plus className="w-4 h-4 mr-1.5" /> Add registry
      </Button>
    </div>
  );
}