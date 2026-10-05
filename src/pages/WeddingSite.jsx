import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { formatDate } from '@/lib/wedding';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Heart, MapPin, Calendar, Check, Loader2, ExternalLink } from 'lucide-react';
import { Image } from '@/components/ui/image';

const DEFAULT_MEAL_OPTIONS = ['Beef', 'Chicken', 'Fish', 'Vegetarian', 'Vegan'];

function safeHref(url) {
  if (!url || typeof url !== 'string') return null;
  try {
    const parsed = new URL(url.trim());
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? url.trim() : null;
  } catch { return null; }
}

function parseMealOptions(raw) {
  if (!raw || typeof raw !== 'string') return DEFAULT_MEAL_OPTIONS;
  const opts = raw.split('\n').map((s) => s.trim()).filter(Boolean);
  return opts.length ? opts : DEFAULT_MEAL_OPTIONS;
}

export default function WeddingSite() {
  const { slug } = useParams();
  const [wedding, setWedding] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [guestToken, setGuestToken] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setGuestToken(params.get('guest') || '');
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await base44.functions.invoke('getWeddingSite', { slug });
        const data = res?.data ?? res;
        if (data?.error) { setNotFound(true); }
        else { setWedding(data); }
      } catch {
        setNotFound(true);
      } finally { setLoading(false); }
    })();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  if (notFound || !wedding) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-6 text-center">
        <div>
          <Heart className="w-10 h-10 text-primary/40 mx-auto mb-4" />
          <h1 className="serif-heading text-3xl text-foreground mb-2">Wedding not found</h1>
          <p className="text-muted-foreground">This wedding site isn't available yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <header className="relative overflow-hidden min-h-[60vh] flex items-center justify-center">
        {wedding.site_hero_image ? (
          <>
            <div className="absolute inset-0">
              <img src={wedding.site_hero_image} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="absolute inset-0 bg-black/45" />
          </>
        ) : (
          <>
            <div className="absolute inset-0 bg-gradient-to-b from-accent/60 via-background to-background" />
            <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[40rem] h-[40rem] rounded-full bg-primary/5 blur-3xl" />
          </>
        )}
        <div className="relative max-w-3xl mx-auto px-6 pt-20 pb-16 sm:pt-24 sm:pb-20 text-center">
          <p className={`text-[11px] tracking-[0.35em] uppercase mb-5 ${wedding.site_hero_image ? 'text-white/85' : 'text-muted-foreground'}`}>We're getting married</p>
          <h1 className={`serif-heading text-5xl sm:text-7xl leading-tight mb-6 ${wedding.site_hero_image ? 'text-white' : 'text-primary'}`}>
            {wedding.couple_names || 'Our Wedding'}
          </h1>
          <div className={`flex flex-wrap items-center justify-center gap-x-6 gap-y-2 ${wedding.site_hero_image ? 'text-white/90' : 'text-muted-foreground'}`}>
            <span className="flex items-center gap-2"><Calendar className="w-4 h-4" /> {formatDate(wedding.wedding_date)}</span>
            {wedding.venue_name && <span className="flex items-center gap-2"><MapPin className="w-4 h-4" /> {wedding.venue_name}{wedding.venue_location ? `, ${wedding.venue_location}` : ''}</span>}
          </div>
          {wedding.site_message && (
            <p className={`mt-6 text-lg font-display italic leading-relaxed max-w-xl mx-auto ${wedding.site_hero_image ? 'text-white/95' : 'text-foreground/80'}`}>
              {wedding.site_message}
            </p>
          )}
          <HeroCountdown weddingDate={wedding.wedding_date} hasImage={!!wedding.site_hero_image} />
        </div>
      </header>

      {/* Details */}
      <section className="max-w-3xl mx-auto px-6 pb-10">
        <div className="elegant-card p-6 sm:p-10">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
            <Detail label="The Date" value={formatDate(wedding.wedding_date)} />
            <Detail label="The Venue" value={wedding.venue_name || 'To be announced'} />
            <Detail label="Location" value={wedding.venue_location || 'To be announced'} />
          </div>
          {wedding.style_notes && (
            <>
              <div className="soft-divider my-8" />
              <p className="text-center text-lg font-display text-foreground/80 italic leading-relaxed max-w-xl mx-auto">
                {wedding.style_notes}
              </p>
            </>
          )}
        </div>
      </section>

      {/* Our Story */}
      {wedding.site_story && (
        <section className="max-w-2xl mx-auto px-6 pb-16">
          <div className="text-center">
            <p className="text-[11px] tracking-[0.3em] uppercase text-muted-foreground mb-3">Our Story</p>
            <p className="text-lg font-display text-foreground/85 leading-relaxed whitespace-pre-line">{wedding.site_story}</p>
          </div>
        </section>
      )}

      {/* Gallery */}
      {Array.isArray(wedding.site_photos) && wedding.site_photos.length > 0 && (
        <section className="max-w-4xl mx-auto px-6 pb-16">
          <p className="text-[11px] tracking-[0.3em] uppercase text-muted-foreground mb-6 text-center">Moments</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
            {wedding.site_photos.map((p, i) => (
              <figure key={i} className="rounded-xl overflow-hidden">
                <div className="aspect-square">
                  <Image src={p.url} alt={p.caption || ''} fittingType="fill" className="w-full h-full" />
                </div>
                {p.caption && <figcaption className="text-xs text-muted-foreground text-center mt-2">{p.caption}</figcaption>}
              </figure>
            ))}
          </div>
        </section>
      )}

      {/* Custom sections */}
      {Array.isArray(wedding.site_sections) && wedding.site_sections.map((s, i) => (
        (s.title || s.body || s.image) ? (
          <section key={i} className="max-w-2xl mx-auto px-6 pb-16">
            <div className="elegant-card p-6 sm:p-10">
               {s.image && (
                <div className="rounded-xl overflow-hidden mb-6 -mx-2 sm:-mx-4">
                  <div className="aspect-[16/9]">
                    <Image src={s.image} alt={s.title || ''} fittingType="fill" className="w-full h-full" />
                  </div>
                </div>
              )}
              {s.title && <h2 className="serif-heading text-2xl text-foreground text-center mb-4">{s.title}</h2>}
              {s.body && <p className="text-foreground/80 leading-relaxed whitespace-pre-line text-center">{s.body}</p>}
            </div>
          </section>
        ) : null
      ))}

      {/* Registry */}
      {Array.isArray(wedding.site_registry) && wedding.site_registry.some((r) => r.store_name || r.url) && (
        <section className="max-w-2xl mx-auto px-6 pb-16">
          <p className="text-[11px] tracking-[0.3em] uppercase text-muted-foreground mb-6 text-center">Registry</p>
          <div className="elegant-card p-6 sm:p-10">
            <div className="grid gap-3">
              {wedding.site_registry.map((r, i) => (
                (r.store_name || r.url) ? (
                  <div key={i} className="flex items-center justify-between gap-3 py-3 border-b border-border last:border-0">
                    <div>
                      <p className="serif-heading text-lg text-foreground">{r.store_name || 'Registry'}</p>
                      {r.description && <p className="text-sm text-muted-foreground mt-0.5">{r.description}</p>}
                    </div>
                    {(() => { const safe = safeHref(r.url); return safe ? (
                      <a href={safe} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline shrink-0">
                        Visit <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    ) : null; })()}
                  </div>
                ) : null
              ))}
            </div>
          </div>
        </section>
      )}

      {/* RSVP */}
      <section className="max-w-3xl mx-auto px-6 pb-24">
        <RSVPForm slug={slug} guestToken={guestToken} rsvpSecret={wedding.site_rsvp_secret || ''} isDestination={wedding.wedding_type === 'destination'} mealOptions={parseMealOptions(wedding.site_meal_options)} />
      </section>

      <footer className="text-center pb-10 text-xs text-muted-foreground/70">
        Made with <Heart className="w-3 h-3 inline text-primary" /> on Vows & Veil
      </footer>
    </div>
  );
}

function getRemaining(dateStr) {
  if (!dateStr) return null;
  const target = new Date(dateStr + 'T00:00:00');
  if (isNaN(target)) return null;
  const total = target - new Date();
  if (total <= 0) return { total: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };
  return {
    total,
    days: Math.floor(total / 86400000),
    hours: Math.floor((total % 86400000) / 3600000),
    minutes: Math.floor((total % 3600000) / 60000),
    seconds: Math.floor((total % 60000) / 1000),
  };
}

function HeroCountdown({ weddingDate, hasImage }) {
  const [remaining, setRemaining] = useState(getRemaining(weddingDate));
  useEffect(() => {
    const id = setInterval(() => setRemaining(getRemaining(weddingDate)), 1000);
    return () => clearInterval(id);
  }, [weddingDate]);
  if (!remaining || remaining.total <= 0) return null;
  const numTone = hasImage ? 'text-white' : 'text-primary';
  const labelTone = hasImage ? 'text-white/80' : 'text-muted-foreground';
  const units = [['Days', remaining.days], ['Hours', remaining.hours], ['Minutes', remaining.minutes], ['Seconds', remaining.seconds]];
  return (
    <div className="mt-8 flex items-center justify-center gap-3 sm:gap-6">
      {units.map(([label, val]) => (
        <div key={label} className="text-center">
          <p className={`serif-heading text-3xl sm:text-4xl leading-none ${numTone}`}>{String(val).padStart(2, '0')}</p>
          <p className={`text-[10px] tracking-[0.2em] uppercase mt-1 ${labelTone}`}>{label}</p>
        </div>
      ))}
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div>
      <p className="text-[10px] tracking-[0.25em] uppercase text-muted-foreground mb-1.5">{label}</p>
      <p className="serif-heading text-lg text-foreground">{value}</p>
    </div>
  );
}

function RSVPForm({ slug, guestToken, rsvpSecret, isDestination, mealOptions }) {
  const [name, setName] = useState('');
  const [rsvp, setRsvp] = useState('');
  const [plus, setPlus] = useState(0);
  const [contact, setContact] = useState('');
  const [travel, setTravel] = useState(false);
  const [accom, setAccom] = useState('');
  const [arrival, setArrival] = useState('');
  const [meal, setMeal] = useState('');
  const [mealNotes, setMealNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (!name.trim()) { setError('Please enter your name'); return; }
    if (!rsvp) { setError('Please let us know if you can make it'); return; }
    setSubmitting(true); setError('');
    try {
      const res = await base44.functions.invoke('submitRSVP', {
        slug, name: name.trim(), rsvp_status: rsvp,
        plus_ones: Number(plus) || 0, contact: contact.trim(),
        travel_needed: travel, accommodation: accom.trim(), arrival_date: arrival || null,
        meal_choice: meal, meal_notes: mealNotes.trim(),
        guest_token: guestToken || '',
        rsvp_secret: rsvpSecret || '',
      });
      const data = res?.data ?? res;
      if (data?.error) setError(data.error);
      else setDone(true);
    } catch (e) {
      setError(e.message || 'Something went wrong. Please try again.');
    } finally { setSubmitting(false); }
  };

  if (done) {
    return (
      <div className="elegant-card p-6 sm:p-10 text-center">
        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-5">
          <Check className="w-7 h-7 text-primary" />
        </div>
        <h2 className="serif-heading text-3xl text-foreground mb-2">Thank you!</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          {rsvp === 'yes'
            ? "We can't wait to celebrate with you. We've received your RSVP."
            : "We'll miss you, but thank you for letting us know."}
        </p>
      </div>
    );
  }

  return (
    <div className="elegant-card p-6 sm:p-10">
      <p className="text-[11px] tracking-[0.3em] uppercase text-muted-foreground text-center mb-2">Will you join us?</p>
      <h2 className="serif-heading text-3xl text-foreground text-center mb-6">RSVP</h2>

      <div className="space-y-5 max-w-md mx-auto">
        <div>
          <Label htmlFor="rsvp-name">Your name</Label>
          <Input id="rsvp-name" value={name} onChange={(e) => setName(e.target.value)} className="mt-1.5" placeholder="Full name" />
        </div>

        <div>
          <Label>Can you make it?</Label>
          <div className="grid grid-cols-2 gap-3 mt-1.5">
            <button type="button" onClick={() => setRsvp('yes')}
              className={`h-11 rounded-lg border text-sm font-medium transition-colors ${rsvp === 'yes' ? 'bg-primary text-primary-foreground border-primary' : 'border-input hover:bg-accent'}`}>
              Joyfully accepts
            </button>
            <button type="button" onClick={() => setRsvp('no')}
              className={`h-11 rounded-lg border text-sm font-medium transition-colors ${rsvp === 'no' ? 'bg-primary text-primary-foreground border-primary' : 'border-input hover:bg-accent'}`}>
              Regretfully declines
            </button>
          </div>
        </div>

        {rsvp === 'yes' && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="rsvp-plus">Plus ones</Label>
                <Input id="rsvp-plus" type="number" min="0" max="5" value={plus} onChange={(e) => setPlus(e.target.value)} className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="rsvp-contact">Contact (optional)</Label>
                <Input id="rsvp-contact" value={contact} onChange={(e) => setContact(e.target.value)} className="mt-1.5" placeholder="Email or phone" />
              </div>
            </div>

            {/* Meal choice */}
            <div>
              <Label>Meal choice</Label>
              <div className="grid grid-cols-2 gap-2 mt-1.5">
                {(mealOptions || DEFAULT_MEAL_OPTIONS).map((opt) => (
                  <button key={opt} type="button" onClick={() => setMeal(opt)}
                    className={`h-10 rounded-lg border text-sm font-medium transition-colors text-left px-3 ${meal === opt ? 'bg-primary text-primary-foreground border-primary' : 'border-input hover:bg-accent'}`}>
                    {opt}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="rsvp-meal-notes">Dietary notes (optional)</Label>
              <Input id="rsvp-meal-notes" value={mealNotes} onChange={(e) => setMealNotes(e.target.value)} className="mt-1.5" placeholder="Allergies, restrictions, etc." />
            </div>

            {isDestination && (
              <div className="rounded-xl border border-border p-4 space-y-3 bg-secondary/30">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={travel} onChange={(e) => setTravel(e.target.checked)} className="w-4 h-4 accent-[hsl(var(--primary))]" />
                  I'll be traveling to the wedding
                </label>
                {travel && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="rsvp-arrival">Arrival date</Label>
                      <Input id="rsvp-arrival" type="date" value={arrival} onChange={(e) => setArrival(e.target.value)} className="mt-1.5" />
                    </div>
                    <div>
                      <Label htmlFor="rsvp-accom">Accommodation</Label>
                      <Input id="rsvp-accom" value={accom} onChange={(e) => setAccom(e.target.value)} className="mt-1.5" placeholder="Hotel / address" />
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {error && <p className="text-sm text-destructive text-center">{error}</p>}

        <Button onClick={submit} disabled={submitting} className="w-full h-11 bg-primary hover:bg-primary/90 text-base">
          {submitting ? 'Sending…' : 'Send RSVP'}
        </Button>
      </div>
    </div>
  );
}