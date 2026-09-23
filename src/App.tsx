import { useEffect, useState } from 'react';
import { PhoneFrame, TabBar } from '@/components/ui';
import { loadProfile, saveProfile, updateProfile, clearProfile, loadProfileFromCloud } from '@/data/profileStore';
import { resetProgress, subscribe, getReviewWords } from '@/data/progressStore';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import type { OnboardingState, TabKey } from '@/types';
import AuthScreen from '@/screens/AuthScreen';
import OnboardingScreen from '@/screens/OnboardingScreen';
import LearnScreen from '@/screens/LearnScreen';
import ReviewScreen from '@/screens/ReviewScreen';
import ProgressScreen from '@/screens/ProgressScreen';
import ProfileScreen from '@/screens/ProfileScreen';
import SettingsScreen from '@/SettingsScreen';
import { useSettings } from '@/useSettings';
import { Loader2 } from 'lucide-react';

function AppContent() {
  const { user, loading } = useAuth();
  const [profile, setProfile] = useState<OnboardingState>(() => loadProfile());
  const [activeTab, setActiveTab] = useState<TabKey>('learn');
  const [showSettings, setShowSettings] = useState(false);
  const { settings } = useSettings();

  const [, setTick] = useState(0);
  useEffect(() => subscribe(() => setTick((t) => t + 1)), []);

  // When user signs in, load their profile from the cloud
  useEffect(() => {
    if (user) {
      loadProfileFromCloud(user.id).then((cloudProfile) => {
        if (cloudProfile) setProfile(cloudProfile);
      });
    } else {
      setProfile(loadProfile());
    }
  }, [user]);

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

  // 1. Auth loading
  if (loading) {
    return (
      <PhoneFrame>
        <div className="flex flex-1 items-center justify-center">
          <Loader2 size={32} className="animate-spin text-primary-500" />
        </div>
      </PhoneFrame>
    );
  }

  // 2. Not signed in → auth screen
  if (!user) {
    return (
      <PhoneFrame>
        <AuthScreen />
      </PhoneFrame>
    );
  }

  // 3. Signed in but onboarding not done
  if (!profile.completed || !profile.level) {
    return (
      <PhoneFrame>
        <OnboardingScreen onComplete={handleOnboardingComplete} />
      </PhoneFrame>
    );
  }

  // 4. Settings overlay
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

  // 5. Main app
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
      <TabBar active={activeTab} onChange={setActiveTab} reviewDueCount={getReviewWords().length} />
    </PhoneFrame>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
