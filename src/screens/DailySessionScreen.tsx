import { useState, useMemo, useCallback } from 'react';
import { Zap, Flame, ArrowLeft } from 'lucide-react';
import { Screen, Button, ExerciseRunner, buildExercisesForWords, type Exercise } from '@/components/ui';
import { getWordById } from '@/data/vocabularyRepository';
import {
  getOrCreateDailySession,
  recordSessionWord,
  completeDailySession,
  recordSessionAccuracy,
  recordDailyGoalCompleted,
  checkAndUnlockAchievements,
  type DailySession,
  type SrsGrade,
} from '@/data/progressStore';
import type { LevelCode, Word } from '@/types';

type DailySessionScreenProps = {
  level: LevelCode;
  dailyGoal: number;
  onBack: () => void;
};

export function DailySessionScreen({ level, dailyGoal, onBack }: DailySessionScreenProps) {
  const [session] = useState<DailySession>(() => getOrCreateDailySession(level, dailyGoal));
  const [phase, setPhase] = useState<'practice' | 'done'>('practice');
  const [result, setResult] = useState<{ xpGained: number; newStreak: number }>({ xpGained: 0, newStreak: 0 });
  const [doneScore, setDoneScore] = useState(0);

  const sessionWords = useMemo(
    () => session.wordIds.map((id) => getWordById(id)).filter((w): w is Word => Boolean(w)),
    [session.wordIds],
  );

  const [exercises] = useState<Exercise[]>(() => buildExercisesForWords(sessionWords, { widePool: true }));

  const handleAnswer = useCallback(
    (word: Word, grade: SrsGrade) => {
      recordSessionWord(word.id, grade);
    },
    [],
  );

  const handleComplete = useCallback(
    (res: { score: number }) => {
      const r = completeDailySession();
      setResult(r);
      setDoneScore(res.score);
      recordSessionAccuracy(res.score);
      recordDailyGoalCompleted();
      checkAndUnlockAchievements();
      setPhase('done');
    },
    [],
  );

  if (sessionWords.length === 0) {
    return (
      <Screen scroll={false}>
        <div className="flex items-center gap-3 px-5 pt-6 pb-3 shrink-0">
          <button
            onClick={onBack}
            className="flex h-9 w-9 items-center justify-center rounded-pill bg-white/5 text-text-secondary hover:text-text-primary transition-colors"
            aria-label="رجوع"
          >
            <ArrowLeft size={18} className="rotate-180" />
          </button>
          <h1 className="text-sm font-bold text-text-primary">الجلسة اليومية</h1>
        </div>
        <div className="flex items-center justify-center flex-1 text-text-muted text-sm px-5 text-center">
          لا توجد كلمات جديدة لمستواك حالياً. جرّب مستوى أعلى أو راجع كلماتك السابقة.
        </div>
      </Screen>
    );
  }

  // --- Done phase ---
  if (phase === 'done') {
    const score = doneScore;

    return (
      <Screen scroll={false}>
        <div className="flex flex-col items-center justify-center flex-1 px-6 gap-5 animate-scale-in">
          <div className="relative">
            <div className="absolute inset-0 rounded-3xl bg-primary-500/30 blur-2xl animate-pulse-glow" />
            <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-primary-400 to-accent-500 shadow-glow">
              <Zap size={48} className="text-neutral-950" strokeWidth={2.2} />
            </div>
          </div>

          <div className="text-center">
            <h2 className="text-2xl font-bold text-text-primary">أكملت جلسة اليوم!</h2>
            <p className="text-sm text-text-muted mt-1">
              تعلّمت {sessionWords.length} كلمة ووصلت إلى هدفك اليومي
            </p>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1.5">
                <Zap size={22} className="text-primary-400" />
                <span className="text-3xl font-bold text-primary-400 ltr">+{result.xpGained}</span>
              </div>
              <span className="text-2xs text-text-muted">نقطة خبرة</span>
            </div>
            <div className="h-12 w-px bg-border" />
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1.5">
                <Flame size={22} className="text-warning-400" />
                <span className="text-3xl font-bold text-warning-400 ltr">{result.newStreak}</span>
              </div>
              <span className="text-2xs text-text-muted">أيام متتالية</span>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-lg bg-surface border border-border/50 px-6 py-3">
            <div className="flex flex-col items-center">
              <span className="text-xl font-bold text-text-primary ltr">{score}%</span>
              <span className="text-2xs text-text-muted">النتيجة</span>
            </div>
          </div>

          <div className="flex flex-col gap-3 w-full max-w-xs">
            <Button fullWidth size="md" variant="ghost" icon={<ArrowLeft size={18} />} onClick={onBack}>
              العودة للدروس
            </Button>
          </div>
        </div>
      </Screen>
    );
  }

  // --- Practice phase ---
  return (
    <ExerciseRunner
      exercises={exercises}
      title="جلسة اليوم"
      badge="يومي"
      onBack={onBack}
      onAnswer={handleAnswer}
      onComplete={handleComplete}
      hideDoneScreen
    />
  );
}

export default DailySessionScreen;
