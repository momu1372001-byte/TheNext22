import { useState, useMemo, useCallback } from 'react';
import { RotateCcw, Clock, Check, Sparkles } from 'lucide-react';
import { Screen, ScreenHeader, Card, Button, ExerciseRunner, buildExercisesForWords, shuffleArray, type Exercise } from '@/components/ui';
import { getWordById, getAllWords } from '@/data/vocabularyRepository';
import { getReviewWords, recordSessionAccuracy, checkAndUnlockAchievements, type ReviewEntry } from '@/data/progressStore';
import type { Word } from '@/types';

function buildReviewExercises(reviewEntries: ReviewEntry[]): Exercise[] {
  if (reviewEntries.length === 0) return [];

  const allWords = getAllWords();
  const wordMap = new Map(allWords.map((w) => [w.id, w]));

  const uniqueWords: Word[] = [];
  const seen = new Set<string>();
  for (const entry of reviewEntries) {
    if (seen.has(entry.wordId)) continue;
    const word = wordMap.get(entry.wordId);
    if (word) {
      uniqueWords.push(word);
      seen.add(entry.wordId);
    }
  }

  if (uniqueWords.length === 0) return [];

  const baseExercises = buildExercisesForWords(uniqueWords, { widePool: true });
  const weightMap = new Map<string, number>();
  for (const entry of reviewEntries) {
    weightMap.set(entry.wordId, entry.weight);
  }

  const weighted: Exercise[] = [];
  for (const ex of baseExercises) {
    const w = Math.min(3, weightMap.get(ex.word.id) ?? 1);
    for (let i = 0; i < w; i++) weighted.push(ex);
  }

  return shuffleArray(weighted).slice(0, 30);
}

export function ReviewScreen() {
  const [phase, setPhase] = useState<'overview' | 'practice'>('overview');
  const [exercises, setExercises] = useState<Exercise[]>([]);

  const reviewEntries = useMemo(() => getReviewWords(), []);
  const dueCount = reviewEntries.length;
  const estimatedMinutes = Math.max(1, Math.ceil((dueCount * 2) / 5));

  const handleStartReview = useCallback(() => {
    const exs = buildReviewExercises(reviewEntries);
    if (exs.length === 0) return;
    setExercises(exs);
    setPhase('practice');
  }, [reviewEntries]);

  const handleComplete = useCallback((result: { score: number }) => {
    recordSessionAccuracy(result.score);
    checkAndUnlockAchievements();
  }, []);

  const handleBackToOverview = useCallback(() => {
    setPhase('overview');
    setExercises([]);
  }, []);

  // --- Practice phase ---
  if (phase === 'practice') {
    return (
      <ExerciseRunner
        exercises={exercises}
        title="مراجعة ذكية"
        badge="مراجعة"
        onBack={handleBackToOverview}
        onComplete={handleComplete}
        onRestart={handleStartReview}
        doneTitle="أحسنت!"
        doneSubtitle="أكملت مراجعتك"
        restartLabel="مراجعة أخرى"
        backLabel="العودة للمراجعة"
      />
    );
  }

  // --- Overview phase ---
  const hasWords = dueCount > 0;
  const previewWords = reviewEntries
    .slice(0, 5)
    .map((e) => getWordById(e.wordId))
    .filter((w): w is Word => Boolean(w));

  return (
    <Screen>
      <ScreenHeader
        titleAr="مراجعة"
        subtitleAr="راجع ما تعلّمته لتثبيته في ذاكرتك"
        icon={<RotateCcw size={22} />}
      />

      <div className="flex flex-col gap-4 px-5 pb-8">
        {hasWords ? (
          <>
            <Card raised className="p-6 flex flex-col items-center text-center gap-3 animate-fade-up">
              <div className="relative">
                <div className="absolute inset-0 rounded-2xl bg-primary-500/20 blur-xl animate-pulse-glow" />
                <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-400 to-accent-500 shadow-glow">
                  <span className="text-3xl font-bold text-neutral-950 ltr">{dueCount}</span>
                </div>
              </div>
              <div>
                <p className="text-lg font-bold text-text-primary">كلمات للمراجعة</p>
                <p className="text-sm text-text-muted mt-1">
                  {dueCount === 1 ? 'كلمة واحدة تحتاج مراجعة' : `${dueCount} كلمات تحتاج مراجعة`}
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-2xs text-text-muted">
                <Clock size={13} />
                <span className="ltr">~{estimatedMinutes} دقيقة</span>
              </div>
            </Card>

            <Button
              fullWidth
              size="lg"
              icon={<Sparkles size={20} />}
              onClick={handleStartReview}
              className="animate-fade-up"
            >
              ابدأ المراجعة
            </Button>

            {previewWords.length > 0 && (
              <div className="animate-fade-up">
                <p className="text-2xs font-semibold text-text-muted mb-2 px-1">كلمات تحتاج اهتمامك</p>
                <div className="flex flex-col gap-1.5">
                  {previewWords.map((w) => {
                    const entry = reviewEntries.find((e) => e.wordId === w.id);
                    return (
                      <div
                        key={w.id}
                        className="flex items-center justify-between rounded-md bg-surface border border-border/50 px-4 py-2.5"
                      >
                        <div className="min-w-0">
                          <span className="text-sm font-medium text-text-secondary ltr">{w.word}</span>
                          {entry && entry.wrongCount > 0 && (
                            <span className="text-2xs text-error-400 mr-2 ltr"> · {entry.wrongCount}x خطأ</span>
                          )}
                        </div>
                        <span className="text-sm text-primary-500 shrink-0">{w.arabicTranslation}</span>
                      </div>
                    );
                  })}
                </div>
                {dueCount > 5 && (
                  <p className="text-2xs text-text-muted text-center mt-2">
                    +{dueCount - 5} كلمات أخرى
                  </p>
                )}
              </div>
            )}
          </>
        ) : (
          <Card className="p-8 flex flex-col items-center text-center gap-5 animate-fade-up">
            <div className="relative">
              <div className="absolute inset-0 rounded-2xl bg-success-500/15 blur-xl" />
              <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-success-500/15 text-success-400">
                <Check size={40} strokeWidth={2} />
              </div>
            </div>
            <div>
              <p className="text-lg font-bold text-text-primary">لا مراجعات متاحة</p>
              <p className="text-sm text-text-muted mt-1.5 leading-relaxed">
                أحسنت! لا توجد كلمات تحتاج مراجعة الآن.
                <br />
                تابع التعلّم وستظهر كلمات جديدة هنا تلقائياً.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-2xs text-text-muted">
              <Sparkles size={13} className="text-primary-500" />
              <span>المراجعة الذكية تظهر بعد كل درس</span>
            </div>
          </Card>
        )}
      </div>
    </Screen>
  );
}

export default ReviewScreen;
