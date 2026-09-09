import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { hasFeature, TIER_LABELS, daysUntil, formatDate } from '@/lib/wedding';
import {
  LayoutDashboard, Calendar, Heart, Sparkles, Users, DollarSign,
  Camera, Bell, Gem, LogOut, Menu, X, Lock, Globe, Briefcase, Palette, Utensils, Mic, Plane, CalendarDays
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const NAV = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/', feature: null },
  { label: 'Timeline', icon: Calendar, path: '/timeline', feature: 'timeline' },
  { label: 'Vows', icon: Heart, path: '/vows', feature: 'vows' },
  { label: 'Speeches', icon: Mic, path: '/speeches', feature: 'speeches' },
  { label: 'Moment Ideas', icon: Sparkles, path: '/ideas', feature: 'ideas' },
  { label: 'Mood Board', icon: Palette, path: '/moodboard', feature: 'moodboard' },
  { label: 'Guests & Seating', icon: Users, path: '/guests', feature: 'guests' },
  { label: 'Wedding Website', icon: Globe, path: '/website', feature: 'guests' },
  { label: 'Rehearsal Dinner', icon: Utensils, path: '/rehearsal', feature: 'rehearsal' },
  { label: 'Travel & Stays', icon: Plane, path: '/travel', feature: 'travel' },
  { label: 'Weekend Itinerary', icon: CalendarDays, path: '/itinerary', feature: 'itinerary' },
  { label: 'Budget', icon: DollarSign, path: '/budget', feature: 'budget' },
  { label: 'Vendors', icon: Briefcase, path: '/vendors', feature: 'vendors' },
  { label: 'Shot List', icon: Camera, path: '/shotlist', feature: 'shotlist' },
  { label: 'Reminders', icon: Bell, path: '/reminders', feature: 'reminders' },
  { label: 'Plan & Tiers', icon: Gem, path: '/pricing', feature: null },
];

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [wedding, setWedding] = useState(undefined);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const list = await base44.entities.Wedding.list('-created_date', 1);
        if (!active) return;
        if (!list || !list.length) {
          navigate('/onboarding', { replace: true });
          return;
        }
        setWedding(list[0]);
      } catch {
        if (active) setWedding(null);
      }
    })();
    return () => { active = false; };
  }, [navigate]);

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const tier = wedding?.selected_tier || wedding?.wedding_type || 'single_day';
  const dLeft = daysUntil(wedding?.wedding_date);

  if (wedding === undefined) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-[3px] border-secondary border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const handleLogout = async () => {
    await base44.auth.logout();
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 z-40 h-screen w-72 shrink-0 bg-sidebar border-r border-sidebar-border flex flex-col transition-transform duration-300 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="px-7 pt-8 pb-6">
          <Link to="/" className="block">
            <h1 className="serif-heading text-2xl text-primary leading-none">Vows & Veil</h1>
            <p className="text-[11px] tracking-[0.25em] uppercase text-muted-foreground mt-2">Wedding Planning</p>
          </Link>
        </div>

        {wedding && (
          <div className="px-7 pb-5">
            <div className="elegant-card p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Countdown</p>
              <p className="serif-heading text-3xl text-primary leading-none">
                {dLeft !== null ? (dLeft < 0 ? 0 : dLeft) : '—'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {dLeft !== null && dLeft >= 0 ? 'days to go' : dLeft < 0 ? 'days passed' : 'set your date'}
              </p>
              <div className="soft-divider my-3" />
              <p className="text-sm font-medium text-foreground truncate">{wedding.couple_names}</p>
              <p className="text-xs text-muted-foreground">{formatDate(wedding.wedding_date)}</p>
              <span className="inline-block mt-2 text-[10px] tracking-widest uppercase px-2 py-0.5 rounded-full bg-accent text-accent-foreground">
                {TIER_LABELS[tier]} Tier
              </span>
            </div>
          </div>
        )}

        <nav className="flex-1 px-4 overflow-y-auto">
          {NAV.map((item) => {
            const locked = item.feature && !hasFeature(tier, item.feature);
            const active = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={locked ? '/pricing' : item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm mb-0.5 transition-colors ${
                  active
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : locked
                    ? 'text-muted-foreground/70 hover:bg-accent/50'
                    : 'text-sidebar-foreground hover:bg-accent'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="flex-1">{item.label}</span>
                {locked && <Lock className="w-3.5 h-3.5 opacity-70" />}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <Button variant="ghost" size="sm" onClick={handleLogout} className="w-full justify-start text-muted-foreground hover:text-foreground">
            <LogOut className="w-4 h-4 mr-2" /> Sign out
          </Button>
        </div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 bg-black/30 z-30 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="lg:hidden sticky top-0 z-20 bg-background/90 backdrop-blur border-b border-border px-5 py-3 flex items-center justify-between">
          <button onClick={() => setMobileOpen(true)} className="p-2 -ml-2">
            <Menu className="w-5 h-5" />
          </button>
          <span className="serif-heading text-lg text-primary">Vows & Veil</span>
          <div className="w-9" />
        </header>

        <main className="flex-1 px-5 sm:px-8 lg:px-14 py-8 lg:py-12 max-w-6xl w-full mx-auto">
          <Outlet context={{ wedding, setWedding, tier }} />
        </main>
      </div>
    </div>
  );
}