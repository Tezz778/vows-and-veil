import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from '@/components/ProtectedRoute';
import Layout from '@/components/Layout';
const Onboarding = lazy(() => import('@/pages/Onboarding'));
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Timeline = lazy(() => import('@/pages/Timeline'));
const Vows = lazy(() => import('@/pages/Vows'));
const Ideas = lazy(() => import('@/pages/Ideas'));
const Guests = lazy(() => import('@/pages/Guests'));
const Budget = lazy(() => import('@/pages/Budget'));
const ShotList = lazy(() => import('@/pages/ShotList'));
const Reminders = lazy(() => import('@/pages/Reminders'));
const Pricing = lazy(() => import('@/pages/Pricing'));
const WeddingWebsite = lazy(() => import('@/pages/WeddingWebsite'));
const WeddingSite = lazy(() => import('@/pages/WeddingSite'));
const Vendors = lazy(() => import('@/pages/Vendors'));
const MoodBoard = lazy(() => import('@/pages/MoodBoard'));
const WeddingDetails = lazy(() => import('@/pages/WeddingDetails'));
const Rehearsal = lazy(() => import('@/pages/Rehearsal'));
const Speeches = lazy(() => import('@/pages/Speeches'));
const SpeechWrite = lazy(() => import('@/pages/SpeechWrite'));
const TimelineOptimizer = lazy(() => import('@/pages/TimelineOptimizer'));
const TravelSuite = lazy(() => import('@/pages/TravelSuite'));
const GmailCompose = lazy(() => import('@/pages/GmailCompose'));
const Login = lazy(() => import('@/pages/Login'));
const Register = lazy(() => import('@/pages/Register'));
const ForgotPassword = lazy(() => import('@/pages/ForgotPassword'));
const ResetPassword = lazy(() => import('@/pages/ResetPassword'));
const OAuthConsent = lazy(() => import('@/pages/OAuthConsent'));
const ThankYou = lazy(() => import('@/pages/ThankYou'));
const Landing = lazy(() => import('@/pages/Landing'));
const About = lazy(() => import('@/pages/About'));
const Contact = lazy(() => import('@/pages/Contact'));
const Profile = lazy(() => import('@/pages/Profile'));
const Settings = lazy(() => import('@/pages/Settings'));
import { useEffect, lazy, Suspense } from 'react';
import { applyTheme, getThemePreference } from '@/lib/theme';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Suspense fallback={<div className="fixed inset-0 flex items-center justify-center"><div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" /></div>}>
    <Routes>
      {/* Public — Authentication */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Public — Marketing */}
      <Route path="/landing" element={<Landing />} />
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />

      {/* Public — Shared access & payment return */}
      <Route path="/oauth/consent" element={<OAuthConsent />} />
      <Route path="/site/:slug" element={<WeddingSite />} />
      <Route path="/speech/:token" element={<SpeechWrite />} />
      {/* PascalCase required: both checkout functions hardcode this exact path as the return URL */}
      <Route path="/ThankYou" element={<ThankYou />} />

      {/* Protected — Pre-dashboard onboarding (no Layout/sidebar) */}
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route path="/onboarding" element={<Onboarding />} />

        {/* Protected — App pages (shared Layout with sidebar) */}
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/timeline" element={<Timeline />} />
          <Route path="/vows" element={<Vows />} />
          <Route path="/ideas" element={<Ideas />} />
          <Route path="/guests" element={<Guests />} />
          <Route path="/budget" element={<Budget />} />
          <Route path="/shotlist" element={<ShotList />} />
          <Route path="/reminders" element={<Reminders />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/website" element={<WeddingWebsite />} />
          <Route path="/vendors" element={<Vendors />} />
          <Route path="/moodboard" element={<MoodBoard />} />
          <Route path="/details" element={<WeddingDetails />} />
          <Route path="/rehearsal" element={<Rehearsal />} />
          <Route path="/speeches" element={<Speeches />} />
          <Route path="/optimizer" element={<TimelineOptimizer />} />
          <Route path="/travel" element={<TravelSuite />} />
          <Route path="/email" element={<GmailCompose />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Route>

      <Route path="*" element={<PageNotFound />} />
    </Routes>
    </Suspense>
  );
};


function App() {
  useEffect(() => {
    const pref = getThemePreference();
    applyTheme(pref);
    if (pref === 'system' && typeof window !== 'undefined') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = () => applyTheme('system');
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }
  }, []);
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App