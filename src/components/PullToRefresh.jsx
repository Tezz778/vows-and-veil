import { Loader2, ArrowDown } from 'lucide-react';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';

/**
 * Wraps page content to provide a mobile pull-to-refresh indicator.
 * Pass the data-fetching function as `onRefresh`.
 */
export default function PullToRefresh({ onRefresh, children }) {
  const { pullDistance, refreshing } = usePullToRefresh(onRefresh);
  const show = pullDistance > 0 || refreshing;
  const reached = pullDistance >= 70 || refreshing;

  return (
    <>
      {show && (
        <div
          className="flex items-center justify-center text-primary overflow-hidden transition-[height] duration-150 ease-out"
          style={{ height: Math.max(pullDistance, refreshing ? 70 : 0) }}
        >
          {refreshing ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <ArrowDown className={`w-5 h-5 transition-transform duration-200 ${reached ? 'rotate-180' : ''}`} />
          )}
        </div>
      )}
      {children}
    </>
  );
}