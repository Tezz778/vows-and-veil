import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { computeAccessExpiry, TIER_LABELS, TIER_PRICES, TIER_DESCRIPTIONS } from '@/lib/wedding';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ChevronRight, ChevronLeft, Heart, Check } from 'lucide-react';

const WEDDING_TYPES = [
  { value: 'single_day', label: 'Single Day', desc: 'One beautiful day' },
  { value: 'multiday', label: 'Multiday', desc: 'A weekend of events' },
  { value: 'destination', label: 'Destination', desc: 'Travel celebration' },
];

const PHOTO_OPTIONS = [
  { value: 'photographer', label: 'Photographer' },
  { value: 'videographer', label: 'Videographer' },
  { value: 'both', label: 'Both' },
  { value: 'neither', label: 'Not yet / Neither' },
];

const BUDGET_RANGES = ['Under $10k', '$10k–$25k', '$25k–$50k', '$50k–$75k', '$75k–$100k', '$100k+'];

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    couple_names: '',
    wedding_date: '',
    venue_name: '',
    venue_location: '',
    wedding_type: 'single_day',
    has_planner: false,
    planner_contact: '',
    photographer_status: 'neither',
    guest_count: 0,
    budget_range: '',
    style_notes: '',
  });

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const steps = ['The Couple', 'The Celebration', 'Your Team', 'The Details', 'Your Plan'];

  const canNext = () => {
    if (step === 0) return form.couple_names.trim() && form.wedding_date;
    if (step === 1) return form.venue_name.trim() && form.wedding_type;
    return true;
  };

  const finish = async () => {
    setSaving(true);
    try {
      const payload = {
        ...form,
        guest_count: Number(form.guest_count) || 0,
        selected_tier: 'free',
        access_expires_date: computeAccessExpiry(form.wedding_date),
      };
      await base44.entities.Wedding.create(payload);
      navigate('/', { replace: true });
    } catch (e) {
      alert('Could not save your details: ' + (e.message || 'unknown error'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="px-6 sm:px-10 pt-10 pb-6 text-center">
        <h1 className="serif-heading text-3xl text-primary">Vows & Veil</h1>
        <p className="text-[11px] tracking-[0.25em] uppercase text-muted-foreground mt-2">Let's plan your day</p>
      </header>

      <div className="flex-1 flex items-start justify-center px-5 sm:px-8 pb-12">
        <div className="w-full max-w-xl">
          {/* Stepper */}
          <div className="flex items-center justify-center gap-2 mb-10">
            {steps.map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs transition-colors ${
                  i < step ? 'bg-primary text-primary-foreground' :
                  i === step ? 'bg-primary text-primary-foreground ring-4 ring-accent' :
                  'bg-secondary text-muted-foreground'
                }`}>
                  {i < step ? <Check className="w-3.5 h-3.5" /> : i + 1}
                </div>
                {i < steps.length - 1 && <div className={`w-6 h-px ${i < step ? 'bg-primary' : 'bg-border'}`} />}
              </div>
            ))}
          </div>

          <div className="elegant-card p-7 sm:p-9">
            {step === 0 && (
              <div className="space-y-5">
                <StepTitle icon={Heart} title="Tell us about the couple" />
                <div>
                  <Label htmlFor="couple">Your names</Label>
                  <Input id="couple" placeholder="e.g. Maya & Jordan" value={form.couple_names}
                    onChange={(e) => set('couple_names', e.target.value)} className="mt-1.5" />
                </div>
                <div>
                  <Label htmlFor="date">Wedding date</Label>
                  <Input id="date" type="date" value={form.wedding_date}
                    onChange={(e) => set('wedding_date', e.target.value)} className="mt-1.5" />
                  <p className="text-xs text-muted-foreground mt-1.5">You can change this anytime — life happens, plans shift.</p>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-5">
                <StepTitle icon={Heart} title="About the celebration" />
                <div>
                  <Label htmlFor="venue">Venue name</Label>
                  <Input id="venue" placeholder="e.g. The Rosewood Estate" value={form.venue_name}
                    onChange={(e) => set('venue_name', e.target.value)} className="mt-1.5" />
                </div>
                <div>
                  <Label htmlFor="loc">Location</Label>
                  <Input id="loc" placeholder="City, State or Country" value={form.venue_location}
                    onChange={(e) => set('venue_location', e.target.value)} className="mt-1.5" />
                </div>
                <div>
                  <Label>Wedding type</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-1.5">
                    {WEDDING_TYPES.map((t) => (
                      <button key={t.value} type="button" onClick={() => set('wedding_type', t.value)}
                        className={`text-left p-3 rounded-xl border transition-colors ${
                          form.wedding_type === t.value ? 'border-primary bg-accent' : 'border-border hover:bg-secondary'
                        }`}>
                        <p className="text-sm font-medium">{t.label}</p>
                        <p className="text-xs text-muted-foreground">{t.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5">
                <StepTitle icon={Heart} title="Your vendor team" />
                <div>
                  <Label>Photographer / videographer</Label>
                  <div className="grid grid-cols-2 gap-2 mt-1.5">
                    {PHOTO_OPTIONS.map((o) => (
                      <button key={o.value} type="button" onClick={() => set('photographer_status', o.value)}
                        className={`p-3 rounded-xl border text-sm transition-colors ${
                          form.photographer_status === o.value ? 'border-primary bg-accent' : 'border-border hover:bg-secondary'
                        }`}>{o.label}</button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5">This tunes your timeline's pacing — coordinating both needs slower, deliberate buffers.</p>
                </div>
                <div className="flex items-center gap-3 pt-1">
                  <input id="planner" type="checkbox" checked={form.has_planner}
                    onChange={(e) => set('has_planner', e.target.checked)}
                    className="w-4 h-4 rounded accent-[hsl(var(--primary))]" />
                  <Label htmlFor="planner" className="font-normal cursor-pointer">We have a wedding planner</Label>
                </div>
                {form.has_planner && (
                  <div>
                    <Label htmlFor="pc">Planner contact (optional)</Label>
                    <Input id="pc" placeholder="Name / email / phone" value={form.planner_contact}
                      onChange={(e) => set('planner_contact', e.target.value)} className="mt-1.5" />
                  </div>
                )}
              </div>
            )}

            {step === 3 && (
              <div className="space-y-5">
                <StepTitle icon={Heart} title="A few more details" />
                <div>
                  <Label htmlFor="gc">Estimated guest count</Label>
                  <Input id="gc" type="number" min="0" value={form.guest_count}
                    onChange={(e) => set('guest_count', e.target.value)} className="mt-1.5" />
                </div>
                <div>
                  <Label>Budget range</Label>
                  <div className="flex flex-wrap gap-2 mt-1.5">
                    {BUDGET_RANGES.map((b) => (
                      <button key={b} type="button" onClick={() => set('budget_range', b)}
                        className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                          form.budget_range === b ? 'border-primary bg-accent' : 'border-border hover:bg-secondary'
                        }`}>{b}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label htmlFor="style">Your style & vision (optional)</Label>
                  <Textarea id="style" placeholder="e.g. garden romantic, modern minimalist, boho desert..." rows={3}
                    value={form.style_notes} onChange={(e) => set('style_notes', e.target.value)} className="mt-1.5" />
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-5">
                <StepTitle icon={Heart} title="Your recommended plan" />
                <p className="text-sm text-muted-foreground">
                  Based on your {WEDDING_TYPES.find((t) => t.value === form.wedding_type)?.label.toLowerCase()} wedding, we recommend:
                </p>
                <div className="rounded-2xl border-2 border-primary bg-accent/50 p-5">
                  <div className="flex items-baseline justify-between">
                    <h3 className="serif-heading text-2xl text-primary">{TIER_LABELS[form.wedding_type]} Tier</h3>
                    <span className="serif-heading text-2xl text-foreground">${TIER_PRICES[form.wedding_type]}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{TIER_DESCRIPTIONS[form.wedding_type]}</p>
                  <p className="text-xs text-muted-foreground mt-3">You can explore all tiers and upgrade anytime from the Plan & Tiers page.</p>
                </div>
              </div>
            )}

            {/* Nav buttons */}
            <div className="flex items-center justify-between mt-8 pt-5 border-t border-border">
              <Button variant="ghost" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}
                className="text-muted-foreground">
                <ChevronLeft className="w-4 h-4 mr-1" /> Back
              </Button>
              {step < 4 ? (
                <Button onClick={() => setStep((s) => s + 1)} disabled={!canNext()} className="bg-primary hover:bg-primary/90">
                  Continue <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              ) : (
                <Button onClick={finish} disabled={saving} className="bg-primary hover:bg-primary/90">
                  {saving ? 'Saving...' : 'Start planning'} <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StepTitle({ icon: Icon, title }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center">
        <Icon className="w-4 h-4 text-accent-foreground" />
      </div>
      <h2 className="serif-heading text-2xl text-foreground">{title}</h2>
    </div>
  );
}