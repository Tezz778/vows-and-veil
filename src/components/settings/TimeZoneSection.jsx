import { useState, useMemo } from 'react';
import { Globe, Search, LocateFixed } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import SettingsSection from './SettingsSection';
import { saveWeddingSetting } from '@/lib/settings';

const COMMON_TIMEZONES = [
  'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'America/Anchorage', 'America/Phoenix', 'America/Toronto', 'America/Vancouver',
  'America/Mexico_City', 'America/Sao_Paulo', 'America/Argentina/Buenos_Aires',
  'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Europe/Madrid', 'Europe/Rome',
  'Europe/Amsterdam', 'Europe/Dublin', 'Europe/Istanbul', 'Europe/Athens',
  'Asia/Tokyo', 'Asia/Shanghai', 'Asia/Singapore', 'Asia/Dubai', 'Asia/Bangkok',
  'Asia/Seoul', 'Asia/Hong_Kong', 'Asia/Kolkata', 'Asia/Tehran',
  'Australia/Sydney', 'Australia/Melbourne', 'Australia/Perth',
  'Pacific/Auckland', 'Pacific/Honolulu',
  'Africa/Cairo', 'Africa/Johannesburg', 'Africa/Lagos',
  'UTC',
];

function tzLabel(tz) {
  try {
    const dtf = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'shortOffset' });
    const parts = dtf.formatToParts(new Date());
    const offset = parts.find((p) => p.type === 'timeZoneName')?.value || '';
    return `${tz.replace(/_/g, ' ')} (${offset})`;
  } catch {
    return tz.replace(/_/g, ' ');
  }
}

export default function TimeZoneSection() {
  const { wedding, setWedding } = useOutletContext();
  const [query, setQuery] = useState('');

  const detected = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      return null;
    }
  }, []);

  const filtered = useMemo(() => {
    const all = Array.from(new Set([...(detected ? [detected] : []), ...COMMON_TIMEZONES]));
    const q = query.toLowerCase();
    return all.filter((tz) => tzLabel(tz).toLowerCase().includes(q)).slice(0, 30);
  }, [query, detected]);

  const current = wedding?.timezone || detected || 'America/New_York';

  return (
    <SettingsSection
      icon={Globe}
      title="Time Zone"
      description="Used for countdowns, reminders, and timeline displays."
      action={
        detected && detected !== current ? (
          <button
            onClick={() => saveWeddingSetting(wedding, setWedding, 'timezone', detected)}
            className="text-xs text-primary hover:underline flex items-center gap-1 shrink-0"
          >
            <LocateFixed className="w-3.5 h-3.5" /> Use detected
          </button>
        ) : null
      }
    >
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search time zones…"
          className="w-full pl-9 pr-3 py-2 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>
      <div className="mt-3 max-h-48 overflow-y-auto space-y-1">
        {filtered.map((tz) => (
          <button
            key={tz}
            onClick={() => saveWeddingSetting(wedding, setWedding, 'timezone', tz)}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
              current === tz ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-accent text-foreground'
            }`}
          >
            {tzLabel(tz)}
          </button>
        ))}
        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground px-3 py-2">No matching time zones.</p>
        )}
      </div>
    </SettingsSection>
  );
}