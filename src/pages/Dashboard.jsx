import { useCallback, useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { daysUntil, formatDate, hasFeature, TIER_LABELS } from '@/lib/wedding';
import PageHeader from '@/components/PageHeader';
import PullToRefresh from '@/components/PullToRefresh';
import BudgetChart from '@/components/BudgetChart';
import VendorDirectory from '@/components/VendorDirectory';
import {
  Calendar, Heart, Sparkles, Users, DollarSign, Camera, Bell,
  ArrowRight, Check, Clock, Briefcase, Palette, UtensilsCrossed, Mic, Wand2, Plane
} from 'lucide-react';

export default function Dashboard() {
  const { wedding } = useOutletContext();
  const [reminders, setReminders] = useState([]);
  const [timelineCount, setTimelineCount] = useState(0);

  const load = useCallback(async () => {
    if (!wedding) return;
    try {
      const [rems, events] = await Promise.all([
        base44.entities.ReminderTask.filter({ wedding_id: wedding.id, done: false }, 'due_date', 5),
        base44.entities.TimelineEvent.filter({ wedding_id: wedding.id }, 'order', 100),
      ]);
      setReminders(rems || []);
      setTimelineCount((events || []).length);
    } catch {}
  }, [wedding]);

  useEffect(() => { load(); }, [load]);

  if (!wedding) return null;
  const dLeft = daysUntil(wedding.wedding_date);
  const tier = wedding.selected_tier || wedding.wedding_type;

  const cards = [
    { label: 'Timeline', icon: Calendar, path: '/timeline', feature: 'timeline', count: timelineCount },
    { label: 'Optimizer', icon: Wand2, path: '/optimizer', feature: 'optimizer' },
    { label: 'Vows', icon: Heart, path: '/vows', feature: 'vows' },
    { label: 'Speeches', icon: Mic, path: '/speeches', feature: 'speeches' },
    { label: 'Moment Ideas', icon: Sparkles, path: '/ideas', feature: 'ideas' },
    { label: 'Mood Board', icon: Palette, path: '/moodboard', feature: 'moodboard' },
    { label: 'Guests & Seating', icon: Users, path: '/guests', feature: 'guests' },
    { label: 'Rehearsal', icon: UtensilsCrossed, path: '/rehearsal', feature: 'rehearsal' },
    { label: 'Travel Suite', icon: Plane, path: '/travel', feature: 'travel' },
    { label: 'Budget', icon: DollarSign, path: '/budget', feature: 'budget' },
    { label: 'Vendors', icon: Briefcase, path: '/vendors', feature: 'vendors' },
    { label: 'Shot List', icon: Camera, path: '/shotlist', feature: 'shotlist' },
    { label: 'Reminders', icon: Bell, path: '/reminders', feature: 'reminders', count: reminders.length },
  ].filter((c) => hasFeature(tier, c.feature));

  return (
    <PullToRefresh onRefresh={load}>
    <div>
      <PageHeader
        eyebrow="Welcome"
        title={wedding.couple_names || 'Your celebration'}
        subtitle={`${formatDate(wedding.wedding_date)} · ${wedding.venue_name || 'Venue to be confirmed'}${wedding.venue_location ? ', ' + wedding.venue_location : ''}`}
      />

      {/* Countdown hero */}
      <div className="elegant-card p-6 sm:p-12 mb-6 sm:mb-8 relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-accent/40 blur-2xl" />
        <div className="relative">
          <p className="text-[11px] tracking-[0.3em] uppercase text-muted-foreground mb-3">Counting down to forever</p>
          <div className="flex items-end gap-3 sm:gap-4">
            <span className="serif-heading text-5xl sm:text-7xl text-primary leading-none">
              {dLeft !== null ? (dLeft < 0 ? 0 : dLeft) : '—'}
            </span>
            <span className="text-lg text-muted-foreground mb-2">{dLeft !== null && dLeft >= 0 ? 'days to go' : dLeft < 0 ? 'days since' : ''}</span>
          </div>
          <p className="text-muted-foreground mt-4 max-w-md">
            {dLeft > 0 ? "Every day brings your day closer. Let's make each one count." :
             dLeft === 0 ? "Today's the day — soak it all in." :
             dLeft < 0 ? "Your day has come and gone — relive the memories." :
             'Set your wedding date to start the countdown.'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Feature cards */}
        <div className="lg:col-span-2">
          <h2 className="serif-heading text-xl text-foreground mb-4">Your planning tools</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
            {cards.map((c) => {
              const Icon = c.icon;
              return (
                <Link key={c.path} to={c.path}
                  className="elegant-card p-4 sm:p-5 hover:shadow-md transition-shadow group">
                  <Icon className="w-5 h-5 text-primary mb-3" />
                  <p className="text-sm font-medium text-foreground">{c.label}</p>
                  {c.count !== undefined && (
                    <p className="text-xs text-muted-foreground mt-0.5">{c.count} {c.count === 1 ? 'item' : 'items'}</p>
                  )}
                  <ArrowRight className="w-4 h-4 text-muted-foreground/40 mt-3 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                </Link>
              );
            })}
          </div>
        </div>

        {/* Reminders sidebar */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="serif-heading text-xl text-foreground">Upcoming</h2>
            {hasFeature(tier, 'reminders') && (
              <Link to="/reminders" className="text-xs text-primary hover:underline">View all</Link>
            )}
          </div>
          <div className="elegant-card p-5">
            {reminders.length === 0 ? (
              <div className="text-center py-8">
                <Bell className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No pending reminders.</p>
                <p className="text-xs text-muted-foreground/70 mt-1">You're all caught up.</p>
              </div>
            ) : (
              <ul className="space-y-3">
                {reminders.map((r) => {
                  const d = daysUntil(r.due_date);
                  return (
                    <li key={r.id} className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                        d !== null && d <= 3 ? 'bg-primary/10 text-primary' : 'bg-secondary text-muted-foreground'
                      }`}>
                        <Clock className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{r.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {d !== null ? (d < 0 ? `${Math.abs(d)} days overdue` : d === 0 ? 'Today' : `in ${d} days`) : formatDate(r.due_date)}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="elegant-card p-5 mt-4 bg-accent/30">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Current plan</p>
            <p className="serif-heading text-lg text-primary">{TIER_LABELS[tier]} Tier</p>
            <Link to="/pricing" className="text-xs text-primary hover:underline mt-1 inline-block">Compare tiers & upgrade →</Link>
          </div>
        </div>
      </div>

      {hasFeature(tier, 'vendors') && <VendorDirectory />}

      {hasFeature(tier, 'budget') && <BudgetChart wedding={wedding} />}
    </div>
    </PullToRefresh>
  );
}