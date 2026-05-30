export function getProgressStats(targetQuantity, achievedQuantity) {
  const target = Number(targetQuantity) || 0;
  const achieved = Number(achievedQuantity) || 0;
  const remaining = target > 0 ? Math.max(0, target - achieved) : 0;
  const percent =
    target > 0 ? Math.min((achieved / target) * 100, 100) : 0;
  const targetReached = target > 0 && achieved >= target;

  return { target, achieved, remaining, percent, targetReached };
}

export function formatUnits(n) {
  return (Number(n) || 0).toLocaleString('en-IN');
}
