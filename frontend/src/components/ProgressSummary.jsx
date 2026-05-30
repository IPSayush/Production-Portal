import { getProgressStats, formatUnits } from '../utils/progressUtils';

function ProgressBarTrack({ percent }) {
  return (
    <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
      <div
        className="bg-slate-600 h-1.5 rounded-full transition-none"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

export function ProgressSummaryFull({ targetQuantity, achievedQuantity }) {
  const { target, achieved, remaining, percent, targetReached } = getProgressStats(
    targetQuantity,
    achievedQuantity
  );

  if (target <= 0) return null;

  return (
    <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 shadow-sm">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span>🎯 Target: {formatUnits(target)}</span>
        <span className="text-slate-300 hidden sm:inline">|</span>
        <span>✅ Done: {formatUnits(achieved)}</span>
        <span className="text-slate-300 hidden sm:inline">|</span>
        {targetReached ? (
          <span className="text-green-600 font-medium">✅ Target Reached!</span>
        ) : (
          <span>⏳ Left: {formatUnits(remaining)}</span>
        )}
      </div>
      <ProgressBarTrack percent={percent} />
    </div>
  );
}

export function ProgressSummaryCompact({ targetQuantity, achievedQuantity }) {
  const { target, achieved, percent } = getProgressStats(
    targetQuantity,
    achievedQuantity
  );

  if (target <= 0) {
    return (
      <div className="mt-2">
        <p className="text-xs text-slate-600">✅ Achieved: {formatUnits(achieved)} units</p>
      </div>
    );
  }

  return (
    <div className="mt-2">
      <p className="text-xs text-slate-600">
        ✅ {formatUnits(achieved)} / {formatUnits(target)} units ({Math.round(percent)}%)
      </p>
      <ProgressBarTrack percent={percent} />
    </div>
  );
}
