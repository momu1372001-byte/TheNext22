import { useState } from 'react';
import {
  Target,
  GraduationCap,
  Volume2,
  VolumeX,
  Bell,
  BellOff,
  Moon,
  Sun,
  RotateCcw,
  Info,
  ChevronLeft,
  Check,
  X,
  Zap,
  Flame,
  type LucideIcon,
} from 'lucide-react';
import { Screen, ScreenHeader, Card, Button } from '@/components/ui';
import { useSettings } from '@/useSettings';
import { getProgressSummary } from '@/data/progressStore';
import { getLevelByCode } from '@/data/vocabularyRepository';
import levelsData from '@/data/levels.json';
import goalsData from '@/data/goals.json';
import type { OnboardingState, LevelCode, Level, DailyGoal } from '@/types';

type SettingsScreenProps = {
  profile: OnboardingState;
  onUpdateProfile: (partial: Partial<OnboardingState>) => void;
  onResetProgress: () => void;
  onBack: () => void;
};

const APP_VERSION = '1.0.0';
const typedLevels = levelsData as Level[];
const typedGoals = goalsData as DailyGoal[];

export default function SettingsScreen({
  profile,
  onUpdateProfile,
  onResetProgress,
  onBack,
}: SettingsScreenProps) {
  const { settings, update } = useSettings();
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showAbout, setShowAbout] = useState(false);

  const summary = getProgressSummary(profile.dailyGoal || 10);
  const currentLevel = getLevelByCode(profile.level ?? 'A1');

  const handlePickLevel = (level: LevelCode) => {
    onUpdateProfile({ level });
  };

  const handlePickGoal = (goal: number) => {
    onUpdateProfile({ dailyGoal: goal });
  };

  return (
    <Screen>
      <ScreenHeader
        titleAr="الإعدادات"
        subtitleAr="خصّص تجربة التعلّم"
        icon={<RotateCcw size={22} />}
        action={
          <button
            onClick={onBack}
            className="flex h-9 w-9 items-center justify-center rounded-pill bg-white/5 text-text-secondary hover:text-text-primary transition-colors"
            aria-label="رجوع"
          >
            <ChevronLeft size={18} className="rotate-180" />
          </button>
        }
      />

      <div className="flex flex-col gap-4 px-5 pb-8">
        {/* Learning section */}
        <SectionLabel>التعلّم</SectionLabel>

        <Card className="overflow-hidden animate-fade-up">
          {/* Daily goal */}
          <div className="p-4 border-b border-white/5">
            <div className="flex items-center gap-3 mb-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-success-500/15 text-success-400 shrink-0">
                <Target size={18} />
              </span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-text-primary">الهدف اليومي</p>
                <p className="text-2xs text-text-muted">{profile.dailyGoal} كلمة يومياً</p>
              </div>
            </div>
            <div className="flex gap-2">
              {typedGoals.map((g) => {
                const selected = profile.dailyGoal === g.value;
                return (
                  <button
                    key={g.value}
                    onClick={() => handlePickGoal(g.value)}
                    className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 rounded-lg border transition-all duration-150 ${
                      selected
                        ? 'border-primary-500/70 bg-primary-500/10'
                        : 'border-border bg-surface hover:border-primary-500/40'
                    }`}
                  >
                    <span className={`text-lg font-bold ltr ${selected ? 'text-primary-500' : 'text-text-secondary'}`}>
                      {g.value}
                    </span>
                    <span className="text-2xs text-text-muted">{g.labelAr}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* CEFR level */}
          <div className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500/15 text-primary-400 shrink-0">
                <GraduationCap size={18} />
              </span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-text-primary">المستوى</p>
                <p className="text-2xs text-text-muted">{currentLevel?.nameAr ?? '—'} · {profile.level}</p>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              {typedLevels.map((lvl) => {
                const selected = profile.level === lvl.code;
                return (
                  <button
                    key={lvl.code}
                    onClick={() => handlePickLevel(lvl.code)}
                    className={`flex items-center justify-center h-10 w-12 rounded-lg border text-xs font-bold ltr transition-all duration-150 ${
                      selected
                        ? 'border-primary-500/70 bg-primary-500/10 text-primary-500'
                        : 'border-border bg-surface text-text-secondary hover:border-primary-500/40'
                    }`}
                    style={selected ? {} : { backgroundColor: `${lvl.color}15`, color: lvl.color, borderColor: `${lvl.color}40` }}
                  >
                    {lvl.code}
                  </button>
                );
              })}
            </div>
          </div>
        </Card>

        {/* Preferences section */}
        <SectionLabel>التفضيلات</SectionLabel>

        <Card className="animate-fade-up">
          <ToggleRow
            icon={settings.sound ? Volume2 : VolumeX}
            label="الصوت"
            hint={settings.sound ? 'مفعّل' : 'مطفأ'}
            checked={settings.sound}
            onChange={(v) => update('sound', v)}
          />
          <ToggleRow
            icon={settings.notifications ? Bell : BellOff}
            label="الإشعارات"
            hint={settings.notifications ? 'مفعّل' : 'مطفأ'}
            checked={settings.notifications}
            onChange={(v) => update('notifications', v)}
            divider
          />
          <ToggleRow
            icon={settings.darkMode ? Moon : Sun}
            label="الوضع الليلي"
            hint={settings.darkMode ? 'مفعّل' : 'مطفأ'}
            checked={settings.darkMode}
            onChange={(v) => update('darkMode', v)}
          />
        </Card>

        {/* Data section */}
        <SectionLabel>البيانات</SectionLabel>

        {!showResetConfirm ? (
          <Card
            className="p-4 flex items-center gap-3 animate-fade-up cursor-pointer hover:border-error-500/40 transition-all"
            onClick={() => setShowResetConfirm(true)}
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-error-500/15 text-error-400 shrink-0">
              <RotateCcw size={18} />
            </span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-text-primary">إعادة ضبط التقدّم</p>
              <p className="text-2xs text-text-muted">حذف كل الإحصائيات والسلسلة</p>
            </div>
            <ChevronLeft size={18} className="text-text-muted rotate-180" />
          </Card>
        ) : (
          <Card className="p-4 animate-fade-up border-error-500/30">
            <p className="text-sm font-semibold text-text-primary mb-1">تأكيد إعادة الضبط</p>
            <p className="text-2xs text-text-muted mb-3">
              سيتم حذف كل تقدّمك وكلماتك وسلسلة أيامك. لا يمكن التراجع.
            </p>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" fullWidth onClick={() => setShowResetConfirm(false)}>
                إلغاء
              </Button>
              <Button
                variant="primary"
                size="sm"
                fullWidth
                className="bg-error-500 hover:bg-error-400 shadow-none"
                onClick={() => {
                  onResetProgress();
                  setShowResetConfirm(false);
                }}
              >
                إعادة الضبط
              </Button>
            </div>
          </Card>
        )}

        {/* About */}
        <SectionLabel>حول التطبيق</SectionLabel>

        <Card
          className="p-4 flex items-center gap-3 animate-fade-up cursor-pointer hover:border-primary-500/40 transition-all"
          onClick={() => setShowAbout(true)}
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500/15 text-primary-400 shrink-0">
            <Info size={18} />
          </span>
          <div className="flex-1">
            <p className="text-sm font-semibold text-text-primary">حول التطبيق</p>
            <p className="text-2xs text-text-muted">الإصدار {APP_VERSION}</p>
          </div>
          <ChevronLeft size={18} className="text-text-muted rotate-180" />
        </Card>
      </div>

      {/* About modal */}
      {showAbout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-5" onClick={() => setShowAbout(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" />
          <div
            className="relative bg-surface-raised border border-border rounded-2xl p-6 max-w-xs w-full text-center animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowAbout(false)}
              className="absolute top-3 left-3 flex h-8 w-8 items-center justify-center rounded-pill bg-white/5 text-text-secondary hover:text-text-primary"
              aria-label="إغلاق"
            >
              <X size={18} />
            </button>
            <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-gradient-to-br from-primary-400 to-accent-500 text-neutral-950 shadow-glow mb-4">
              <span className="text-2xl font-bold">Aa</span>
            </div>
            <h4 className="text-lg font-bold text-text-primary">٦٥٠٠ كلمة إنجليزية</h4>
            <p className="text-sm text-text-muted mt-1">الإصدار {APP_VERSION}</p>
            <p className="text-2xs text-text-muted mt-4 leading-relaxed">
              تطبيق لتعلّم الإنجليزية كلمة بكلمة. حدّد هدفك، اختر مستواك، وبنِ سلسلتك يوماً بعد يوم.
            </p>
            <div className="flex items-center justify-center gap-4 mt-5 pt-4 border-t border-white/5">
              <div className="flex items-center gap-1.5">
                <Flame size={16} className="text-warning-400" />
                <span className="text-sm font-bold text-text-primary ltr">{summary.streak}</span>
                <span className="text-2xs text-text-muted">سلسلة</span>
              </div>
              <div className="w-px h-5 bg-white/10" />
              <div className="flex items-center gap-1.5">
                <Zap size={16} className="text-primary-400" />
                <span className="text-sm font-bold text-text-primary ltr">{summary.xp.toLocaleString('en-US')}</span>
                <span className="text-2xs text-text-muted">XP</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </Screen>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 px-1">
      <span className="text-2xs font-semibold text-text-muted">{children}</span>
      <div className="h-px flex-1 bg-border/40" />
    </div>
  );
}

function ToggleRow({
  icon: Icon,
  label,
  hint,
  checked,
  onChange,
  divider = false,
}: {
  icon: LucideIcon;
  label: string;
  hint: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  divider?: boolean;
}) {
  return (
    <div className={`flex items-center gap-3 p-4 ${divider ? 'border-b border-white/5' : ''}`}>
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-text-secondary shrink-0">
        <Icon size={18} />
      </span>
      <div className="flex-1">
        <p className="text-sm font-semibold text-text-primary">{label}</p>
        <p className="text-2xs text-text-muted">{hint}</p>
      </div>
      <button
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative w-12 h-7 rounded-pill transition-colors duration-200 shrink-0 ${
          checked ? 'bg-primary-500' : 'bg-white/10'
        }`}
      >
        <span
          className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-200 ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}
