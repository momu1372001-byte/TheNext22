import type { OnboardingState } from '@/types';

const STORAGE_KEY = 'words-app-profile-v1';

const INITIAL: OnboardingState = {
  level: null,
  dailyGoal: 0,
  completed: false,
};

function load(): OnboardingState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...INITIAL };
    const parsed = JSON.parse(raw) as Partial<OnboardingState>;
    return {
      level: parsed.level ?? null,
      dailyGoal: parsed.dailyGoal ?? 0,
      completed: parsed.completed ?? false,
    };
  } catch {
    return { ...INITIAL };
  }
}

function save(profile: OnboardingState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch {
    // ignore quota errors
  }
}

export function loadProfile(): OnboardingState {
  return load();
}

export function saveProfile(profile: OnboardingState): void {
  save(profile);
}

export function updateProfile(partial: Partial<OnboardingState>): OnboardingState {
  const current = load();
  const next = { ...current, ...partial };
  save(next);
  return next;
}

export function clearProfile(): OnboardingState {
  save({ ...INITIAL });
  return { ...INITIAL };
}
