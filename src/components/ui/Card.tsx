import type { CSSProperties, ReactNode } from 'react';

type CardProps = {
  children: ReactNode;
  className?: string;
  raised?: boolean;
  onClick?: () => void;
  selected?: boolean;
  style?: CSSProperties;
};

export function Card({ children, className = '', raised = false, onClick, selected = false, style }: CardProps) {
  const base =
    'rounded-lg bg-surface border transition-all duration-200';
  const state = selected
    ? 'border-primary-500/70 shadow-glow'
    : raised
    ? 'border-border shadow-raised'
    : 'border-border/60 shadow-card';
  const interactive = onClick
    ? 'cursor-pointer hover:border-primary-500/50 hover:-translate-y-0.5 active:translate-y-0'
    : '';

  return (
    <div
      onClick={onClick}
      style={style}
      className={`${base} ${state} ${interactive} ${className}`}
    >
      {children}
    </div>
  );
}

export default Card;
