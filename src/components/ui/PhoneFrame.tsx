import type { ReactNode } from 'react';

/**
 * Centers content inside a phone-sized frame on large screens,
 * full-bleed on mobile. Gives the app a premium device feel on desktop.
 */
export function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#05080F] sm:p-6">
      <div className="relative w-full sm:w-[400px] sm:h-[840px] h-screen bg-bg sm:rounded-[44px] sm:border-[10px] sm:border-neutral-900 sm:shadow-[0_30px_80px_rgba(0,0,0,0.6)] overflow-hidden flex flex-col">
        {/* notch on desktop frame */}
        <div className="hidden sm:block absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-neutral-900 rounded-b-2xl z-50" />
        {children}
      </div>
    </div>
  );
}

export default PhoneFrame;
