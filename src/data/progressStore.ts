import type { LevelCode, Word } from '@/types';
import { getWordsByLevel, getAllLevels, getWordById } from '@/data/vocabularyRepository';
import { ACHIEVEMENTS } from '@/data/achievements';

const STORAGE_KEY = 'words-app-progress-v1';

export type WordStatus = 'new' | 'learning' | 'reviewed';

export type LessonProgress = {
  completed: boolean;
  bestScore: number; // 0-100
  completedAt: string | null;
};

export type WordProgress = {
  status: WordStatus;
  correctCount: number;
  wrongCount: number;
};

/** Map of YYYY-MM-DD -> count of words learned that day. */
export type ActivityLog = Record<string, number>;

export type PlacementResult = {
  recommendedLevel: LevelCode;
  score: number;
  completedAt: string;
};

export type ProgressState = {
  lessons: Record<string, LessonProgress>;
  learnedWordIds: string[];
  streak: number;
  lastActiveDate: string | null;
  words: Record<string, WordProgress>;
  xp: number;
  activityLog: ActivityLog;
  unlockedAchievements: string[];
  placement: PlacementResult | null;
  bestSessionAccuracy: number;
  dailyGoalsCompleted: number;
};

const INITIAL_STATE: ProgressState = {
  lessons: {},
  learnedWordIds: [],
  streak: 0,
  lastActiveDate: null,
  words: {},
  xp: 0,
  activityLog: {},
  unlockedAchievements: [],
  placement: null,
  bestSessionAccuracy: 0,
  dailyGoalsCompleted: 0,
};

function load(): ProgressState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...INITIAL_STATE };
    const parsed = JSON.parse(raw) as Partial<ProgressState>;
    return {
      lessons: parsed.lessons ?? {},
      learnedWordIds: parsed.learnedWordIds ?? [],
      streak: parsed.streak ?? 0,
      lastActiveDate: parsed.lastActiveDate ?? null,
      words: parsed.words ?? {},
      xp: parsed.xp ?? 0,
      activityLog: parsed.activityLog ?? {},
      unlockedAchievements: parsed.unlockedAchievements ?? [],
      placement: parsed.placement ?? null,
      bestSessionAccuracy: parsed.bestSessionAccuracy ?? 0,
      dailyGoalsCompleted: parsed.dailyGoalsCompleted ?? 0,
    };
  } catch {
    return { ...INITIAL_STATE };
  }
}

function save(state: ProgressState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore quota errors
  }
}

const listeners = new Set<() => void>();
let currentState: ProgressState = load();

function notify() {
  listeners.forEach((fn) => fn());
}

export function getProgress(): ProgressState {
  return currentState;
}

export function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function isLessonCompleted(lessonId: string): boolean {
  return Boolean(currentState.lessons[lessonId]?.completed);
}

export function getLessonProgress(lessonId: string): LessonProgress | undefined {
  return currentState.lessons[lessonId];
}

export function getCompletedLessonsForLevel(_level: LevelCode, lessonIds: string[]): number {
  return lessonIds.filter((id) => currentState.lessons[id]?.completed).length;
}

export function getLearnedWordCount(): number {
  return currentState.learnedWordIds.length;
}

export function getWordStatus(wordId: string): WordStatus {
  return currentState.words[wordId]?.status ?? 'new';
}

export function getWordProgress(wordId: string): WordProgress | undefined {
  return currentState.words[wordId];
}

function bumpActivity(state: ProgressState, today: string, newlyLearned: number): ActivityLog {
  if (newlyLearned <= 0) return state.activityLog;
  const prev = state.activityLog[today] ?? 0;
  return { ...state.activityLog, [today]: prev + newlyLearned };
}

export function recordWordAnswer(wordId: string, correct: boolean): void {
  const existing = currentState.words[wordId];
  const correctCount = (existing?.correctCount ?? 0) + (correct ? 1 : 0);
  const wrongCount = (existing?.wrongCount ?? 0) + (correct ? 0 : 1);
  let status: WordStatus = 'learning';
  if (correctCount >= 2) {
    status = 'reviewed';
  } else {
    status = 'learning';
  }

  currentState = {
    ...currentState,
    words: {
      ...currentState.words,
      [wordId]: { status, correctCount, wrongCount },
    },
    xp: currentState.xp + (correct ? 5 : 1),
  };
  save(currentState);
  notify();
}

export function markLessonComplete(lessonId: string, score: number, wordIds: string[]): void {
  const existing = currentState.lessons[lessonId];
  const today = new Date().toISOString().slice(0, 10);

  const prevLearned = new Set(currentState.learnedWordIds);
  wordIds.forEach((id) => prevLearned.add(id));
  const newlyLearned = prevLearned.size - currentState.learnedWordIds.length;

  const streak = currentState.lastActiveDate === today
    ? currentState.streak
    : currentState.lastActiveDate
      ? currentState.streak + 1
      : 1;

  currentState = {
    ...currentState,
    lessons: {
      ...currentState.lessons,
      [lessonId]: {
        completed: true,
        bestScore: Math.max(existing?.bestScore ?? 0, score),
        completedAt: today,
      },
    },
    learnedWordIds: [...prevLearned],
    streak,
    lastActiveDate: today,
    xp: currentState.xp + 25 + Math.round(score / 4),
    activityLog: bumpActivity(currentState, today, newlyLearned),
  };
  save(currentState);
  notify();
}

export type ReviewEntry = {
  wordId: string;
  wrongCount: number;
  correctCount: number;
  status: WordStatus;
  weight: number;
};

/**
 * Returns words that are due for review, sorted by priority:
 * - Words with wrong answers appear first (more wrongs = higher priority)
 * - Words still in "learning" status are next
 * - "reviewed" words with zero wrongs are excluded (they're mastered)
 */
export function getReviewWords(): ReviewEntry[] {
  const entries: ReviewEntry[] = [];

  for (const [wordId, progress] of Object.entries(currentState.words)) {
    const hasWrong = progress.wrongCount > 0;
    const isLearning = progress.status === 'learning';

    if (!hasWrong && !isLearning) continue;

    // Weight: words with more wrongs appear more frequently.
    // Each wrong answer doubles the weight (exponential), so a word
    // answered wrong 3x is 8x more likely to appear than one wrong 1x.
    const weight = Math.max(1, (progress.wrongCount + 1) * (isLearning ? 2 : 1));

    entries.push({
      wordId,
      wrongCount: progress.wrongCount,
      correctCount: progress.correctCount,
      status: progress.status,
      weight,
    });
  }

  // Sort by wrongCount desc, then by status (learning before reviewed)
  entries.sort((a, b) => {
    if (b.wrongCount !== a.wrongCount) return b.wrongCount - a.wrongCount;
    if (a.status === 'learning' && b.status !== 'learning') return -1;
    if (b.status === 'learning' && a.status !== 'learning') return 1;
    return 0;
  });

  return entries;
}

/* ------------------------------------------------------------------ */
/* Daily session — generates a mixed set of new + due review words
/* based on the user's level and daily goal.
/* ------------------------------------------------------------------ */

export type DailySession = {
  date: string;
  wordIds: string[];
  completedCount: number;
  done: boolean;
};

const SESSION_KEY = 'words-app-session-v1';

function loadSession(): DailySession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DailySession;
    const today = dateKey(new Date());
    if (parsed.date !== today) return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveSession(session: DailySession): void {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    // ignore
  }
}

function pickNewWords(level: LevelCode, count: number): string[] {
  const levelWords = getWordsByLevel(level);
  const learnedSet = new Set(currentState.learnedWordIds);
  const fresh = levelWords.filter((w) => !learnedSet.has(w.id) && currentState.words[w.id]?.status !== 'learning');
  const pool = fresh.length >= count ? fresh : levelWords.filter((w) => !learnedSet.has(w.id));
  return shuffleIds(pool.map((w) => w.id)).slice(0, count);
}

function pickReviewWords(count: number): string[] {
  const review = getReviewWords();
  return shuffleIds(review.map((r) => r.wordId)).slice(0, count);
}

function shuffleIds<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function getOrCreateDailySession(level: LevelCode, dailyGoal: number): DailySession {
  const existing = loadSession();
  if (existing) return existing;

  const reviewBudget = Math.min(Math.floor(dailyGoal * 0.4), getReviewWords().length);
  const newBudget = dailyGoal - reviewBudget;

  const newIds = pickNewWords(level, newBudget);
  const reviewIds = pickReviewWords(reviewBudget);

  // Deduplicate (a word could theoretically be in both)
  const seen = new Set<string>();
  const wordIds: string[] = [];
  for (const id of [...reviewIds, ...newIds]) {
    if (!seen.has(id)) {
      seen.add(id);
      wordIds.push(id);
    }
  }

  const session: DailySession = {
    date: dateKey(new Date()),
    wordIds,
    completedCount: 0,
    done: wordIds.length === 0,
  };
  saveSession(session);
  return session;
}

export function getDailySession(): DailySession | null {
  return loadSession();
}

export function recordSessionWord(wordId: string, correct: boolean): DailySession {
  recordWordAnswer(wordId, correct);

  const session = loadSession();
  if (!session) {
    // No active session — still recorded the answer, just no session to update
    return { date: dateKey(new Date()), wordIds: [], completedCount: 0, done: true };
  }

  // Only count as "completed" if the word was newly learned or reviewed correctly
  const isLearned = currentState.learnedWordIds.includes(wordId)
    || currentState.words[wordId]?.status === 'reviewed'
    || correct;

  const completedCount = isLearned ? session.completedCount + 1 : session.completedCount;
  const done = completedCount >= session.wordIds.length;

  const updated: DailySession = { ...session, completedCount, done };
  saveSession(updated);
  return updated;
}

export function completeDailySession(): { xpGained: number; newStreak: number } {
  const session = loadSession();
  if (!session || session.done) {
    return { xpGained: 0, newStreak: currentState.streak };
  }

  const today = dateKey(new Date());
  const newWordIds = session.wordIds.filter((id) => !currentState.learnedWordIds.includes(id));

  // Add newly learned words to the learned set
  const learnedSet = new Set(currentState.learnedWordIds);
  newWordIds.forEach((id) => learnedSet.add(id));

  // Bump streak only once per day
  let streak = currentState.streak;
  if (currentState.lastActiveDate !== today) {
    streak = currentState.lastActiveDate
      ? currentState.streak + 1
      : 1;
  }

  const xpGained = 25 + session.wordIds.length * 5;

  const newlyLearned = learnedSet.size - currentState.learnedWordIds.length;
  currentState = {
    ...currentState,
    learnedWordIds: [...learnedSet],
    streak,
    lastActiveDate: today,
    xp: currentState.xp + xpGained,
    activityLog: bumpActivity(currentState, today, Math.max(newlyLearned, session.wordIds.length)),
  };
  save(currentState);

  const updatedSession: DailySession = { ...session, done: true, completedCount: session.wordIds.length };
  saveSession(updatedSession);

  notify();
  return { xpGained, newStreak: streak };
}

export function isDailySessionDone(): boolean {
  const session = loadSession();
  return !session || session.done;
}

export function getDailySessionProgress(): { completed: number; total: number } {
  const session = loadSession();
  if (!session) return { completed: 0, total: 0 };
  return { completed: session.completedCount, total: session.wordIds.length };
}

export function resetProgress(): void {
  currentState = { ...INITIAL_STATE };
  save(currentState);
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    // ignore
  }
  notify();
}

/* ------------------------------------------------------------------ */
/* Achievements
/* ------------------------------------------------------------------ */

export function getUnlockedAchievements(): string[] {
  return [...currentState.unlockedAchievements];
}

export function checkAndUnlockAchievements(): string[] {
  const newlyUnlocked: string[] = [];

  for (const achievement of ACHIEVEMENTS) {
    if (currentState.unlockedAchievements.includes(achievement.id)) continue;

    let value = 0;
    switch (achievement.category) {
      case 'streak':
        value = currentState.streak;
        break;
      case 'xp':
        value = currentState.xp;
        break;
      case 'words':
        value = currentState.learnedWordIds.length;
        break;
      case 'lessons':
        value = Object.values(currentState.lessons).filter((l) => l.completed).length;
        break;
      case 'accuracy':
        value = currentState.bestSessionAccuracy;
        break;
      case 'milestone':
        value = currentState.dailyGoalsCompleted;
        break;
    }

    if (value >= achievement.threshold) {
      newlyUnlocked.push(achievement.id);
    }
  }

  if (newlyUnlocked.length > 0) {
    const bonusXp = newlyUnlocked.reduce((sum, id) => {
      const ach = ACHIEVEMENTS.find((a) => a.id === id);
      return sum + (ach?.xpReward ?? 0);
    }, 0);

    currentState = {
      ...currentState,
      unlockedAchievements: [...currentState.unlockedAchievements, ...newlyUnlocked],
      xp: currentState.xp + bonusXp,
    };
    save(currentState);
    notify();
  }

  return newlyUnlocked;
}

/* ------------------------------------------------------------------ */
/* Placement test
/* ------------------------------------------------------------------ */

export function savePlacementResult(result: PlacementResult): void {
  currentState = {
    ...currentState,
    placement: result,
  };
  save(currentState);
  notify();
}

export function getPlacementResult(): PlacementResult | null {
  return currentState.placement;
}

/* ------------------------------------------------------------------ */
/* Session accuracy tracking
/* ------------------------------------------------------------------ */

export function recordSessionAccuracy(accuracy: number): void {
  if (accuracy > currentState.bestSessionAccuracy) {
    currentState = {
      ...currentState,
      bestSessionAccuracy: Math.round(accuracy),
    };
    save(currentState);
    checkAndUnlockAchievements();
    notify();
  }
}

export function recordDailyGoalCompleted(): void {
  currentState = {
    ...currentState,
    dailyGoalsCompleted: currentState.dailyGoalsCompleted + 1,
  };
  save(currentState);
  checkAndUnlockAchievements();
  notify();
}

/* ------------------------------------------------------------------ */
/* Strengths & weaknesses analysis
/* ------------------------------------------------------------------ */

export type SkillAnalysis = {
  categoryId: string;
  totalAnswers: number;
  correctAnswers: number;
  accuracy: number;
  strength: 'strong' | 'medium' | 'weak';
};

export function getStrengthsAndWeaknesses(): SkillAnalysis[] {
  const state = currentState;
  const results: SkillAnalysis[] = [];
  const categoryMap = new Map<string, { correct: number; total: number }>();

  for (const [wordId, progress] of Object.entries(state.words)) {
    const word = getWordById(wordId);
    if (!word) continue;
    const cat = word.category;
    if (!categoryMap.has(cat)) categoryMap.set(cat, { correct: 0, total: 0 });
    const entry = categoryMap.get(cat)!;
    entry.total += progress.correctCount + progress.wrongCount;
    entry.correct += progress.correctCount;
  }

  for (const [categoryId, data] of categoryMap) {
    const accuracy = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;
    let strength: 'strong' | 'medium' | 'weak' = 'medium';
    if (accuracy >= 80) strength = 'strong';
    else if (accuracy < 50) strength = 'weak';
    results.push({
      categoryId,
      totalAnswers: data.total,
      correctAnswers: data.correct,
      accuracy,
      strength,
    });
  }

  results.sort((a, b) => a.accuracy - b.accuracy);
  return results;
}

export function getWeakWords(limit = 10): Word[] {
  const state = currentState;
  const weakIds = Object.entries(state.words)
    .filter(([, p]) => p.wrongCount > 0)
    .sort((a, b) => b[1].wrongCount - a[1].wrongCount)
    .slice(0, limit)
    .map(([id]) => id);

  return weakIds
    .map((id) => getWordById(id))
    .filter((w): w is Word => Boolean(w));
}

/* ------------------------------------------------------------------ */
/* Derived selectors (read-only, used by the Progress screen)
/* ------------------------------------------------------------------ */

export type ProgressSummary = {
  totalLearned: number;
  masteredCount: number;
  inProgressCount: number;
  streak: number;
  xp: number;
  dailyGoal: number;
  learnedToday: number;
  perLevel: Array<{ code: LevelCode; learned: number; total: number }>;
  weeklyActivity: Array<{ date: string; label: string; count: number }>;
  unlockedAchievements: string[];
  bestSessionAccuracy: number;
  placement: PlacementResult | null;
};

const ARABIC_DAY_LABELS = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

function dateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function getProgressSummary(dailyGoal: number): ProgressSummary {
  const state = currentState;
  const today = dateKey(new Date());

  const learnedSet = new Set(state.learnedWordIds);
  let masteredCount = 0;
  let inProgressCount = 0;

  for (const id of learnedSet) {
    const p = state.words[id];
    if (p?.status === 'reviewed') masteredCount++;
    else inProgressCount++;
  }

  const allLevels = getAllLevels();
  const perLevel = allLevels.map((lvl) => {
    const levelWords = getWordsByLevel(lvl.code);
    const learned = levelWords.filter((w: Word) => learnedSet.has(w.id)).length;
    return { code: lvl.code, learned, total: levelWords.length };
  });

  // Last 7 days (oldest -> newest), labeled with Arabic weekday names.
  const weeklyActivity: Array<{ date: string; label: string; count: number }> = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = dateKey(d);
    weeklyActivity.push({
      date: key,
      label: ARABIC_DAY_LABELS[d.getDay()],
      count: state.activityLog[key] ?? 0,
    });
  }

  return {
    totalLearned: learnedSet.size,
    masteredCount,
    inProgressCount,
    streak: state.streak,
    xp: state.xp,
    dailyGoal,
    learnedToday: state.activityLog[today] ?? 0,
    perLevel,
    weeklyActivity,
    unlockedAchievements: [...state.unlockedAchievements],
    bestSessionAccuracy: state.bestSessionAccuracy,
    placement: state.placement,
  };
}
