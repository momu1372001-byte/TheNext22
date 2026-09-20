import { useState, useMemo, useCallback } from 'react';
import { ChevronLeft, Check, X, GraduationCap, Trophy, RotateCcw } from 'lucide-react';
import { Screen, ProgressBar, Button, Card } from '@/components/ui';
import { getAllWords, getAllLevels } from '@/data/vocabularyRepository';
import { savePlacementResult } from '@/data/progressStore';
import { buildExercisesForWords, type Exercise } from '@/components/ui';
import type { LevelCode, Word, Level } from '@/types';

type PlacementTestScreenProps = {
  onComplete: (recommendedLevel: LevelCode, score: number) => void;
  onBack?: () => void;
};

const LEVEL_ORDER: LevelCode[] = ['A1', 'A2', 'B1', 'B2', 'C1'];

function buildPlacementExercises(): Exercise[] {
  const allWords = getAllWords();
  const levels = getAllLevels();

  const exercises: Exercise[] = [];

  for (const level of levels) {
    const levelWords = allWords.filter((w) => w.cefrLevel === level.code);
    const selected = levelWords.slice(0, 4);
    const built = buildExercisesForWords(selected, { widePool: true, maxExercises: 4 });
    exercises.push(...built.slice(0, 4));
  }

  return exercises.slice(0, 20);
}

type LevelResult = {
  level: LevelCode;
  correct: number;
  total: number;
};

function computeRecommendedLevel(results: LevelResult[]): { level: LevelCode; score: number } {
  let totalCorrect = 0;
  let totalQuestions = 0;

  for (const r of results) {
    totalCorrect += r.correct;
    totalQuestions += r.total;
  }

  const overallScore = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

  let recommended: LevelCode = 'A1';
  for (const levelCode of LEVEL_ORDER) {
    const levelResult = results.find((r) => r.level === levelCode);
    if (levelResult) {
      const pct = levelResult.total > 0 ? (levelResult.correct / levelResult.total) * 100 : 0;
      if (pct >= 60) {
        recommended = levelCode;
      }
    }
  }

  return { level: recommended, score: overallScore };
}

export function PlacementTestScreen({ onComplete, onBack }: PlacementTestScreenProps) {
  const [phase, setPhase] = useState<'intro' | 'practice' | 'done'>('intro');
  const [exercises] = useState<Exercise[]>(() => buildPlacementExercises());
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [recommendation, setRecommendation] = useState<{ level: LevelCode; score: number } | null>(null);

  const current = exercises[currentIdx];

  const levelOfCurrent = current?.word.cefrLevel;

  const handleAnswer = useCallback(
    (option: string) => {
      if (answered || !current) return;
      setSelected(option);
      setAnswered(true);
      const correct = option === current.correctAnswer;
      setAnswers((a) => [...a, correct]);
    },
    [answered, current],
  );

  const handleContinue = useCallback(() => {
    if (currentIdx + 1 >= exercises.length) {
      const results: LevelResult[] = [];
      const levelMap = new Map<LevelCode, boolean[]>();

      exercises.forEach((ex, i) => {
        const lvl = ex.word.cefrLevel;
        if (!levelMap.has(lvl)) levelMap.set(lvl, []);
        levelMap.get(lvl)!.push(answers[i] ?? false);
      });

      for (const [level, ans] of levelMap) {
        results.push({
          level,
          correct: ans.filter(Boolean).length,
          total: ans.length,
        });
      }

      const rec = computeRecommendedLevel(results);
      setRecommendation(rec);
      savePlacementResult({
        recommendedLevel: rec.level,
        score: rec.score,
        completedAt: new Date().toISOString(),
      });
      setPhase('done');
    } else {
      setCurrentIdx((i) => i + 1);
      setSelected(null);
      setAnswered(false);
    }
  }, [currentIdx, exercises, answers]);

  const handleStart = useCallback(() => {
    setPhase('practice');
    setCurrentIdx(0);
    setSelected(null);
    setAnswered(false);
    setAnswers([]);
  }, []);

  // --- Intro phase ---
  if (phase === 'intro') {
    return (
      <Screen>
        {onBack && (
          <div className="flex items-center gap-3 px-5 pt-6 pb-3 shrink-0">
            <button
              onClick={onBack}
              className="flex h-9 w-9 items-center justify-center rounded-pill bg-white/5 text-text-secondary hover:text-text-primary transition-colors"
              aria-label="رجوع"
            >
              <ChevronLeft size={18} className="rotate-180" />
            </button>
          </div>
        )}
        <div className="flex flex-col items-center justify-center flex-1 px-6 gap-6 animate-fade-up">
          <div className="relative">
            <div className="absolute inset-0 rounded-3xl bg-primary-500/30 blur-2xl animate-pulse-glow" />
            <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-primary-400 to-accent-500 shadow-glow">
              <GraduationCap size={48} className="text-neutral-950" strokeWidth={2.2} />
            </div>
          </div>

          <div className="text-center">
            <h2 className="text-2xl font-bold text-text-primary">اختبار تحديد المستوى</h2>
            <p className="text-sm text-text-muted mt-2 leading-relaxed max-w-sm">
              سنجري اختباراً سريعاً من ٢٠ سؤالاً لتحديد مستواك المناسب. أجب بصدق لنرشح لك المستوى الأفضل.
            </p>
          </div>

          <Card className="p-4 w-full max-w-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500/15 text-primary-400">
                <Trophy size={20} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-text-primary">ماذا تتوقع؟</p>
                <p className="text-2xs text-text-muted">أسئلة من جميع المستويات، حوالي ٥ دقائق</p>
              </div>
            </div>
          </Card>

          <Button fullWidth size="lg" icon={<GraduationCap size={20} />} onClick={handleStart} className="max-w-xs">
            ابدأ الاختبار
          </Button>
        </div>
      </Screen>
    );
  }

  // --- Done phase ---
  if (phase === 'done' && recommendation) {
    const levelData = getAllLevels().find((l) => l.code === recommendation.level);
    const totalCorrect = answers.filter(Boolean).length;

    return (
      <Screen scroll={false}>
        <div className="flex flex-col items-center justify-center flex-1 px-6 gap-6 animate-scale-in">
          <div className="relative">
            <div className="absolute inset-0 rounded-3xl bg-primary-500/30 blur-2xl animate-pulse-glow" />
            <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-primary-400 to-accent-500 shadow-glow">
              <Trophy size={48} className="text-neutral-950" strokeWidth={2.2} />
            </div>
          </div>

          <div className="text-center">
            <h2 className="text-2xl font-bold text-text-primary">اكتمل الاختبار!</h2>
            <p className="text-sm text-text-muted mt-1">المستوى الموصى به لك</p>
          </div>

          <Card raised className="p-6 flex flex-col items-center gap-3">
            <span
              className="flex h-16 w-20 items-center justify-center rounded-2xl text-2xl font-bold ltr"
              style={{ backgroundColor: `${levelData?.color}22`, color: levelData?.color }}
            >
              {recommendation.level}
            </span>
            <p className="text-lg font-bold text-text-primary">{levelData?.nameAr ?? recommendation.level}</p>
            <p className="text-2xs text-text-muted text-center">{levelData?.descriptionAr}</p>
          </Card>

          <div className="flex items-center gap-4 rounded-lg bg-surface border border-border/50 px-6 py-3">
            <div className="flex flex-col items-center">
              <span className="text-xl font-bold text-primary-400 ltr">{recommendation.score}%</span>
              <span className="text-2xs text-text-muted">النتيجة الكلية</span>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="flex flex-col items-center">
              <span className="text-xl font-bold text-success-400 ltr">{totalCorrect}/{answers.length}</span>
              <span className="text-2xs text-text-muted">إجابات صحيحة</span>
            </div>
          </div>

          <div className="flex flex-col gap-3 w-full max-w-xs">
            <Button fullWidth size="lg" icon={<Check size={20} />} onClick={() => onComplete(recommendation.level, recommendation.score)}>
              ابدأ التعلّم بهذا المستوى
            </Button>
            <Button fullWidth size="md" variant="ghost" icon={<RotateCcw size={18} />} onClick={handleStart}>
              إعادة الاختبار
            </Button>
          </div>
        </div>
      </Screen>
    );
  }

  // --- Practice phase ---
  if (!current) return null;

  const isCorrect = selected === current.correctAnswer;
  const isLast = currentIdx === exercises.length - 1;

  return (
    <Screen scroll={false}>
      <div className="flex items-center gap-3 px-5 pt-6 pb-3 shrink-0">
        <button
          onClick={() => setPhase('intro')}
          className="flex h-9 w-9 items-center justify-center rounded-pill bg-white/5 text-text-secondary hover:text-text-primary transition-colors"
          aria-label="رجوع"
        >
          <ChevronLeft size={18} className="rotate-180" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-bold text-text-primary truncate">اختبار تحديد المستوى</h1>
          <p className="text-2xs text-text-muted">
            {currentIdx + 1} من {exercises.length}
          </p>
        </div>
        {levelOfCurrent && (
          <span className="rounded-pill bg-primary-500/15 px-3 py-1 text-2xs font-semibold text-primary-500 shrink-0 ltr">
            {levelOfCurrent}
          </span>
        )}
      </div>

      <div className="px-5 pb-4 shrink-0">
        <ProgressBar
          value={currentIdx + (answered ? 1 : 0)}
          max={exercises.length}
          color={answered && !isCorrect ? 'bg-error-500' : 'bg-primary-500'}
        />
      </div>

      <div className="flex flex-col gap-5 px-5 pb-8 flex-1 overflow-y-auto no-scrollbar">
        <div key={currentIdx} className="flex flex-col items-center text-center gap-3 pt-4 animate-fade-up">
          <p className="text-2xs text-text-muted">اختر الإجابة الصحيحة</p>

          {current.type === 'ar-to-en' ? (
            <h2 className="text-4xl font-bold text-primary-500">{current.prompt}</h2>
          ) : (
            <h2 className="text-3xl font-bold text-text-primary ltr leading-relaxed">{current.prompt}</h2>
          )}

          {current.promptSub && (
            current.type === 'fill-blank' ? (
              <p className="text-sm text-text-muted">{current.promptSub}</p>
            ) : (
              <p className="text-2xs text-text-muted ltr">{current.promptSub}</p>
            )
          )}
        </div>

        <div className="flex flex-col gap-3">
          {current.options.map((option) => {
            const isThisCorrect = option === current.correctAnswer;
            const isThisSelected = option === selected;

            let stateClass = 'border-border bg-surface text-text-primary hover:border-primary-500/50';
            if (answered) {
              if (isThisCorrect) {
                stateClass = 'border-success-500 bg-success-500/10 text-success-400';
              } else if (isThisSelected) {
                stateClass = 'border-error-500 bg-error-500/10 text-error-400';
              } else {
                stateClass = 'border-border/50 bg-surface/50 text-text-muted';
              }
            }

            return (
              <button
                key={option}
                onClick={() => handleAnswer(option)}
                disabled={answered}
                className={`flex items-center justify-between gap-3 rounded-lg border-2 p-4 transition-all duration-200 ${stateClass} ${
                  !answered ? 'cursor-pointer active:scale-[0.98]' : ''
                }`}
              >
                <span className={`font-semibold text-lg ${current.isArabicOptions ? 'text-xl' : 'ltr'}`}>
                  {option}
                </span>
                {answered && isThisCorrect && <Check size={20} className="text-success-400 shrink-0" />}
                {answered && isThisSelected && !isThisCorrect && <X size={20} className="text-error-400 shrink-0" />}
              </button>
            );
          })}
        </div>

        {answered && (
          <div className="flex flex-col gap-3 animate-fade-up">
            <div
              className={`rounded-lg p-4 border ${
                isCorrect
                  ? 'bg-success-500/10 border-success-500/30'
                  : 'bg-error-500/10 border-error-500/30'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex items-center justify-center h-10 w-10 rounded-full shrink-0 ${
                    isCorrect ? 'bg-success-500/20' : 'bg-error-500/20'
                  }`}
                >
                  {isCorrect ? (
                    <Check size={22} className="text-success-400" strokeWidth={2.5} />
                  ) : (
                    <X size={22} className="text-error-400" strokeWidth={2.5} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-bold ${isCorrect ? 'text-success-400' : 'text-error-400'}`}>
                    {isCorrect ? 'إجابة صحيحة!' : 'إجابة خاطئة'}
                  </p>
                  {!isCorrect && (
                    <p className="text-2xs text-text-muted mt-0.5">
                      الإجابة الصحيحة:{' '}
                      <span className="text-text-secondary font-medium">{current.correctAnswer}</span>
                    </p>
                  )}
                </div>
                <div className="text-left shrink-0">
                  <p className="text-sm font-semibold text-text-primary ltr">{current.word.word}</p>
                  <p className="text-2xs text-primary-500">{current.word.arabicTranslation}</p>
                </div>
              </div>
            </div>

            <Button fullWidth size="lg" onClick={handleContinue}>
              {isLast ? 'عرض النتيجة' : 'متابعة'}
            </Button>
          </div>
        )}
      </div>
    </Screen>
  );
}

export default PlacementTestScreen;
