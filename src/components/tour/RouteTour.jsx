import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import PageTour from './PageTour';
import { TOURS } from '@/lib/tours';

export default function RouteTour() {
  const location = useLocation();
  const [active, setActive] = useState(false);

  useEffect(() => {
    const tour = TOURS[location.pathname];
    if (!tour) { setActive(false); return; }
    let seen = false;
    try { seen = !!localStorage.getItem(`everbind_tour_${tour.key}`); } catch {}
    if (seen) { setActive(false); return; }
    const timer = setTimeout(() => setActive(true), 700);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  const tour = TOURS[location.pathname];
  if (!tour || !active) return null;

  return <PageTour tourKey={tour.key} steps={tour.steps} onComplete={() => setActive(false)} />;
}