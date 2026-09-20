import type { ReactNode } from 'react';

type ScreenProps = {
  children: ReactNode;
  className?: string;
  /** Whether the screen should scroll. */
  scroll?: boolean;
};

/**
 * Standard tab screen layout: consistent padding + scroll behavior.
 */
export function Screen({ children, className = '', scroll = true }: ScreenProps) {
  return (
    <div
      className={`flex flex-col min-h-0 flex-1 ${scroll ? 'overflow-y-auto no-scrollbar' : ''} ${className}`}
    >
      {children}
    </div>
  );
}

export default Screen;
