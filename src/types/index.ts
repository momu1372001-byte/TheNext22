export type LevelCode = 'A1' | 'A2' | 'B1' | 'B2' | 'C1';

export type Level = {
  code: LevelCode;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  color: string;
};

export type DailyGoal = {
  value: number;
  labelAr: string;
  hintAr: string;
};

export type OnboardingState = {
  level: LevelCode | null;
  dailyGoal: number;
  completed: boolean;
};

export type TabKey = 'learn' | 'review' | 'progress' | 'profile';

export type PartOfSpeech = 'noun' | 'verb' | 'adjective' | 'adverb' | 'preposition' | 'conjunction' | 'pronoun' | 'phrase';

export type Difficulty = 1 | 2 | 3 | 4 | 5;

export type Category = {
  id: string;
  nameAr: string;
  nameEn: string;
  icon: string;
};

export type LessonType = 'vocabulary' | 'grammar' | 'listening' | 'reading' | 'writing' | 'speaking';

export type Lesson = {
  id: string;
  level: LevelCode;
  category: string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  order: number;
  wordIds: string[];
  type?: LessonType;
};

/**
 * A single vocabulary word. This is the canonical shape used by the
 * repository and every screen. Content lives entirely in JSON under
 * /src/data, so the data source can be swapped later without touching UI.
 */
export type Word = {
  id: string;
  word: string;
  arabicTranslation: string;
  englishDefinition: string;
  partOfSpeech: PartOfSpeech;
  cefrLevel: LevelCode;
  category: string;
  exampleSentence: string;
  arabicExampleTranslation: string;
  pronunciation: string;
  difficulty: Difficulty;
  order: number;
};
