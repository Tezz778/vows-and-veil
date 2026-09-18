import { Clock } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import SettingsSection from './SettingsSection';
import { saveWeddingSetting, formatTimePref } from '@/lib/settings';

export default function TimeFormatSection() {
  const { wedding, setWedding } = useOutletContext();
  const timeFormat = wedding?.time_format || '12h';

  return (
    <SettingsSection icon={Clock} title="Time Format" description="How times appear across your timeline and schedule.">
      <div className="grid grid-cols-2 gap-3">
        {['12h', '24h'].map((fmt) => {
          const active = timeFormat === fmt;
          return (
            <button
              key={fmt}
              onClick={() => saveWeddingSetting(wedding, setWedding, 'time_format', fmt)}
              className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-colors ${
                active ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground hover:bg-accent/50'
              }`}
            >
              <span className="text-sm font-medium">{fmt === '12h' ? '12-hour' : '24-hour'}</span>
              <span className="text-sm tabular-nums">{formatTimePref('18:30', fmt)}</span>
            </button>
          );
        })}
      </div>
    </SettingsSection>
  );
}