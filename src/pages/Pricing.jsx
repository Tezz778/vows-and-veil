import { useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/PageHeader';
import { TIER_PRICES, TIER_LABELS, TIER_DESCRIPTIONS, TIER_FEATURES } from '@/lib/wedding';
import { Button } from '@/components/ui/button';
import { Check, Sparkles, Crown, Gem } from 'lucide-react';

const FEATURE_LABELS = {
  timeline: 'Timeline builder',
  optimizer: 'AI timeline optimizer',
  vows: 'Vow writing companion',
  speeches: 'Speech & toast generator',
  ideas: 'Moment idea generator',
  moodboard: 'Mood board',
  budget: 'Budget tracker',
  vendors: 'Vendor directory & contracts',
  shotlist: 'Shot list & vendor sharing',
  guests: 'Guest list & seating chart',
  rehearsal: 'Rehearsal dinner planner',
  reminders: 'Countdown & reminders',
  travel: 'Destination Travel Suite',
};

const TIER_RANK = { single_day: 0, multiday: 1, destination: 2 };

const TIERS = [
  { key: 'destination', icon: Crown, badge: 'Full Package', features: TIER_FEATURES.destination },
  { key: 'multiday', icon: Gem, badge: 'Most Popular', features: TIER_FEATURES.multiday },
  { key: 'single_day', icon: Sparkles, badge: 'Starter', features: TIER_FEATURES.single_day },
];

export default function Pricing() {
  const { wedding, setWedding } = useOutletContext();
  const navigate = useNavigate();
  const [selecting, setSelecting] = useState(null);
  const currentTier = wedding?.selected_tier || wedding?.wedding_type || 'single_day';
  const requiredKey = wedding?.wedding_type || 'single_day';
  const requiredRank = TIER_RANK[requiredKey] ?? 0;

  const select = async (key) => {
    if (!wedding) return;
    setSelecting(key);
    try {
      const res = await base44.functions.invoke('create-checkout', { productId: key });
      const redirectUrl = res?.data?.redirectUrl;
      if (redirectUrl) {
        window.location.href = redirectUrl;
      } else {
        alert('Could not start checkout. Please try again.');
        setSelecting(null);
      }
    } catch (e) {
      alert('Could not start checkout: ' + (e.message || 'error'));
      setSelecting(null);
    }
  };

  return (
    <div>
      <PageHeader eyebrow="Choose your experience" title="Plan & Tiers"
        subtitle="One-time purchase — pick the tier that fits your celebration. Upgrade anytime."
      />

      <p className="text-xs text-muted-foreground mb-8 text-center">
        One-time purchase — secure checkout powered by Base44 Payments. Your tier unlocks instantly after payment.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {TIERS.map((t) => {
          const Icon = t.icon;
          const isCurrent = currentTier === t.key;
          const isRequired = t.key === requiredKey;
          const canSelect = (TIER_RANK[t.key] ?? 0) >= requiredRank;
          return (
            <div key={t.key}
              className={`elegant-card p-7 relative flex flex-col ${
                isRequired ? 'ring-2 ring-primary lg:scale-[1.03] lg:-mt-2' : ''
              } ${!canSelect ? 'opacity-60' : ''}`}>
              <span className={`absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] tracking-widest uppercase px-3 py-1 rounded-full whitespace-nowrap ${
                isRequired ? 'bg-primary text-primary-foreground' : 'bg-accent text-accent-foreground'
              }`}>{isRequired ? 'Recommended for your wedding' : t.badge}</span>
              <div className="flex items-center gap-2.5 mb-1">
                <Icon className="w-5 h-5 text-primary" />
                <h3 className="serif-heading text-2xl text-foreground">{TIER_LABELS[t.key]}</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">{TIER_DESCRIPTIONS[t.key]}</p>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="serif-heading text-4xl text-primary">${TIER_PRICES[t.key]}</span>
                <span className="text-sm text-muted-foreground">one-time</span>
              </div>
              <div className="soft-divider my-5" />
              <ul className="space-y-2.5 mb-7 flex-1">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm">
                    <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <span className="text-foreground">{FEATURE_LABELS[f]}</span>
                  </li>
                ))}
              </ul>
              <Button
                onClick={() => select(t.key)}
                disabled={!canSelect || selecting === t.key || (isCurrent && wedding?.has_paid)}
                variant={isCurrent && wedding?.has_paid ? 'outline' : 'default'}
                className={`w-full ${!(isCurrent && wedding?.has_paid) && canSelect ? 'bg-primary hover:bg-primary/90' : ''}`}
              >
                {!canSelect ? `Not enough for a ${TIER_LABELS[requiredKey]} wedding`
                  : isCurrent && wedding?.has_paid ? 'Current plan'
                  : selecting === t.key ? 'Redirecting to checkout…'
                  : `Buy ${TIER_LABELS[t.key]} — $${TIER_PRICES[t.key]}`}
              </Button>
            </div>
          );
        })}
      </div>

      <div className="elegant-card p-5 mt-8 bg-accent/30 text-center">
        <p className="text-sm text-muted-foreground">
          <Sparkles className="w-4 h-4 inline mr-1.5 text-primary" />
          Charm pricing keeps things feeling deliberate, not padded. Your access window follows your wedding date — and recalculates if your date ever changes.
        </p>
      </div>
    </div>
  );
}