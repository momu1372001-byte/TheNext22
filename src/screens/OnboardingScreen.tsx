import { useState } from 'react';
import { ChevronLeft, Check, Target, GraduationCap } from 'lucide-react';
import { Button, Card } from '@/components/ui';
import levels from '@/data/levels.json';
import goals from '@/data/goals.json';
import type { DailyGoal, Level, LevelCode } from '@/types';

type Step = 'level' | 'goal';

type OnboardingProps = {
  onComplete: (level: LevelCode, dailyGoal: number) => void;
};

export function OnboardingScreen({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState<Step>('level');
  const [level, setLevel] = useState<LevelCode | null>(null);
  const [goal, setGoal] = useState<number | null>(null);

  const typedLevels = levels as Level[];
  const typedGoals = goals as DailyGoal[];

  return (
    <div className="flex flex-1 flex-col bg-bg">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-6 pb-2">
        {step === 'goal' ? (
          <button
            onClick={() => setStep('level')}
            className="flex h-9 w-9 items-center justify-center rounded-pill bg-white/5 text-text-secondary hover:text-text-primary"
            aria-label="رجوع"
          >
            <ChevronLeft size={18} className="rotate-180" />
          </button>
        ) : (
          <div className="h-9 w-9" />
        )}
        <div className="flex flex-1 gap-1.5">
          <span className={`h-1.5 flex-1 rounded-pill transition-colors ${step === 'level' ? 'bg-primary-500' : 'bg-white/10'}`} />
          <span className={`h-1.5 flex-1 rounded-pill transition-colors ${step === 'goal' ? 'bg-primary-500' : 'bg-white/10'}`} />
        </div>
      </div>

      {/* Level step */}
      {step === 'level' && (
        <div className="flex flex-1 flex-col px-5 pt-4 overflow-y-auto no-scrollbar animate-fade-in">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-500/15 text-primary-500">
              <GraduationCap size={22} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-text-primary">اختر مستواك</h2>
              <p className="text-sm text-text-muted">من أين نبدأ رحلتك؟</p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {typedLevels.map((lvl) => {
              const selected = level === lvl.code;
              return (
                <Card
                  key={lvl.code}
                  selected={selected}
                  onClick={() => setLevel(lvl.code)}
                  className="p-4 animate-fade-up"
                >
                  <div className="flex items-center gap-4">
                    <span
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-sm font-bold ltr"
                      style={{ backgroundColor: `${lvl.color}22`, color: lvl.color }}
                    >
                      {lvl.code}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-text-primary">{lvl.nameAr}</p>
                      <p className="text-2xs text-text-muted truncate">{lvl.descriptionAr}</p>
                    </div>
                    {selected && (
                      <span className="flex h-6 w-6 items-center justify-center rounded-pill bg-primary-500 text-neutral-950">
                        <Check size={14} strokeWidth={3} />
                      </span>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>

          <div className="mt-auto pt-6">
            <Button
              fullWidth
              size="lg"
              disabled={!level}
              onClick={() => setStep('goal')}
            >
              التالي
            </Button>
          </div>
        </div>
      )}

      {/* Goal step */}
      {step === 'goal' && (
        <div className="flex flex-1 flex-col px-5 pt-4 overflow-y-auto no-scrollbar animate-fade-in">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-500/15 text-primary-500">
              <Target size={22} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-text-primary">هدفك اليومي</h2>
              <p className="text-sm text-text-muted">كم كلمة تريد تعلّمها كل يوم؟</p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {typedGoals.map((g) => {
              const selected = goal === g.value;
              return (
                <Card
                  key={g.value}
                  selected={selected}
                  onClick={() => setGoal(g.value)}
                  className="p-4 animate-fade-up"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-2xl font-bold text-primary-500 ltr">{g.value}</span>
                    <div className="flex-1">
                      <p className="font-semibold text-text-primary">{g.labelAr}</p>
                      <p className="text-2xs text-text-muted">{g.hintAr}</p>
                    </div>
                    {selected && (
                      <span className="flex h-6 w-6 items-center justify-center rounded-pill bg-primary-500 text-neutral-950">
                        <Check size={14} strokeWidth={3} />
                      </span>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>

          <div className="mt-auto pt-6">
            <Button
              fullWidth
              size="lg"
              disabled={!goal}
              onClick={() => level && goal && onComplete(level, goal)}
            >
              ابدأ التعلّم
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default OnboardingScreen;
