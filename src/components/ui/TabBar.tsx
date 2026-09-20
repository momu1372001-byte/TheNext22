import { BookOpen, RotateCcw, BarChart3, User } from 'lucide-react';
import type { TabKey } from '@/types';
import type { ReactNode } from 'react';

type TabConfig = {
  key: TabKey;
  labelAr: string;
  icon: ReactNode;
};

const TABS: TabConfig[] = [
  { key: 'learn', labelAr: 'تعلّم', icon: <BookOpen size={22} /> },
  { key: 'review', labelAr: 'مراجعة', icon: <RotateCcw size={22} /> },
  { key: 'progress', labelAr: 'تقدّمي', icon: <BarChart3 size={22} /> },
  { key: 'profile', labelAr: 'حسابي', icon: <User size={22} /> },
];

type TabBarProps = {
  active: TabKey;
  onChange: (key: TabKey) => void;
};

export function TabBar({ active, onChange }: TabBarProps) {
  return (
    <nav className="flex items-stretch justify-around bg-surface/95 backdrop-blur-md border-t border-border/70 shadow-tab pt-2 pb-4 px-2 shrink-0">
      {TABS.map((tab) => {
        const isActive = tab.key === active;
        return (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className={`flex flex-col items-center justify-center gap-1 flex-1 py-1 rounded-md transition-all duration-200 ${
              isActive ? 'text-primary-500' : 'text-text-muted hover:text-text-secondary'
            }`}
            aria-current={isActive ? 'page' : undefined}
          >
            <span
              className={`flex items-center justify-center w-11 h-7 rounded-pill transition-all duration-200 ${
                isActive ? 'bg-primary-500/15 scale-105' : 'scale-100'
              }`}
            >
              {tab.icon}
            </span>
            <span className={`text-2xs font-semibold ${isActive ? 'text-primary-500' : ''}`}>
              {tab.labelAr}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

export default TabBar;
