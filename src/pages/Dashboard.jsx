import { useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useOutletContext } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { daysUntil, formatDate, hasFeature, TIER_LABELS } from '@/lib/wedding';
import PageHeader from '@/components/PageHeader';
import PullToRefresh from '@/components/PullToRefresh';
import BudgetChart from '@/components/BudgetChart';
import VendorDirectory from '@/components/VendorDirectory';
import {
  Calendar, Heart, Sparkles, Users, DollarSign, Camera, Bell,
  ArrowRight, Check, Clock, Briefcase, Palette, UtensilsCrossed, Mic, Wand2, Plane,
  TrendingUp, ChevronRight
} from 'lucide-react';

export default function Dashboard() {
  const { wedding } = useOutletContext();
  const queryClient = useQueryClient();
  const tier = wedding?.selected_tier || wedding?.wedding_type || 'free';

  const { data: reminders = [] } = useQuery({
    queryKey: ['dashboardReminders', wedding?.id],
    queryFn: () => base44.entities.ReminderTask.filter({ wedding_id: wedding.id, done: false }, 'due_date', 10),
    enabled: !!wedding,
  });
  const { data: timelineEvents = [] } = useQuery({
    queryKey: ['dashboardTimeline', wedding?.id],
    queryFn: () => base44.entities.TimelineEvent.filter({ wedding_id: wedding.id }, 'order', 100),
    enabled: !!wedding,
  });
  const { data: budgetItems = [] } = useQuery({
    queryKey: ['dashboardBudget', wedding?.id],
    queryFn: () => base44.entities.BudgetItem.filter({ wedding_id: wedding.id }, 'category', 200),
    enabled: !!wedding && hasFeature(tier, 'budget'),
  });
  const { data: guests = [] } = useQuery({
    queryKey: ['dashboardGuests', wedding?.id],
    queryFn: () => base44.entities.Guest.filter({ wedding_id: wedding.id }, 'name', 500),
    enabled: !!wedding && hasFeature(tier, 'guests'),
  });
  const { data: vows = [] } = useQuery({
    queryKey: ['dashboardVows', wedding?.id],
    queryFn: () => base44.entities.VowDraft.filter({ wedding_id: wedding.id }, '-created_date', 50),
    enabled: !!wedding && hasFeature(tier, 'vows'),
  });

  const dLeft = daysUntil(wedding?.wedding_date);

  const progress = useMemo(() => {
    if (!wedding) return 0;
    const parts = [];
    if (timelineEvents.length > 0) parts.push(Math.min(timelineEvents.length / 5, 1));
    if (budgetItems.length > 0) {
      const actual = budgetItems.reduce((s, i) => s + (Number(i.actual_amount) || 0), 0);
      const paid = budgetItems.reduce((s, i) => s + (Number(i.paid_amount) || 0), 0);
      if (actual > 0) parts.push(Math.min(paid / actual, 1));
    }
    if (guests.length > 0) {
      const responded = guests.filter((g) => g.rsvp_status !== 'pending').length;
      parts.push(responded / guests.length);
    }
    if (vows.length > 0) {
      const withText = vows.filter((v) => v.draft_text && v.draft_text.trim().length > 0).length;
      parts.push(withText / vows.length);
    }
    return parts.length > 0 ? Math.round((parts.reduce((s, p) => s + p, 0) / parts.length) * 100) : 0;
  }, [wedding, timelineEvents, budgetItems, guests, vows]);

  const nextTasks = useMemo(() => {
    const tasks = [];
    reminders.forEach((r) => {
      tasks.push({ title: r.title, daysLeft: daysUntil(r.due_date), path: '/reminders' });
    });
    budgetItems.forEach((b) => {
      const actual = Number(b.actual_amount) || 0;
      const paid = Number(b.paid_amount) || 0;
      if (actual > paid && b.due_date) {
        tasks.push({ title: `${b.category} payment`, daysLeft: daysUntil(b.due_date), path: '/budget' });
      }
    });
    const pendingRsvp = guests.filter((g) => g.rsvp_status === 'pending');
    if (pendingRsvp.length > 0) {
      tasks.push({ title: `${pendingRsvp.length} pending RSVP${pendingRsvp.length > 1 ? 's' : ''}`, daysLeft: null, path: '/rsvp' });
    }
    tasks.sort((a, b) => {
      if (a.daysLeft !== null && b.daysLeft !== null) return a.daysLeft - b.daysLeft;
      if (a.daysLeft !== null) return -1;
      if (b.daysLeft !== null) return 1;
      return 0;
    });
    return tasks.slice(0, 3);
  }, [reminders, budgetItems, guests]);

  if (!wedding) return null;

  const load = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['dashboardReminders', wedding.id] }),
      queryClient.invalidateQueries({ queryKey: ['dashboardTimeline', wedding.id] }),
      queryClient.invalidateQueries({ queryKey: ['dashboardBudget', wedding.id] }),
      queryClient.invalidateQueries({ queryKey: ['dashboardGuests', wedding.id] }),
      queryClient.invalidateQueries({ queryKey: ['dashboardVows', wedding.id] }),
    ]);
  };

  const cards = [
    { label: 'Timeline', icon: Calendar, path: '/timeline', feature: 'timeline', count: timelineEvents.length },
    { label: 'Optimizer', icon: Wand2, path: '/optimizer', feature: 'optimizer' },
    { label: 'Vows', icon: Heart, path: '/vows', feature: 'vows' },
    { label: 'Speeches', icon: Mic, path: '/speeches', feature: 'speeches' },
    { label: 'Moment Ideas', icon: Sparkles, path: '/ideas', feature: 'ideas' },
    { label: 'Mood Board', icon: Palette, path: '/moodboard', feature: 'moodboard' },
    { label: 'Guests & Seating', icon: Users, path: '/guests', feature: 'guests' },
    { label: 'RSVP Tracker', icon: Check, path: '/rsvp', feature: 'guests' },
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

        {/* What's Next hero */}
        <div className="elegant-card p-6 sm:p-10 mb-6 sm:mb-8 relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-accent/40 blur-2xl" />
          <div className="relative">
            <p className="text-[11px] tracking-[0.3em] uppercase text-muted-foreground mb-6">What's Next</p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Countdown + Progress */}
              <div>
                <div className="flex items-end gap-3 sm:gap-4">
                  <span className="serif-heading text-5xl sm:text-7xl text-primary leading-none">
                    {dLeft !== null ? (dLeft < 0 ? 0 : dLeft) : '—'}
                  </span>
                  <span className="text-lg text-muted-foreground mb-2">
                    {dLeft !== null && dLeft >= 0 ? 'days to go' : dLeft < 0 ? 'days since' : ''}
                  </span>
                </div>
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-foreground">Planning progress</p>
                    <p className="serif-heading text-2xl text-primary">{progress}%</p>
                  </div>
                  <div className="h-2.5 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {progress === 0
                      ? 'Start adding timeline events, budget items, and guests to see your progress.'
                      : progress < 50
                      ? "Great start — keep the momentum going."
                      : progress < 100
                      ? "You're well on your way."
                      : "You're ready for the big day."}
                  </p>
                </div>
              </div>

              {/* Top priorities */}
              <div>
                <h3 className="serif-heading text-lg text-foreground mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" /> Top priorities
                </h3>
                {nextTasks.length === 0 ? (
                  <div className="text-center py-8 bg-secondary/30 rounded-xl">
                    <Check className="w-8 h-8 text-emerald-500/50 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">You're all caught up.</p>
                  </div>
                ) : (
                  <ul className="space-y-3">
                    {nextTasks.map((t, i) => (
                      <li key={i}>
                        <Link to={t.path} className="flex items-start gap-3 group">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                              t.daysLeft !== null && t.daysLeft <= 3
                                ? 'bg-primary/10 text-primary'
                                : 'bg-secondary text-muted-foreground'
                            }`}
                          >
                            <Clock className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-foreground truncate">{t.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {t.daysLeft !== null
                                ? t.daysLeft < 0
                                  ? `${Math.abs(t.daysLeft)} days overdue`
                                  : t.daysLeft === 0
                                  ? 'Today'
                                  : `in ${t.daysLeft} days`
                                : 'No due date'}
                            </p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors shrink-0" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
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

          {/* Plan card */}
          <div>
            <div className="elegant-card p-5 bg-accent/30">
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