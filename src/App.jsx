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
import Onboarding from '@/pages/Onboarding';
import Dashboard from '@/pages/Dashboard';
import Timeline from '@/pages/Timeline';
import Vows from '@/pages/Vows';
import Ideas from '@/pages/Ideas';
import Guests from '@/pages/Guests';
import Budget from '@/pages/Budget';
import ShotList from '@/pages/ShotList';
import Reminders from '@/pages/Reminders';
import Pricing from '@/pages/Pricing';
import WeddingWebsite from '@/pages/WeddingWebsite';
import WeddingSite from '@/pages/WeddingSite';
import Vendors from '@/pages/Vendors';
import MoodBoard from '@/pages/MoodBoard';
import Rehearsal from '@/pages/Rehearsal';
import Speeches from '@/pages/Speeches';
import TimelineOptimizer from '@/pages/TimelineOptimizer';
import TravelSuite from '@/pages/TravelSuite';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import ThankYou from '@/pages/ThankYou';

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
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/site/:slug" element={<WeddingSite />} />
      <Route path="/ThankYou" element={<ThankYou />} />
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route path="/onboarding" element={<Onboarding />} />
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
          <Route path="/rehearsal" element={<Rehearsal />} />
          <Route path="/speeches" element={<Speeches />} />
          <Route path="/optimizer" element={<TimelineOptimizer />} />
          <Route path="/travel" element={<TravelSuite />} />
        </Route>
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {
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