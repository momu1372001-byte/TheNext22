import { useState, useMemo, useCallback } from 'react';
import { getLessonById, getCategoryById, getWordsByLesson } from '@/data/vocabularyRepository';
import { markLessonComplete, checkAndUnlockAchievements, recordSessionAccuracy } from '@/data/progressStore';
import { ExerciseRunner, buildExercisesForWords, type Exercise } from '@/components/ui';
import { Screen } from '@/components/ui';

type LessonPracticeScreenProps = {
  lessonId: string;
  onBack: () => void;
};

export function LessonPracticeScreen({ lessonId, onBack }: LessonPracticeScreenProps) {
  const lesson = getLessonById(lessonId);
  const words = useMemo(() => (lesson ? getWordsByLesson(lessonId) : []), [lessonId]);
  const category = lesson ? getCategoryById(lesson.category) : undefined;

  const [exercises, setExercises] = useState<Exercise[]>(() => buildExercisesForWords(words));

  const handleComplete = useCallback(
    (result: { total: number; correct: number; score: number }) => {
      if (lesson) {
        markLessonComplete(lessonId, result.score, words.map((w) => w.id));
        recordSessionAccuracy(result.score);
        checkAndUnlockAchievements();
      }
    },
    [lessonId, lesson, words],
  );

  const handleRestart = useCallback(() => {
    setExercises(buildExercisesForWords(words));
  }, [words]);

  if (!lesson || words.length === 0) {
    return (
      <Screen>
        <div className="flex items-center justify-center flex-1 text-text-muted text-sm">
          الدرس غير متاح
        </div>
      </Screen>
    );
  }

  return (
    <ExerciseRunner
      exercises={exercises}
      title={lesson.titleAr}
      badge={category?.nameAr}
      onBack={onBack}
      onComplete={handleComplete}
      onRestart={handleRestart}
      doneTitle="أحسنت!"
      doneSubtitle={`أكملت درس «${lesson.titleAr}»`}
      restartLabel="تمرين آخر"
      backLabel="العودة للدروس"
    />
  );
}

export default LessonPracticeScreen;
