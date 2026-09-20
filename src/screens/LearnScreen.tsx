import { useState, useEffect } from 'react';
import { BookOpen, Flame, ChevronLeft, Lock, Trophy, ArrowLeft, Play, Target, CheckCircle2, Sparkles } from 'lucide-react';
import {
  Screen,
  ScreenHeader,
  Card,
  ProgressBar,
  Button,
  CategoryIcon,
  WordCard,
  LessonPathNode,
  type LessonStatus,
} from '@/components/ui';
import {
  getLessonsByLevel,
  getWordsByLesson,
  getLessonById,
  getCategoryById,
  getLevelByCode,
} from '@/data/vocabularyRepository';
import {
  isLessonCompleted,
  getWordStatus,
  getDailySessionProgress,
  isDailySessionDone,
  subscribe,
} from '@/data/progressStore';
import type { Lesson, OnboardingState } from '@/types';
import LessonPracticeScreen from './LessonPracticeScreen';
import DailySessionScreen from './DailySessionScreen';

type LearnScreenProps = {
  profile: OnboardingState;
};

function getLessonStatuses(lessons: Lesson[]): LessonStatus[] {
  return lessons.map((lesson, i) => {
    if (isLessonCompleted(lesson.id)) return 'completed';
    // First lesson is always active; others are active if the previous is completed
    if (i === 0) return 'active';
    return isLessonCompleted(lessons[i - 1].id) ? 'active' : 'locked';
  });
}

export function LearnScreen({ profile }: LearnScreenProps) {
  const [openLessonId, setOpenLessonId] = useState<string | null>(null);
  const [practicing, setPracticing] = useState(false);
  const [inDailySession, setInDailySession] = useState(false);

  const dailyGoal = profile.dailyGoal;
  const level = profile.level ? getLevelByCode(profile.level) : undefined;
  const lessons = profile.level ? getLessonsByLevel(profile.level) : [];

  // Real-time daily progress
  const [dailyProgress, setDailyProgress] = useState(() => getDailySessionProgress());
  const [sessionDone, setSessionDone] = useState(() => isDailySessionDone());

  useEffect(() => {
    setDailyProgress(getDailySessionProgress());
    setSessionDone(isDailySessionDone());
    return subscribe(() => {
      setDailyProgress(getDailySessionProgress());
      setSessionDone(isDailySessionDone());
    });
  }, []);

  const learnedToday = dailyProgress.completed;
  const goalPct = dailyGoal > 0 ? Math.min(100, Math.round((learnedToday / dailyGoal) * 100)) : 0;
  const goalComplete = sessionDone || learnedToday >= dailyGoal;

  const statuses = getLessonStatuses(lessons);
  const completedCount = statuses.filter((s) => s === 'completed').length;
  const overallProgress = lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0;

  // --- Daily session mode ---
  if (inDailySession && profile.level) {
    return (
      <DailySessionScreen
        level={profile.level}
        dailyGoal={dailyGoal}
        onBack={() => setInDailySession(false)}
      />
    );
  }

  // --- Practice mode ---
  if (openLessonId && practicing) {
    return (
      <LessonPracticeScreen
        lessonId={openLessonId}
        onBack={() => setPracticing(false)}
      />
    );
  }

  // --- Lesson detail view ---
  if (openLessonId) {
    const lesson = getLessonById(openLessonId);
    if (!lesson) {
      setOpenLessonId(null);
      return null;
    }
    const category = getCategoryById(lesson.category);
    const lessonWords = getWordsByLesson(lesson.id);
    const completed = isLessonCompleted(lesson.id);

    return (
      <Screen>
        <div className="flex items-center gap-3 px-5 pt-6 pb-3 shrink-0">
          <button
            onClick={() => setOpenLessonId(null)}
            className="flex h-9 w-9 items-center justify-center rounded-pill bg-white/5 text-text-secondary hover:text-text-primary"
            aria-label="رجوع"
          >
            <ChevronLeft size={18} className="rotate-180" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-bold text-text-primary truncate">{lesson.titleAr}</h1>
            <p className="text-2xs text-text-muted truncate ltr">{lesson.titleEn}</p>
          </div>
        </div>

        <div className="px-5 pb-3">
          <div className="flex items-center gap-2 text-2xs text-text-muted">
            {category && <CategoryIcon name={category.icon} size={14} className="text-primary-500" />}
            <span>{category?.nameAr ?? ''}</span>
            <span>·</span>
            <span className="ltr">{lessonWords.length} كلمات</span>
            {completed && (
              <>
                <span>·</span>
                <span className="text-success-400">مكتمل</span>
              </>
            )}
          </div>
        </div>

        {/* Start practice button */}
        <div className="px-5 pb-4">
          <Button
            fullWidth
            size="lg"
            icon={<Play size={20} fill="currentColor" />}
            onClick={() => setPracticing(true)}
          >
            {completed ? 'إعادة التمرين' : 'ابدأ التمرين'}
          </Button>
        </div>

        {/* Word list */}
        <div className="flex flex-col gap-3 px-5 pb-8">
          {lessonWords.map((w, i) => {
            const status = getWordStatus(w.id);
            return <WordCard key={w.id} word={w} index={i} status={status} />;
          })}
        </div>
      </Screen>
    );
  }

  // --- Path / map view ---
  return (
    <Screen>
      <ScreenHeader
        titleAr="تعلّم"
        subtitleAr={level ? `${level.nameAr} · ${level.code}` : 'اختر مستواك أولاً'}
        icon={<BookOpen size={22} />}
      />

      {lessons.length === 0 ? (
        <div className="flex flex-col gap-4 px-5 pb-8">
          <Card className="p-6 flex flex-col items-center text-center gap-4 animate-fade-up">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-500/15 text-primary-500">
              <BookOpen size={30} />
            </div>
            <div>
              <p className="text-lg font-bold text-text-primary">ابدأ رحلتك</p>
              <p className="text-sm text-text-muted mt-1">
                اختر مستواك من شاشة الحساب لعرض الدروس
              </p>
            </div>
            <Button fullWidth size="lg" className="mt-1">
              ابدأ الآن
              <ArrowLeft size={18} className="rotate-180" />
            </Button>
          </Card>
        </div>
      ) : (
        <div className="flex flex-col gap-4 px-5 pb-8">
          {/* Daily goal hero card */}
          <Card raised className="p-5 animate-fade-up">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Target size={18} className="text-primary-500" />
                <span className="text-sm font-semibold text-text-primary">هدف اليوم</span>
              </div>
              <span className="text-sm text-text-secondary ltr tabular-nums">
                {learnedToday}/{dailyGoal}
              </span>
            </div>
            <ProgressBar value={learnedToday} max={dailyGoal} height={10} />
            <div className="flex items-center justify-between mt-3">
              <span className="text-2xs text-text-muted ltr tabular-nums">
                {goalPct >= 100 ? 'تم تحقيق الهدف!' : `${dailyGoal - learnedToday} كلمات متبقّية`}
              </span>
              <span className="text-2xs text-text-muted ltr">{goalPct}%</span>
            </div>
            {goalComplete ? (
              <div className="mt-4 flex items-center gap-2 rounded-lg bg-success-500/10 border border-success-500/30 px-4 py-3 animate-fade-up">
                <CheckCircle2 size={18} className="text-success-400 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-success-400">أحسنت! أكملت جلسة اليوم</p>
                  <p className="text-2xs text-text-muted">ارجع غداً لمواصلة سلسلتك</p>
                </div>
                <Flame size={20} className="text-warning-400 shrink-0" />
              </div>
            ) : (
              <Button
                fullWidth
                size="lg"
                className="mt-4"
                icon={<Sparkles size={20} />}
                onClick={() => setInDailySession(true)}
              >
                ابدأ جلسة اليوم
              </Button>
            )}
          </Card>

          {/* Unit progress banner */}
          <Card raised className="p-5 animate-fade-up">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Trophy size={18} className="text-primary-500" />
                <span className="text-sm font-semibold text-text-primary">تقدّم الوحدة</span>
              </div>
              <span className="text-sm text-text-secondary ltr">{overallProgress}%</span>
            </div>
            <ProgressBar value={completedCount} max={lessons.length} />
            <div className="flex items-center justify-between mt-2">
              <span className="text-2xs text-text-muted">
                {completedCount} من {lessons.length} دروس مكتملة
              </span>
            </div>
          </Card>

          {/* Section label */}
          <div className="flex items-center gap-2 px-1">
            <span className="text-2xs font-semibold text-text-muted">مسار التعلّم</span>
            <div className="h-px flex-1 bg-border/40" />
          </div>

          {/* Vertical path */}
          <div className="flex flex-col">
            {lessons.map((lesson, i) => {
              const category = getCategoryById(lesson.category);
              const status = statuses[i];
              const wordCount = lesson.wordIds.length;
              const progressText =
                status === 'completed'
                  ? `مكتمل · ${wordCount} كلمات`
                  : status === 'active'
                  ? `ابدأ الآن · ${wordCount} كلمات`
                  : `مقفل · ${wordCount} كلمات`;
              const stars = status === 'completed' ? 3 : 0;

              return (
                <LessonPathNode
                  key={lesson.id}
                  lesson={lesson}
                  category={category}
                  status={status}
                  progressText={progressText}
                  stars={stars}
                  index={i}
                  isLast={i === lessons.length - 1}
                  onTap={() => setOpenLessonId(lesson.id)}
                />
              );
            })}
          </div>

          {/* Locked next-unit teaser */}
          <div className="flex items-center justify-center gap-2 text-2xs text-text-muted pt-2">
            <Lock size={12} />
            <span>وحدات أكثر قادمة بعد إكمال هذه الدروس</span>
          </div>
        </div>
      )}
    </Screen>
  );
}

export default LearnScreen;
