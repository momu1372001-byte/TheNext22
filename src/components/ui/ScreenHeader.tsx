import type { ReactNode } from 'react';

type ScreenHeaderProps = {
  titleAr: string;
  subtitleAr?: string;
  icon?: ReactNode;
  action?: ReactNode;
};

export function ScreenHeader({ titleAr, subtitleAr, icon, action }: ScreenHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-3 px-5 pt-6 pb-4 shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        {icon && (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-500/15 text-primary-500">
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-text-primary truncate">{titleAr}</h1>
          {subtitleAr && <p className="text-2xs text-text-muted truncate">{subtitleAr}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

export default ScreenHeader;
