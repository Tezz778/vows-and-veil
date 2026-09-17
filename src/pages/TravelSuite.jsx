import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import PageHeader from '@/components/PageHeader';
import FeatureGate from '@/components/FeatureGate';
import { hasFeature } from '@/lib/wedding';
import { Hotel, MapPin, Gift, ClipboardCheck, CloudRain } from 'lucide-react';
import HotelsFlights from '@/components/travel/HotelsFlights';
import GuestItinerary from '@/components/travel/GuestItinerary';
import WelcomeBags from '@/components/travel/WelcomeBags';
import PackingDocs from '@/components/travel/PackingDocs';
import WeatherBackup from '@/components/travel/WeatherBackup';

const TABS = [
  { key: 'hotels', label: 'Hotels & Flights', icon: Hotel },
  { key: 'itinerary', label: 'Guest Itinerary', icon: MapPin },
  { key: 'welcome', label: 'Welcome Bags', icon: Gift },
  { key: 'packing', label: 'Packing & Docs', icon: ClipboardCheck },
  { key: 'weather', label: 'Weather & Backup', icon: CloudRain },
];

export default function TravelSuite() {
  const { wedding, tier } = useOutletContext();
  const [active, setActive] = useState('hotels');

  if (!wedding) return null;
  if (!hasFeature(tier, 'travel')) return <FeatureGate feature="travel" tierLabel="Destination" />;

  return (
    <div>
      <PageHeader eyebrow="Destination" title="Travel Suite"
        subtitle="Everything for a far-from-home celebration — stays, flights, guest itinerary, welcome bags, travel docs, and a weather backup plan, all in one place."
      />
      <div className="flex gap-2 mb-8 overflow-x-auto pb-1">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button key={t.key} onClick={() => setActive(t.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm whitespace-nowrap transition-colors ${
                active === t.key ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:bg-accent'
              }`}>
              <Icon className="w-3.5 h-3.5" /> {t.label}
            </button>
          );
        })}
      </div>

      {active === 'hotels' && <HotelsFlights weddingId={wedding.id} />}
      {active === 'itinerary' && <GuestItinerary weddingId={wedding.id} />}
      {active === 'welcome' && <WelcomeBags weddingId={wedding.id} />}
      {active === 'packing' && <PackingDocs weddingId={wedding.id} />}
      {active === 'weather' && <WeatherBackup weddingId={wedding.id} />}
    </div>
  );
}