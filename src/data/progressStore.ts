import type { LevelCode, Word } from '@/types';
import { getWordsByLevel, getAllLevels, getWordById } from '@/data/vocabularyRepository';
import { ACHIEVEMENTS } from '@/data/achievements';

const STORAGE_KEY = 'words-app-progress-v2';

/**
 * Spaced-repetition word lifecycle:
 *   new       → never seen
 *   learning  → first exposure, short intervals until first Good/Easy
 *   review    → in the spaced-repetition queue, intervals grow with ease
 *   mastered  → answered correctly enough times to graduate from review
 */
export type WordStatus = 'new' | 'learning' | 'review' | 'mastered';

/**
 * Self-grade the user gives after answering, mapped to interval rules.
 * Mirrors Anki's four-button model so the rules stay transparent.
 */
export type SrsGrade = 'again' | 'hard' | 'good' | 'easy';

export type LessonProgress = {
  completed: boolean;
  bestScore: number; // 0-100
  completedAt: string | null;
};

export type WordProgress = {
  status: WordStatus;
  correctCount: number;
  wrongCount: number;
  /** Spaced-repetition interval in days (0 = due immediately). */
  intervalDays: number;
  /** Ease factor — multiplier adjusted up/down by Hard/Easy. Starts at 2.5. */
  ease: number;
  /** Times answered correctly in a row (resets on Again/Wrong). */
  reps: number;
  /** ISO date (YYYY-MM-DD) when the word is next due for review. */
  dueDate: string | null;
  /** ISO timestamp of the last answer. */
  lastPracticedAt: string | null;
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

/* ------------------------------------------------------------------ */
/* Spaced-repetition core
/*
/* Transparent rules — each grade maps to an interval:
/*   again / wrong → review very soon (10 min within the learning step,
/*                  or 1 day once in review; reps reset)
/*   hard          → short interval (interval × 1.2, ease -0.2)
/*   good          → normal interval (interval × ease, ease unchanged)
/*   easy          → longer interval (interval × ease × 1.3, ease +0.15)
/*
/* Lifecycle: new → learning → review → mastered.
/*   - First answer on a "new" word moves it to "learning" and seeds a
/*     short interval so it reappears quickly in the same session.
/*   - "learning" words graduate to "review" on their first Good/Easy.
/*   - "review" words become "mastered" after MASTER_REPS consecutive
/*     correct reps (default 5) and a sane interval (>= 21 days).
/* ------------------------------------------------------------------ */

const MIN_EASE = 1.3;
const MAX_EASE = 3.0;
const MASTER_REPS = 5;
const MASTER_INTERVAL_DAYS = 21;

const LEARNING_AGAIN_MIN = 10; // minutes
const LEARNING_HARD_MIN = 30; // minutes
const LEARNING_GOOD_MIN = 1440; // 1 day
const LEARNING_EASY_DAYS = 4;

const DAY_MS = 24 * 60 * 60 * 1000;
const MIN_MS = 60 * 1000;

function dateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function addDaysKey(base: Date, days: number): string {
  const d = new Date(base.getTime() + days * DAY_MS);
  return dateKey(d);
}

export type SrsResult = {
  status: WordStatus;
  intervalDays: number;
  ease: number;
  reps: number;
  dueDate: string | null;
  correctCount: number;
  wrongCount: number;
  lastPracticedAt: string;
};

/**
 * Pure function: given current progress + a grade, compute the next SRS state.
 * Exported so the UI can preview the next interval before the user picks a grade.
 */
export function computeSrs(
  prev: WordProgress | undefined,
  grade: SrsGrade,
  now: Date = new Date(),
): SrsResult {
  const status = prev?.status ?? 'new';
  const easePrev = prev?.ease ?? 2.5;
  const repsPrev = prev?.reps ?? 0;
  const intervalPrev = prev?.intervalDays ?? 0;
  const correctCount = (prev?.correctCount ?? 0) + (grade === 'again' ? 0 : 1);
  const wrongCount = (prev?.wrongCount ?? 0) + (grade === 'again' ? 1 : 0);
  const isCorrect = grade !== 'again';

  // --- Learning step (new + learning) ---
  if (status === 'new' || status === 'learning') {
    if (grade === 'again') {
      // Same-session re-learning; due in ~10 min (stored as 0 days, due today)
      return {
        status: 'learning',
        intervalDays: 0,
        ease: easePrev,
        reps: 0,
        dueDate: dateKey(new Date(now.getTime() + LEARNING_AGAIN_MIN * MIN_MS)),
        correctCount,
        wrongCount,
        lastPracticedAt: now.toISOString(),
      };
    }
    if (grade === 'hard') {
      return {
        status: 'learning',
        intervalDays: 0,
        ease: Math.max(MIN_EASE, easePrev - 0.2),
        reps: 0,
        dueDate: dateKey(new Date(now.getTime() + LEARNING_HARD_MIN * MIN_MS)),
        correctCount,
        wrongCount,
        lastPracticedAt: now.toISOString(),
      };
    }
    if (grade === 'good') {
      // Graduate to review with a 1-day interval
      return {
        status: 'review',
        intervalDays: 1,
        ease: easePrev,
        reps: 1,
        dueDate: addDaysKey(now, 1),
        correctCount,
        wrongCount,
        lastPracticedAt: now.toISOString(),
      };
    }
    // easy — graduate with a longer interval
    return {
      status: 'review',
      intervalDays: LEARNING_EASY_DAYS,
      ease: Math.min(MAX_EASE, easePrev + 0.15),
      reps: 1,
      dueDate: addDaysKey(now, LEARNING_EASY_DAYS),
      correctCount,
      wrongCount,
      lastPracticedAt: now.toISOString(),
    };
  }

  // --- Review + mastered step ---
  if (grade === 'again') {
    // Lapse: back to learning, reps reset, due very soon
    return {
      status: 'learning',
      intervalDays: 0,
      ease: Math.max(MIN_EASE, easePrev - 0.2),
      reps: 0,
      dueDate: addDaysKey(now, 1),
      correctCount,
      wrongCount,
      lastPracticedAt: now.toISOString(),
    };
  }

  const reps = repsPrev + 1;
  let ease = easePrev;
  let multiplier = easePrev;
  if (grade === 'hard') {
    ease = Math.max(MIN_EASE, easePrev - 0.2);
    multiplier = 1.2;
  } else if (grade === 'easy') {
    ease = Math.min(MAX_EASE, easePrev + 0.15);
    multiplier = easePrev * 1.3;
  }

  // Interval grows from the previous interval × multiplier, with a
  // minimum of 1 day so "good" on a fresh review word advances.
  const intervalDays = Math.max(1, Math.round(intervalPrev * multiplier));

  // Graduate to mastered after enough consecutive reps + a long interval
  const mastered = isCorrect && reps >= MASTER_REPS && intervalDays >= MASTER_INTERVAL_DAYS;

  return {
    status: mastered ? 'mastered' : 'review',
    intervalDays,
    ease,
    reps,
    dueDate: addDaysKey(now, intervalDays),
    correctCount,
    wrongCount,
    lastPracticedAt: now.toISOString(),
  };
}

/** Human-readable preview of the next review time for a grade. */
export function previewInterval(
  prev: WordProgress | undefined,
  grade: SrsGrade,
  now: Date = new Date(),
): string {
  const r = computeSrs(prev, grade, now);
  if (r.intervalDays <= 0) return 'خلال دقائق';
  if (r.intervalDays === 1) return 'غداً';
  if (r.intervalDays < 7) return `بعد ${r.intervalDays} أيام`;
  if (r.intervalDays < 30) return `بعد ${Math.round(r.intervalDays / 7)} أسابيع`;
  return `بعد ${Math.round(r.intervalDays / 30)} أشهر`;
}

/**
 * Record an answer with an explicit SRS grade.
 * `correct` is derived from the grade for backward-compat counters.
 */
export function recordWordAnswer(wordId: string, correct: boolean): void {
  // Map legacy boolean answer to a grade so existing callers keep working.
  const grade: SrsGrade = correct ? 'good' : 'again';
  recordWordGrade(wordId, grade);
}

export function recordWordGrade(wordId: string, grade: SrsGrade): void {
  const existing = currentState.words[wordId];
  const result = computeSrs(existing, grade);
  const wasLearned = currentState.learnedWordIds.includes(wordId);
  const learnedSet = new Set(currentState.learnedWordIds);
  // Mark as "learned" once it leaves the new state
  if (result.status !== 'new' && !wasLearned) learnedSet.add(wordId);
  // A lapse back to learning should NOT remove it from learnedWordIds —
  // it was learned once; it just needs review.

  const now = new Date();
  const today = dateKey(now);
  const newlyLearned = learnedSet.size - currentState.learnedWordIds.length;

  currentState = {
    ...currentState,
    words: {
      ...currentState.words,
      [wordId]: {
        status: result.status,
        correctCount: result.correctCount,
        wrongCount: result.wrongCount,
        intervalDays: result.intervalDays,
        ease: result.ease,
        reps: result.reps,
        dueDate: result.dueDate,
        lastPracticedAt: result.lastPracticedAt,
      },
    },
    learnedWordIds: [...learnedSet],
    xp: currentState.xp + (grade === 'again' ? 1 : 5),
    activityLog: bumpActivity(currentState, today, newlyLearned),
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
  dueDate: string | null;
};

/**
 * A word is due if it has no dueDate, its dueDate <= today, or it's still
 * in the learning state (short intervals fall due within the day).
 */
function isDue(progress: WordProgress, today: string): boolean {
  if (progress.status === 'mastered') return false;
  if (progress.status === 'learning') return true;
  if (!progress.dueDate) return true;
  return progress.dueDate <= today;
}

/**
 * Returns words that are due for review, sorted by priority:
 *   1. learning words (highest — short intervals, need immediate practice)
 *   2. overdue review words (most overdue first)
 *   3. words with wrong answers (more wrongs = higher priority)
 * Mastered words and not-yet-due review words are excluded.
 */
export function getReviewWords(): ReviewEntry[] {
  const today = dateKey(new Date());
  const entries: ReviewEntry[] = [];

  for (const [wordId, progress] of Object.entries(currentState.words)) {
    if (!isDue(progress, today)) continue;

    const weight = Math.max(
      1,
      (progress.wrongCount + 1) * (progress.status === 'learning' ? 2 : 1),
    );

    entries.push({
      wordId,
      wrongCount: progress.wrongCount,
      correctCount: progress.correctCount,
      status: progress.status,
      weight,
      dueDate: progress.dueDate,
    });
  }

  entries.sort((a, b) => {
    if (a.status === 'learning' && b.status !== 'learning') return -1;
    if (b.status === 'learning' && a.status !== 'learning') return 1;
    if (b.wrongCount !== a.wrongCount) return b.wrongCount - a.wrongCount;
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
  const fresh = levelWords.filter(
    (w) => !learnedSet.has(w.id) && currentState.words[w.id]?.status !== 'learning',
  );
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

export function recordSessionWord(wordId: string, grade: SrsGrade): DailySession {
  recordWordGrade(wordId, grade);

  const session = loadSession();
  if (!session) {
    // No active session — still recorded the answer, just no session to update
    return { date: dateKey(new Date()), wordIds: [], completedCount: 0, done: true };
  }

  // Count a step as completed once the word has been answered (any grade),
  // since every answer advances the SRS state.
  const completedCount = session.completedCount + 1;
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
  dueCount: number;
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

export function getProgressSummary(dailyGoal: number): ProgressSummary {
  const state = currentState;
  const today = dateKey(new Date());

  const learnedSet = new Set(state.learnedWordIds);
  let masteredCount = 0;
  let inProgressCount = 0;

  for (const id of learnedSet) {
    const p = state.words[id];
    if (p?.status === 'mastered') masteredCount++;
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
    dueCount: getReviewWords().length,
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
