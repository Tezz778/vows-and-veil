import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/PageHeader';
import FeatureGate from '@/components/FeatureGate';
import { hasFeature } from '@/lib/wedding';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';


import { Globe, Copy, Check, RefreshCw, ExternalLink, Users } from 'lucide-react';
import SiteCustomizer from '@/components/site/SiteCustomizer';

function randomSlug(couple) {
  const base = (couple || 'our-wedding')
    .toLowerCase().replace(/&/g, '-').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'wedding';
  const rand = Math.random().toString(36).slice(2, 7);
  return `${base}-${rand}`;
}

export default function WeddingWebsite() {
  const { wedding, setWedding, tier } = useOutletContext();
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [rsvpCount, setRsvpCount] = useState(0);

  useEffect(() => {
    if (!wedding) return;
    (async () => {
      try {
        const g = await base44.entities.Guest.filter({ wedding_id: wedding.id, invitation_status: 'rsvp_received' }, 'name', 500);
        setRsvpCount((g || []).length);
      } catch {}
    })();
  }, [wedding]);

  if (!wedding) return null;
  if (!hasFeature(tier, 'guests')) return <FeatureGate feature="guests" tierLabel="Multiday" />;

  const slug = wedding.site_slug;
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const siteUrl = slug ? `${origin}/site/${slug}` : '';

  const generateSlug = async () => {
    setSaving(true);
    try {
      const newSlug = randomSlug(wedding.couple_names);
      const res = await base44.functions.invoke('set-wedding-slug', { slug: newSlug });
      const data = res?.data ?? res;
      if (data?.error) {
        alert(data.error);
      } else {
        setWedding({ ...wedding, site_slug: data.slug || newSlug, site_rsvp_secret: data.rsvp_secret });
      }
    } catch (e) { alert('Could not generate link: ' + (e.message || 'error')); }
    finally { setSaving(false); }
  };

  const copyLink = async () => {
    if (!siteUrl) return;
    try {
      await navigator.clipboard.writeText(siteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <div>
      <PageHeader eyebrow="Share with guests" title="Wedding Website"
        subtitle="A public page with your event details and an online RSVP that syncs straight to your guest list."
      />

      {!slug ? (
        <div className="elegant-card p-10 text-center max-w-xl mx-auto">
          <Globe className="w-10 h-10 text-primary/40 mx-auto mb-4" />
          <h2 className="serif-heading text-2xl text-foreground mb-2">Create your wedding site</h2>
          <p className="text-muted-foreground mb-6">
            We'll generate a shareable link your guests can visit to see the details and RSVP online.
          </p>
          <Button onClick={generateSlug} disabled={saving} className="bg-primary hover:bg-primary/90">
            <Globe className="w-4 h-4 mr-1.5" /> {saving ? 'Creating…' : 'Generate my site link'}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Link card */}
            <div className="elegant-card p-6">
              <h3 className="serif-heading text-xl text-foreground mb-1">Your site link</h3>
              <p className="text-sm text-muted-foreground mb-4">Share this with your guests so they can RSVP online.</p>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 min-w-0">
                  <Input readOnly value={siteUrl} className="font-mono text-xs" />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={copyLink}>
                    {copied ? <><Check className="w-4 h-4 mr-1.5" /> Copied</> : <><Copy className="w-4 h-4 mr-1.5" /> Copy</>}
                  </Button>
                  <Button asChild variant="outline">
                    <a href={siteUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4 mr-1.5" /> View
                    </a>
                  </Button>
                </div>
              </div>
              <button onClick={generateSlug} disabled={saving}
                className="mt-3 text-xs text-muted-foreground hover:text-primary inline-flex items-center gap-1">
                <RefreshCw className="w-3 h-3" /> {saving ? 'Regenerating…' : 'Regenerate link'}
              </button>
            </div>

            <SiteCustomizer wedding={wedding} setWedding={setWedding} />
          </div>

          {/* RSVP summary */}
          <div>
            <div className="elegant-card p-6 bg-accent/30">
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-5 h-5 text-primary" />
                <h3 className="serif-heading text-lg text-foreground">Online RSVPs</h3>
              </div>
              <p className="serif-heading text-4xl text-primary leading-none">{rsvpCount}</p>
              <p className="text-sm text-muted-foreground mt-1">guests have RSVP'd via your site</p>
              <div className="soft-divider my-4" />
              <p className="text-xs text-muted-foreground">
                Every online RSVP appears in your <span className="text-foreground font-medium">Guests & Seating</span> list, marked as received.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}