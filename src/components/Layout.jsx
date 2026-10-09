import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { hasFeature, TIER_LABELS, daysUntil, formatDate, hexToHsl, isFreeTier } from '@/lib/wedding';
import {
  LayoutDashboard, Calendar, Heart, Sparkles, Users, DollarSign,
  Camera, Bell, Gem, LogOut, Menu, X, Lock, Globe, ArrowLeft,
  Briefcase, Palette, UtensilsCrossed, Mic, Wand2, Plane, Image as ImageIcon, Mail,
  User, Settings as SettingsIcon, Armchair, UserPlus
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const NAV_SECTIONS = [
  {
    label: null,
    items: [
      { label: 'Dashboard', icon: LayoutDashboard, path: '/', feature: null },
      { label: 'Wedding Details', icon: Palette, path: '/details', feature: null },
      { label: 'Wedding Team', icon: UserPlus, path: '/team', feature: null },
    ],
  },
  {
    label: 'Schedule',
    items: [
      { label: 'Timeline', icon: Calendar, path: '/timeline', feature: 'timeline' },
      { label: 'Timeline Optimizer', icon: Wand2, path: '/optimizer', feature: 'optimizer' },
    ],
  },
  {
    label: 'Words & Moments',
    items: [
      { label: 'Vows', icon: Heart, path: '/vows', feature: 'vows' },
      { label: 'Speeches', icon: Mic, path: '/speeches', feature: 'speeches' },
      { label: 'Moment Ideas', icon: Sparkles, path: '/ideas', feature: 'ideas' },
      { label: 'Mood Board', icon: ImageIcon, path: '/moodboard', feature: 'moodboard' },
    ],
  },
  {
    label: 'Guests & Travel',
    items: [
      { label: 'Guests & Seating', icon: Users, path: '/guests', feature: 'guests' },
      { label: 'Seating Chart', icon: Armchair, path: '/seating', feature: 'guests' },
      { label: 'Rehearsal Dinner', icon: UtensilsCrossed, path: '/rehearsal', feature: 'rehearsal' },
      { label: 'Travel Suite', icon: Plane, path: '/travel', feature: 'travel' },
      { label: 'Wedding Website', icon: Globe, path: '/website', feature: 'guests' },
      { label: 'Email Guests', icon: Mail, path: '/email', feature: null },
    ],
  },
  {
    label: 'Budget & Details',
    items: [
      { label: 'Budget', icon: DollarSign, path: '/budget', feature: 'budget' },
      { label: 'Vendors', icon: Briefcase, path: '/vendors', feature: 'vendors' },
      { label: 'Shot List', icon: Camera, path: '/shotlist', feature: 'shotlist' },
      { label: 'Reminders', icon: Bell, path: '/reminders', feature: 'reminders' },
    ],
  },
  {
    label: null,
    items: [
      { label: 'Profile', icon: User, path: '/profile', feature: null },
      { label: 'Settings', icon: SettingsIcon, path: '/settings', feature: null },
      { label: 'Plan & Tiers', icon: Gem, path: '/pricing', feature: null },
    ],
  },
];

const BOTTOM_TABS = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { label: 'Timeline', icon: Calendar, path: '/timeline' },
  { label: 'Guests', icon: Users, path: '/guests' },
  { label: 'Budget', icon: DollarSign, path: '/budget' },
  { label: 'Settings', icon: SettingsIcon, path: '/settings' },
];

const TAB_GROUPS = {
  '/': ['/', '/details', '/team', '/moodboard', '/vows', '/speeches', '/ideas'],
  '/timeline': ['/timeline', '/optimizer'],
  '/guests': ['/guests', '/seating', '/rehearsal', '/travel', '/website', '/email'],
  '/budget': ['/budget', '/vendors', '/shotlist', '/reminders'],
  '/settings': ['/settings', '/profile', '/pricing'],
};

const ROOT_PATHS = ['/', '/timeline', '/guests', '/budget', '/settings'];

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

  // Track last visited sub-route per tab group for smart tab restoration.
  // Updated during render so the destination is current on this render, not the next.
  const lastVisitedRef = useRef({});
  const currentGroupRoot = Object.keys(TAB_GROUPS).find((root) =>
    TAB_GROUPS[root].includes(location.pathname)
  );
  if (currentGroupRoot && location.pathname !== currentGroupRoot) {
    lastVisitedRef.current[currentGroupRoot] = location.pathname;
  }

  const tier = wedding?.selected_tier || wedding?.wedding_type || 'single_day';
  const dLeft = daysUntil(wedding?.wedding_date);

  // Apply wedding colors to the theme
  const themeStyle = {};
  if (wedding?.wedding_colors?.length) {
    const [h, s, l] = hexToHsl(wedding.wedding_colors[0]) || [346, 44, 30];
    themeStyle['--primary'] = `${h} ${s}% ${l}%`;
    themeStyle['--primary-foreground'] = l > 55 ? '20 18% 12%' : '40 40% 99%';
    themeStyle['--ring'] = `${h} ${s}% ${l}%`;
    themeStyle['--sidebar-primary'] = `${h} ${s}% ${l}%`;
    themeStyle['--sidebar-primary-foreground'] = l > 55 ? '20 18% 12%' : '40 40% 99%';
    themeStyle['--sidebar-ring'] = `${h} ${s}% ${l}%`;
    if (wedding.wedding_colors[1]) {
      const [h2, s2, l2] = hexToHsl(wedding.wedding_colors[1]) || [340, 35, 93];
      themeStyle['--accent'] = `${h2} ${s2}% ${Math.min(l2, 93)}%`;
      themeStyle['--accent-foreground'] = `${h2} ${s2}% ${Math.max(l2 - 25, 15)}%`;
      themeStyle['--sidebar-accent'] = `${h2} ${s2}% ${Math.min(l2, 93)}%`;
      themeStyle['--sidebar-accent-foreground'] = `${h2} ${s2}% ${Math.max(l2 - 25, 15)}%`;
    }
  }

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
    <div className="min-h-screen bg-background flex overscroll-none" style={themeStyle}>
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

        <nav className="flex-1 px-4 overflow-y-auto overscroll-y-contain">
          {NAV_SECTIONS.map((section, si) => (
            <div key={si} className={si > 0 ? 'mt-5' : ''}>
              {section.label && (
                <p className="px-3 mb-1.5 text-[10px] font-medium tracking-[0.18em] uppercase text-muted-foreground/70">{section.label}</p>
              )}
              {section.items.map((item) => {
                const locked = item.feature && !hasFeature(tier, item.feature);
                const active = location.pathname === item.path;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={locked && !isFreeTier(tier) ? '/pricing' : item.path}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm mb-0.5 transition-colors min-h-[44px] select-none ${
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
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <Button variant="ghost" size="sm" onClick={handleLogout} className="w-full justify-start text-muted-foreground hover:text-foreground min-h-[44px] select-none">
            <LogOut className="w-4 h-4 mr-2" /> Sign out
          </Button>
        </div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 bg-black/30 z-30 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <div className="flex-1 min-w-0 flex flex-col overscroll-y-contain">
        <header className="lg:hidden sticky top-0 z-20 bg-background/90 backdrop-blur border-b border-border px-5 py-3 flex items-center justify-between safe-area-top">
          {ROOT_PATHS.includes(location.pathname) ? (
            <button onClick={() => setMobileOpen(true)} aria-label="Open menu" className="p-2 -ml-2 min-h-[44px] flex items-center select-none">
              <Menu className="w-5 h-5" />
            </button>
          ) : (
            <button onClick={() => navigate(-1)} aria-label="Go back" className="p-2 -ml-2 min-h-[44px] flex items-center select-none">
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <span className="serif-heading text-lg text-primary">Vows & Veil</span>
          <div className="w-9" />
        </header>

        <main className="flex-1 px-5 sm:px-8 lg:px-14 py-8 lg:py-12 max-w-6xl w-full mx-auto pb-28 lg:pb-12 overscroll-y-contain">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
          >
            <Outlet context={{ wedding, setWedding, tier }} />
          </motion.div>
        </main>
      </div>

      {/* Mobile bottom tab bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-background/95 backdrop-blur border-t border-border safe-area-bottom">
        <div className="flex items-stretch justify-around">
          {BOTTOM_TABS.map((tab) => {
            const active = (TAB_GROUPS[tab.path] || []).includes(location.pathname);
            const Icon = tab.icon;
            const destination = active ? tab.path : (lastVisitedRef.current[tab.path] || tab.path);
            return (
              <Link
                key={tab.path}
                to={destination}
                aria-label={tab.label}
                className={`flex flex-col items-center justify-center gap-0.5 min-h-[44px] flex-1 py-2 text-[10px] transition-colors select-none ${
                  active ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}