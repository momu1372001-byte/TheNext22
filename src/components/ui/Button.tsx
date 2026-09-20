import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'success';
type Size = 'sm' | 'md' | 'lg';

type ButtonProps = {
  children: ReactNode;
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  icon?: ReactNode;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'> & {
    className?: string;
  };

const variants: Record<Variant, string> = {
  primary:
    'bg-primary-500 text-neutral-950 font-bold hover:bg-primary-400 active:bg-primary-600 shadow-glow',
  secondary:
    'bg-surface-raised text-text-primary border border-border hover:border-primary-500/50',
  ghost:
    'bg-transparent text-text-secondary hover:text-text-primary hover:bg-white/5',
  success:
    'bg-success-500 text-neutral-950 font-bold hover:bg-success-400 active:bg-success-600',
};

const sizes: Record<Size, string> = {
  sm: 'text-sm px-3 py-2 rounded-md',
  md: 'text-base px-4 py-3 rounded-lg',
  lg: 'text-lg px-5 py-4 rounded-lg',
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  icon,
  className = '',
  ...rest
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...rest}
    >
      {icon}
      {children}
    </button>
  );
}

export default Button;
