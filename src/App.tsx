import { useEffect, useState } from 'react';
import { PhoneFrame, TabBar } from '@/components/ui';
import { loadProfile, saveProfile, updateProfile, clearProfile } from '@/data/profileStore';
import { resetProgress, subscribe } from '@/data/progressStore';
import type { OnboardingState, TabKey } from '@/types';
import OnboardingScreen from '@/screens/OnboardingScreen';
import LearnScreen from '@/screens/LearnScreen';
import ReviewScreen from '@/screens/ReviewScreen';
import ProgressScreen from '@/screens/ProgressScreen';
import ProfileScreen from '@/screens/ProfileScreen';
import SettingsScreen from '@/SettingsScreen';
import { useSettings } from '@/useSettings';

export default function App() {
  const [profile, setProfile] = useState<OnboardingState>(() => loadProfile());
  const [activeTab, setActiveTab] = useState<TabKey>('learn');
  const [showSettings, setShowSettings] = useState(false);
  const { settings } = useSettings();

  // Re-render on progress store changes (streak/XP updates, etc.)
  const [, setTick] = useState(0);
  useEffect(() => subscribe(() => setTick((t) => t + 1)), []);

  const handleOnboardingComplete = (level: OnboardingState['level'], dailyGoal: number) => {
    const next = { level, dailyGoal, completed: true };
    saveProfile(next);
    setProfile(next);
  };

  const handleUpdateProfile = (partial: Partial<OnboardingState>) => {
    const next = updateProfile(partial);
    setProfile(next);
  };

  const handleResetOnboarding = () => {
    clearProfile();
    resetProgress();
    setProfile({ level: null, dailyGoal: 0, completed: false });
    setActiveTab('learn');
  };

  // Show onboarding if not completed
  if (!profile.completed || !profile.level) {
    return (
      <PhoneFrame>
        <OnboardingScreen onComplete={handleOnboardingComplete} />
      </PhoneFrame>
    );
  }

  // Settings overlay (accessible from profile tab)
  if (showSettings) {
    return (
      <PhoneFrame>
        <SettingsScreen
          profile={profile}
          onUpdateProfile={handleUpdateProfile}
          onResetProgress={resetProgress}
          onBack={() => setShowSettings(false)}
        />
      </PhoneFrame>
    );
  }

  return (
    <PhoneFrame>
      {activeTab === 'learn' && <LearnScreen profile={profile} />}
      {activeTab === 'review' && <ReviewScreen />}
      {activeTab === 'progress' && <ProgressScreen profile={profile} />}
      {activeTab === 'profile' && (
        <ProfileScreen
          profile={profile}
          onUpdateProfile={handleUpdateProfile}
          onResetOnboarding={handleResetOnboarding}
          onOpenSettings={() => setShowSettings(true)}
        />
      )}
      <TabBar active={activeTab} onChange={setActiveTab} />
    </PhoneFrame>
  );
}
