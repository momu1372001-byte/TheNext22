import { useEffect, useState } from 'react';
import {
  User,
  Flame,
  Zap,
  BookOpen,
  CheckCircle2,
  Loader2,
  Bell,
  Star,
  HelpCircle,
  ChevronLeft,
  Check,
  GraduationCap,
  Target,
  Settings,
  X,
  Award,
  Lock,
  LogOut,
} from 'lucide-react';
import { Screen, ScreenHeader, Card, Button } from '@/components/ui';
import { getProgressSummary, subscribe, type ProgressSummary } from '@/data/progressStore';
import { getLevelByCode } from '@/data/vocabularyRepository';
import { ACHIEVEMENTS } from '@/data/achievements';
import { useAuth } from '@/hooks/useAuth';
import type { OnboardingState, LevelCode, DailyGoal, Level } from '@/types';
import levelsData from '@/data/levels.json';
import goalsData from '@/data/goals.json';

type ProfileScreenProps = {
  profile: OnboardingState;
  onUpdateProfile: (partial: Partial<OnboardingState>) => void;
  onResetOnboarding: () => void;
  onOpenSettings: () => void;
};

const typedLevels = levelsData as Level[];
const typedGoals = goalsData as DailyGoal[];

function useSummary(dailyGoal: number) {
  const [summary, setSummary] = useState<ProgressSummary>(() => getProgressSummary(dailyGoal));

  useEffect(() => {
    setSummary(getProgressSummary(dailyGoal));
    return subscribe(() => setSummary(getProgressSummary(dailyGoal)));
  }, [dailyGoal]);

  return summary;
}

/* ------------------------------------------------------------------ */
/* Bottom sheet for picking level or goal
/* ------------------------------------------------------------------ */

type SheetMode = 'level' | 'goal' | null;

function PickerSheet({
  mode,
  currentLevel,
  currentGoal,
  onClose,
  onPickLevel,
  onPickGoal,
}: {
  mode: SheetMode;
  currentLevel: LevelCode | null;
  currentGoal: number;
  onClose: () => void;
  onPickLevel: (level: LevelCode) => void;
  onPickGoal: (goal: number) => void;
}) {
  if (!mode) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      <div className="relative bg-surface-raised border-t border-border rounded-t-2xl p-5 pb-8 animate-slide-up max-h-[80%] overflow-y-auto no-scrollbar">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-bold text-text-primary">
            {mode === 'level' ? 'تغيير المستوى' : 'تغيير الهدف اليومي'}
          </h3>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-pill bg-white/5 text-text-secondary hover:text-text-primary"
            aria-label="إغلاق"
          >
            <X size={18} />
          </button>
        </div>

        {mode === 'level' && (
          <div className="flex flex-col gap-2.5">
            {typedLevels.map((lvl) => {
              const selected = currentLevel === lvl.code;
              return (
                <button
                  key={lvl.code}
                  onClick={() => onPickLevel(lvl.code)}
                  className={`flex items-center gap-3 p-3.5 rounded-lg border transition-all duration-150 text-right ${
                    selected
                      ? 'border-primary-500/70 bg-primary-500/10'
                      : 'border-border bg-surface hover:border-primary-500/40'
                  }`}
                >
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold ltr"
                    style={{ backgroundColor: `${lvl.color}22`, color: lvl.color }}
                  >
                    {lvl.code}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-text-primary text-sm">{lvl.nameAr}</p>
                    <p className="text-2xs text-text-muted truncate">{lvl.descriptionAr}</p>
                  </div>
                  {selected && (
                    <span className="flex h-6 w-6 items-center justify-center rounded-pill bg-primary-500 text-neutral-950">
                      <Check size={14} strokeWidth={3} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {mode === 'goal' && (
          <div className="flex flex-col gap-2.5">
            {typedGoals.map((g) => {
              const selected = currentGoal === g.value;
              return (
                <button
                  key={g.value}
                  onClick={() => onPickGoal(g.value)}
                  className={`flex items-center gap-3 p-3.5 rounded-lg border transition-all duration-150 text-right ${
                    selected
                      ? 'border-primary-500/70 bg-primary-500/10'
                      : 'border-border bg-surface hover:border-primary-500/40'
                  }`}
                >
                  <span className="text-2xl font-bold text-primary-500 ltr w-10 text-center">
                    {g.value}
                  </span>
                  <div className="flex-1">
                    <p className="font-semibold text-text-primary text-sm">{g.labelAr}</p>
                    <p className="text-2xs text-text-muted">{g.hintAr}</p>
                  </div>
                  {selected && (
                    <span className="flex h-6 w-6 items-center justify-center rounded-pill bg-primary-500 text-neutral-950">
                      <Check size={14} strokeWidth={3} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Quick stat pill
/* ------------------------------------------------------------------ */

function QuickStat({
  icon,
  value,
  label,
  accent,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  accent: string;
}) {
  return (
    <div className={`flex items-center gap-2.5 rounded-lg p-3 ${accent}`}>
      <span className="shrink-0">{icon}</span>
      <div className="min-w-0">
        <span className="text-lg font-bold text-text-primary ltr block leading-none tabular-nums">
          {value}
        </span>
        <span className="text-2xs text-text-muted leading-tight">{label}</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main screen
/* ------------------------------------------------------------------ */

export function ProfileScreen({ profile, onUpdateProfile, onResetOnboarding, onOpenSettings }: ProfileScreenProps) {
  const { user, signOut } = useAuth();
  const summary = useSummary(profile.dailyGoal || 10);
  const [sheet, setSheet] = useState<SheetMode>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);

  const currentLevel = getLevelByCode(profile.level ?? 'A1');

  const settings = [
    { icon: <Bell size={18} />, labelAr: 'الإشعارات', hintAr: 'تذكير يومي' },
    { icon: <Star size={18} />, labelAr: 'تقييم التطبيق', hintAr: 'شاركنا رأيك' },
    { icon: <HelpCircle size={18} />, labelAr: 'المساعدة والدعم', hintAr: 'الأسئلة الشائعة' },
  ];

  const handlePickLevel = (level: LevelCode) => {
    onUpdateProfile({ level });
    setSheet(null);
  };

  const handlePickGoal = (goal: number) => {
    onUpdateProfile({ dailyGoal: goal });
    setSheet(null);
  };

  return (
    <Screen>
      <ScreenHeader
        titleAr="حسابي"
        subtitleAr="ملفك وتقدّمك"
        icon={<User size={22} />}
        action={
          <button
            onClick={onOpenSettings}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-text-secondary hover:text-text-primary transition-colors"
            aria-label="الإعدادات"
          >
            <Settings size={18} />
          </button>
        }
      />

      <div className="flex flex-col gap-4 px-5 pb-8">
        {/* User card */}
        <Card raised className="p-5 animate-fade-up">
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-400 to-accent-500 text-neutral-950 shadow-glow">
                <GraduationCap size={32} />
              </div>
              <span
                className="absolute -bottom-1 -right-1 flex h-6 w-9 items-center justify-center rounded-md text-2xs font-bold ltr border-2 border-surface-raised"
                style={{ backgroundColor: `${currentLevel?.color}22`, color: currentLevel?.color }}
              >
                {profile.level ?? '—'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-lg font-bold text-text-primary ltr truncate">
                {user?.email ?? 'متعلم'}
              </p>
              <p className="text-sm text-text-muted">
                {currentLevel?.nameAr ?? '—'} · {currentLevel?.nameEn ?? '—'}
              </p>
            </div>
          </div>

          {/* Streak + XP inline */}
          <div className="flex items-center gap-3 mt-4 pt-4 border-t border-white/5">
            <div className="flex items-center gap-2 flex-1">
              <Flame size={18} className="text-warning-400" />
              <span className="text-lg font-bold text-text-primary ltr tabular-nums">
                {summary.streak}
              </span>
              <span className="text-2xs text-text-muted">أيام متتالية</span>
            </div>
            <div className="w-px h-6 bg-white/10" />
            <div className="flex items-center gap-2 flex-1">
              <Zap size={18} className="text-primary-400" />
              <span className="text-lg font-bold text-text-primary ltr tabular-nums">
                {summary.xp.toLocaleString('en-US')}
              </span>
              <span className="text-2xs text-text-muted">XP</span>
            </div>
          </div>
        </Card>

        {/* Quick stats */}
        <div className="grid grid-cols-2 gap-3">
          <QuickStat
            icon={<BookOpen size={18} className="text-primary-400" />}
            value={summary.totalLearned.toLocaleString('en-US')}
            label="كلمات تعلّمتها"
            accent="bg-primary-500/10"
          />
          <QuickStat
            icon={<CheckCircle2 size={18} className="text-success-400" />}
            value={summary.masteredCount.toLocaleString('en-US')}
            label="كلمات أتقنتها"
            accent="bg-success-500/10"
          />
          <QuickStat
            icon={<Loader2 size={18} className="text-accent-400" />}
            value={summary.inProgressCount.toLocaleString('en-US')}
            label="قيد التعلّم"
            accent="bg-accent-500/10"
          />
          <QuickStat
            icon={<Target size={18} className="text-warning-400" />}
            value={`${summary.learnedToday}/${summary.dailyGoal}`}
            label="هدف اليوم"
            accent="bg-warning-500/10"
          />
        </div>

        {/* Achievements */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between px-1">
            <p className="text-2xs font-semibold text-text-muted">الإنجازات</p>
            <span className="text-2xs text-text-muted ltr tabular-nums">
              {summary.unlockedAchievements.length}/{ACHIEVEMENTS.length}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2.5">
            {ACHIEVEMENTS.map((ach) => {
              const unlocked = summary.unlockedAchievements.includes(ach.id);
              const Icon = unlocked ? ach.icon : Lock;
              return (
                <div
                  key={ach.id}
                  className={`flex flex-col items-center gap-1.5 rounded-lg border p-3 text-center transition-all ${
                    unlocked
                      ? 'border-primary-500/40 bg-primary-500/5'
                      : 'border-border/50 bg-surface/50 opacity-60'
                  }`}
                >
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                      unlocked ? 'bg-primary-500/15 text-primary-400' : 'bg-white/5 text-text-muted'
                    }`}
                  >
                    <Icon size={18} />
                  </span>
                  <span className={`text-2xs font-semibold leading-tight ${unlocked ? 'text-text-primary' : 'text-text-muted'}`}>
                    {ach.titleAr}
                  </span>
                  <span className="text-2xs text-text-muted leading-tight">{ach.descriptionAr}</span>
                  {unlocked && (
                    <span className="text-2xs text-primary-400 ltr">+{ach.xpReward} XP</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Editable preferences */}
        <div className="flex flex-col gap-3">
          <p className="text-2xs font-semibold text-text-muted px-1">تفضيلاتي</p>

          <Card
            className="p-4 flex items-center gap-3 animate-fade-up cursor-pointer hover:border-primary-500/50 transition-all"
            onClick={() => setSheet('level')}
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500/15 text-primary-400">
              <GraduationCap size={18} />
            </span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-text-primary">المستوى</p>
              <p className="text-2xs text-text-muted">
                {currentLevel?.nameAr} — {currentLevel?.code}
              </p>
            </div>
            <ChevronLeft size={18} className="text-text-muted rotate-180" />
          </Card>

          <Card
            className="p-4 flex items-center gap-3 animate-fade-up cursor-pointer hover:border-primary-500/50 transition-all"
            onClick={() => setSheet('goal')}
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-success-500/15 text-success-400">
              <Target size={18} />
            </span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-text-primary">الهدف اليومي</p>
              <p className="text-2xs text-text-muted">
                {typedGoals.find((g) => g.value === profile.dailyGoal)?.labelAr ?? '—'} ·{' '}
                {profile.dailyGoal} كلمة
              </p>
            </div>
            <ChevronLeft size={18} className="text-text-muted rotate-180" />
          </Card>
        </div>

        {/* Settings list */}
        <div className="flex flex-col gap-3">
          <p className="text-2xs font-semibold text-text-muted px-1">الإعدادات</p>
          {settings.map((s) => (
            <Card key={s.labelAr} className="p-4 flex items-center gap-3 animate-fade-up">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-text-secondary">
                {s.icon}
              </span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-text-primary">{s.labelAr}</p>
                <p className="text-2xs text-text-muted">{s.hintAr}</p>
              </div>
              <ChevronLeft size={18} className="text-text-muted rotate-180" />
            </Card>
          ))}
        </div>

        {/* Logout */}
        <div className="pt-2">
          {!confirmLogout ? (
            <Button
              variant="ghost"
              fullWidth
              icon={<LogOut size={18} className="rotate-180" />}
              onClick={() => setConfirmLogout(true)}
              className="text-text-secondary hover:text-text-primary hover:bg-white/5"
            >
              تسجيل الخروج
            </Button>
          ) : (
            <Card className="p-4 animate-fade-up border-warning-500/30">
              <p className="text-sm font-semibold text-text-primary mb-1">تسجيل الخروج؟</p>
              <p className="text-2xs text-text-muted mb-3">
                سيتم حفظ تقدّمك. يمكنك العودة بتسجيل الدخول مرة أخرى.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  fullWidth
                  onClick={() => setConfirmLogout(false)}
                >
                  إلغاء
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  fullWidth
                  className="bg-warning-500 hover:bg-warning-400 shadow-none"
                  onClick={() => { signOut(); setConfirmLogout(false); }}
                >
                  خروج
                </Button>
              </div>
            </Card>
          )}
        </div>

        {/* Reset */}
        <div>
          {!confirmReset ? (
            <Button
              variant="ghost"
              fullWidth
              onClick={() => setConfirmReset(true)}
              className="text-error-400 hover:text-error-500 hover:bg-error-500/5"
            >
              إعادة ضبط كل البيانات
            </Button>
          ) : (
            <Card className="p-4 animate-fade-up border-error-500/30">
              <p className="text-sm font-semibold text-text-primary mb-1">تأكيد إعادة الضبط</p>
              <p className="text-2xs text-text-muted mb-3">
                سيتم حذف كل تقدّمك وكلماتك وسلسلة أيامك. لا يمكن التراجع.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  fullWidth
                  onClick={() => setConfirmReset(false)}
                >
                  إلغاء
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  fullWidth
                  className="bg-error-500 hover:bg-error-400 shadow-none"
                  onClick={() => {
                    onResetOnboarding();
                    setConfirmReset(false);
                  }}
                >
                  إعادة الضبط
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>

      <PickerSheet
        mode={sheet}
        currentLevel={profile.level}
        currentGoal={profile.dailyGoal}
        onClose={() => setSheet(null)}
        onPickLevel={handlePickLevel}
        onPickGoal={handlePickGoal}
      />
    </Screen>
  );
}

export default ProfileScreen;
