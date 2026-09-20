import wordsData from '@/data/words.json';
import lessonsData from '@/data/lessons.json';
import categoriesData from '@/data/categories.json';
import levelsData from '@/data/levels.json';
import appData from '@/data/app.json';
import type { Category, Lesson, Level, LevelCode, Word } from '@/types';

const words = wordsData as Word[];
const lessons = lessonsData as Lesson[];
const categories = categoriesData as Category[];
const levels = levelsData as Level[];

const byId = new Map<string, Word>(words.map((w) => [w.id, w]));
const byLevel = new Map<LevelCode, Word[]>(
  levels.map((lvl) => [
    lvl.code,
    words
      .filter((w) => w.cefrLevel === lvl.code)
      .sort((a, b) => a.order - b.order),
  ]),
);

/* ------------------------------------------------------------------ */
/* Words
/* ------------------------------------------------------------------ */

export function getAllWords(): Word[] {
  return words;
}

export function getWordCount(): number {
  return words.length;
}

export function getWordById(id: string): Word | undefined {
  return byId.get(id);
}

export function getWordsByLevel(level: LevelCode): Word[] {
  return byLevel.get(level) ?? [];
}

export function getWordsByLesson(lessonId: string): Word[] {
  const lesson = getLessonById(lessonId);
  if (!lesson) return [];
  return lesson.wordIds
    .map((id) => byId.get(id))
    .filter((w): w is Word => Boolean(w));
}

export function getWordsByCategory(categoryId: string): Word[] {
  return words.filter((w) => w.category === categoryId);
}

export type SearchOptions = {
  level?: LevelCode;
  category?: string;
  limit?: number;
};

/**
 * Search words by English text or Arabic translation.
 * Matches are case-insensitive and prefix/substring based.
 */
export function searchWords(query: string, options: SearchOptions = {}): Word[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  let results = words.filter(
    (w) =>
      w.word.toLowerCase().includes(q) ||
      w.arabicTranslation.includes(query.trim()),
  );

  if (options.level) {
    results = results.filter((w) => w.cefrLevel === options.level);
  }
  if (options.category) {
    results = results.filter((w) => w.category === options.category);
  }
  if (options.limit !== undefined) {
    results = results.slice(0, options.limit);
  }

  return results.sort((a, b) => a.order - b.order);
}

/* ------------------------------------------------------------------ */
/* Lessons
/* ------------------------------------------------------------------ */

export function getAllLessons(): Lesson[] {
  return [...lessons].sort((a, b) => a.order - b.order);
}

export function getLessonsByLevel(level: LevelCode): Lesson[] {
  return lessons
    .filter((l) => l.level === level)
    .sort((a, b) => a.order - b.order);
}

export function getLessonById(id: string): Lesson | undefined {
  return lessons.find((l) => l.id === id);
}

/* ------------------------------------------------------------------ */
/* Categories & Levels (meta)
/* ------------------------------------------------------------------ */

export function getAllCategories(): Category[] {
  return categories;
}

export function getCategoryById(id: string): Category | undefined {
  return categories.find((c) => c.id === id);
}

export function getAllLevels(): Level[] {
  return levels;
}

export function getLevelByCode(code: LevelCode): Level | undefined {
  return levels.find((l) => l.code === code);
}

export function getAppConfig() {
  return appData;
}
