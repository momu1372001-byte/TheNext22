import { Lock, Star, Check, Play } from 'lucide-react';
import { CategoryIcon } from '@/components/ui';
import type { Category, Lesson } from '@/types';

export type LessonStatus = 'completed' | 'active' | 'locked';

type LessonPathNodeProps = {
  lesson: Lesson;
  category?: Category;
  status: LessonStatus;
  progressText: string;
  stars: number;
  index: number;
  isLast: boolean;
  onTap: () => void;
};

/**
 * A single node in the vertical learning path.
 * Renders the connecting line, the circular node marker, and a lesson card.
 */
export function LessonPathNode({
  lesson,
  category,
  status,
  progressText,
  stars,
  index,
  isLast,
  onTap,
}: LessonPathNodeProps) {
  const side = index % 2 === 0 ? 'right' : 'left';

  const nodeStyles: Record<LessonStatus, string> = {
    completed: 'bg-gradient-to-br from-primary-400 to-accent-500 text-neutral-950 shadow-glow',
    active: 'bg-gradient-to-br from-primary-400 to-accent-500 text-neutral-950 shadow-glow ring-4 ring-primary-500/20 animate-pulse-glow',
    locked: 'bg-surface-raised text-text-muted border border-border',
  };

  const cardStyles: Record<LessonStatus, string> = {
    completed: 'border-primary-500/40 bg-surface',
    active: 'border-primary-500/60 bg-surface shadow-glow',
    locked: 'border-border/50 bg-surface/50 opacity-70',
  };

  return (
    <div className="relative flex gap-4 pb-8 animate-fade-up" style={{ animationDelay: `${index * 80}ms` }}>
      {/* Connecting line — sits behind the node */}
      {!isLast && (
        <div
          className={`absolute top-14 bottom-0 w-0.5 ${
            status === 'completed' ? 'bg-primary-500/50' : 'bg-border/60'
          } ${side === 'right' ? 'right-[27px]' : 'left-[27px]'}`}
          aria-hidden
        />
      )}

      {/* Node circle */}
      <div className="relative z-10 shrink-0" style={side === 'left' ? { order: 2 } : undefined}>
        <div
          className={`flex h-14 w-14 items-center justify-center rounded-2xl transition-all duration-300 ${nodeStyles[status]}`}
        >
          {status === 'completed' ? (
            <Check size={24} strokeWidth={3} />
          ) : status === 'active' ? (
            <Play size={22} className="ltr:ml-0.5" fill="currentColor" />
          ) : (
            <Lock size={20} />
          )}
        </div>
      </div>

      {/* Lesson card */}
      <button
        onClick={status === 'locked' ? undefined : onTap}
        disabled={status === 'locked'}
        className={`flex flex-1 min-w-0 flex-col gap-1.5 rounded-lg border p-4 text-right transition-all duration-200 ${cardStyles[status]} ${
          status !== 'locked' ? 'cursor-pointer hover:border-primary-500/60 hover:-translate-y-0.5' : 'cursor-not-allowed'
        }`}
        style={side === 'left' ? { order: 1 } : undefined}
      >
        {/* Title + category icon */}
        <div className="flex items-center gap-2">
          {category && (
            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
              status === 'locked' ? 'bg-white/5 text-text-muted' : 'bg-primary-500/15 text-primary-500'
            }`}>
              <CategoryIcon name={category.icon} size={16} />
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className={`font-bold truncate ${status === 'locked' ? 'text-text-muted' : 'text-text-primary'}`}>
              {lesson.titleAr}
            </p>
            <p className="text-2xs text-text-muted truncate ltr">{lesson.titleEn}</p>
          </div>
        </div>

        {/* Description */}
        <p className="text-2xs text-text-muted truncate">{lesson.descriptionAr}</p>

        {/* Bottom row: progress + stars */}
        <div className="flex items-center justify-between mt-1">
          <span className={`text-2xs font-semibold ${
            status === 'completed' ? 'text-success-400' : status === 'active' ? 'text-primary-500' : 'text-text-muted'
          }`}>
            {progressText}
          </span>
          <div className="flex gap-0.5">
            {[0, 1, 2].map((s) => (
              <Star
                key={s}
                size={12}
                className={s < stars ? 'text-primary-500' : 'text-white/15'}
                fill={s < stars ? 'currentColor' : 'none'}
              />
            ))}
          </div>
        </div>
      </button>
    </div>
  );
}

export default LessonPathNode;
