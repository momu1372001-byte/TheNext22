type ProgressBarProps = {
  value: number;
  max: number;
  className?: string;
  color?: string;
  height?: number;
};

export function ProgressBar({
  value,
  max,
  className = '',
  color = 'bg-primary-500',
  height = 8,
}: ProgressBarProps) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;

  return (
    <div
      className={`w-full overflow-hidden rounded-pill bg-white/8 ${className}`}
      style={{ height }}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemax={max}
      aria-valuemin={0}
    >
      <div
        className={`h-full rounded-pill transition-[width] duration-700 ease-out ${color}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export default ProgressBar;
