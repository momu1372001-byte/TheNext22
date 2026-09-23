import type { OnboardingState } from '@/types';
import { supabase } from '@/lib/supabase';

const STORAGE_KEY = 'words-app-profile-v1';

const INITIAL: OnboardingState = {
  level: null,
  dailyGoal: 0,
  completed: false,
};

function loadLocal(): OnboardingState {
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

function saveLocal(profile: OnboardingState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch {
    // ignore quota errors
  }
}

export function loadProfile(): OnboardingState {
  return loadLocal();
}

export function saveProfile(profile: OnboardingState): void {
  saveLocal(profile);
  void syncProfileToCloud(profile);
}

export function updateProfile(partial: Partial<OnboardingState>): OnboardingState {
  const current = loadLocal();
  const next = { ...current, ...partial };
  saveLocal(next);
  void syncProfileToCloud(next);
  return next;
}

export function clearProfile(): OnboardingState {
  saveLocal({ ...INITIAL });
  return { ...INITIAL };
}

/** Load profile from Supabase for the authenticated user, falling back to local. */
export async function loadProfileFromCloud(userId: string): Promise<OnboardingState | null> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('level, daily_goal, onboarding_completed')
    .eq('id', userId)
    .maybeSingle();

  if (error || !data) return null;

  const cloud: OnboardingState = {
    level: (data.level as OnboardingState['level']) ?? null,
    dailyGoal: data.daily_goal ?? 0,
    completed: data.onboarding_completed ?? false,
  };

  saveLocal(cloud);
  return cloud;
}

async function syncProfileToCloud(profile: OnboardingState): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from('user_profiles')
    .upsert({
      id: user.id,
      level: profile.level,
      daily_goal: profile.dailyGoal,
      onboarding_completed: profile.completed,
      updated_at: new Date().toISOString(),
    });
}
