import { useOutletContext } from 'react-router-dom';
import PageHeader from '@/components/PageHeader';
import FeatureGate from '@/components/FeatureGate';
import { hasFeature } from '@/lib/wedding';
import RehearsalSchedule from '@/components/rehearsal/RehearsalSchedule';
import RehearsalGuestList from '@/components/rehearsal/RehearsalGuestList';
import RehearsalToasts from '@/components/rehearsal/RehearsalToasts';
import RehearsalBudget from '@/components/rehearsal/RehearsalBudget';

export default function Rehearsal() {
  const { wedding, tier } = useOutletContext();
  if (!wedding) return null;
  if (!hasFeature(tier, 'rehearsal')) return <FeatureGate tierLabel="Multiday" />;

  return (
    <div>
      <PageHeader eyebrow="The Night Before" title="Rehearsal Dinner"
        subtitle="A separate plan for the rehearsal — venue, schedule, guests, toasts, and budget that syncs to your timeline."
      />
      <RehearsalSchedule weddingId={wedding.id} />
      <div className="soft-divider my-8" />
      <RehearsalGuestList weddingId={wedding.id} />
      <div className="soft-divider my-8" />
      <RehearsalToasts weddingId={wedding.id} />
      <div className="soft-divider my-8" />
      <RehearsalBudget weddingId={wedding.id} />
    </div>
  );
}