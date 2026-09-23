import { useEffect, useState } from 'react';
import { ChartBar as BarChart3, Flame, Zap, BookOpen, CircleCheck as CheckCircle2, Loader as Loader2, TrendingUp, TrendingDown, Award, Target, RotateCcw } from 'lucide-react';
import { Screen, ScreenHeader, Card, ProgressBar } from '@/components/ui';
import { getProgressSummary, getStrengthsAndWeaknesses, getWeakWords, subscribe, type ProgressSummary, type SkillAnalysis } from '@/data/progressStore';
import { getLevelByCode, getAppConfig, getCategoryById } from '@/data/vocabularyRepository';
import type { OnboardingState, LevelCode, Word } from '@/types';

type ProgressScreenProps = {
  profile: OnboardingState;
};

function useSummary(dailyGoal: number) {
  const [summary, setSummary] = useState<ProgressSummary>(() => getProgressSummary(dailyGoal));

  useEffect(() => {
    setSummary(getProgressSummary(dailyGoal));
    return subscribe(() => setSummary(getProgressSummary(dailyGoal)));
  }, [dailyGoal]);

  return summary;
}

function StatCard({
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
    <Card className="p-4 flex flex-col items-center gap-2 text-center animate-fade-up">
      <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${accent}`}>
        {icon}
      </span>
      <span className="text-2xl font-bold text-text-primary ltr tabular-nums">{value}</span>
      <span className="text-2xs text-text-muted leading-tight">{label}</span>
    </Card>
  );
}

function WeeklyActivity({ activity }: { activity: ProgressSummary['weeklyActivity'] }) {
  const maxCount = Math.max(1, ...activity.map((d) => d.count));
  const today = activity[activity.length - 1]?.date;

  return (
    <Card className="p-5 animate-fade-up">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-semibold text-text-primary">نشاط هذا الأسبوع</p>
        <span className="text-2xs text-text-muted">آخر ٧ أيام</span>
      </div>
      <div className="flex items-end justify-between gap-2 h-28">
        {activity.map((d) => {
          const isToday = d.date === today;
          const heightPct = Math.round((d.count / maxCount) * 100);
          return (
            <div key={d.date} className="flex flex-1 flex-col items-center gap-1.5 h-full justify-end">
              <div className="w-full flex-1 flex items-end">
                <div
                  className={`w-full rounded-md transition-all duration-500 ${
                    isToday ? 'bg-primary-500' : d.count > 0 ? 'bg-primary-500/40' : 'bg-white/5'
                  }`}
                  style={{ height: `${d.count > 0 ? Math.max(8, heightPct) : 4}%` }}
                />
              </div>
              <span
                className={`text-2xs ${isToday ? 'text-primary-400 font-semibold' : 'text-text-muted'}`}
              >
                {d.label}
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function LevelRow({
  code,
  learned,
  total,
}: {
  code: LevelCode;
  learned: number;
  total: number;
}) {
  const level = getLevelByCode(code);
  const pct = total > 0 ? Math.round((learned / total) * 100) : 0;
  const fillColor = level?.color ?? '#F59E0B';

  return (
    <div className="flex flex-col gap-2 py-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span
            className="flex h-7 w-9 items-center justify-center rounded-md text-2xs font-bold ltr"
            style={{ backgroundColor: `${fillColor}22`, color: fillColor }}
          >
            {code}
          </span>
          <span className="text-sm font-medium text-text-secondary">{level?.nameAr ?? code}</span>
        </div>
        <span className="text-2xs text-text-muted ltr tabular-nums">
          {learned} / {total}
        </span>
      </div>
      <div
        className="w-full overflow-hidden rounded-pill bg-white/8"
        style={{ height: 6 }}
        role="progressbar"
        aria-valuenow={learned}
        aria-valuemax={total}
        aria-valuemin={0}
      >
        <div
          className="h-full rounded-pill transition-[width] duration-700 ease-out"
          style={{ width: `${pct}%`, backgroundColor: fillColor }}
        />
      </div>
    </div>
  );
}

export function ProgressScreen({ profile }: ProgressScreenProps) {
  const summary = useSummary(profile.dailyGoal || 10);
  const [skillsAnalysis, setSkillsAnalysis] = useState<SkillAnalysis[]>(() => getStrengthsAndWeaknesses());
  const [weakWords, setWeakWords] = useState<Word[]>(() => getWeakWords(5));

  useEffect(() => {
    setSkillsAnalysis(getStrengthsAndWeaknesses());
    setWeakWords(getWeakWords(5));
    return subscribe(() => {
      setSkillsAnalysis(getStrengthsAndWeaknesses());
      setWeakWords(getWeakWords(5));
    });
  }, []);

  const targetTotal = getAppConfig().totalWords;
  const overallPct = Math.round((summary.totalLearned / targetTotal) * 100);
  const goalPct = Math.min(100, Math.round((summary.learnedToday / summary.dailyGoal) * 100));

  return (
    <Screen>
      <ScreenHeader
        titleAr="تقدّمي"
        subtitleAr="تابع رحلتك في تعلّم الإنجليزية"
        icon={<BarChart3 size={22} />}
      />

      <div className="flex flex-col gap-4 px-5 pb-8">
        {/* Overall progress hero */}
        <Card raised className="p-5 animate-fade-up">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-semibold text-text-primary">إجمالي التقدّم</p>
              <p className="text-2xs text-text-muted mt-0.5">
                من أصل {targetTotal.toLocaleString('en-US')} كلمة
              </p>
            </div>
            <div className="text-left">
              <span className="text-2xl font-bold text-primary-400 ltr tabular-nums block leading-none">
                {overallPct}%
              </span>
            </div>
          </div>
          <ProgressBar value={summary.totalLearned} max={targetTotal} height={10} />
          <div className="flex items-center justify-between mt-3">
            <span className="text-2xs text-text-muted ltr tabular-nums">
              {summary.totalLearned.toLocaleString('en-US')} تعلّمتها
            </span>
            <span className="text-2xs text-text-muted ltr tabular-nums">
              {(targetTotal - summary.totalLearned).toLocaleString('en-US')} متبقّية
            </span>
          </div>
        </Card>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard
            icon={<BookOpen size={18} />}
            value={summary.totalLearned.toLocaleString('en-US')}
            label="كلمات تعلّمتها"
            accent="bg-primary-500/15 text-primary-400"
          />
          <StatCard
            icon={<CheckCircle2 size={18} />}
            value={summary.masteredCount.toLocaleString('en-US')}
            label="كلمات أتقنتها"
            accent="bg-success-500/15 text-success-400"
          />
          <StatCard
            icon={<Loader2 size={18} className="animate-spin" />}
            value={summary.inProgressCount.toLocaleString('en-US')}
            label="قيد التعلّم"
            accent="bg-accent-500/15 text-accent-400"
          />
        </div>

        {/* Due for review banner */}
        {summary.dueCount > 0 && (
          <Card className="p-4 flex items-center gap-3 animate-fade-up border-accent-500/30">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-500/15 text-accent-400 shrink-0">
              <RotateCcw size={18} />
            </span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-text-primary">
                {summary.dueCount} كلمة للمراجعة الآن
              </p>
              <p className="text-2xs text-text-muted">راجعها لتثبيتها في ذاكرتك طويلة المدى</p>
            </div>
          </Card>
        )}

        {/* Streak + XP row */}
        <div className="grid grid-cols-2 gap-3">
          <Card raised className="p-4 flex items-center gap-3 animate-fade-up">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-warning-500/15 text-warning-400">
              <Flame size={22} />
            </span>
            <div>
              <span className="text-2xl font-bold text-text-primary ltr block leading-none">
                {summary.streak}
              </span>
              <span className="text-2xs text-text-muted">أيام متتالية</span>
            </div>
          </Card>
          <Card raised className="p-4 flex items-center gap-3 animate-fade-up">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-500/15 text-primary-400">
              <Zap size={22} />
            </span>
            <div>
              <span className="text-2xl font-bold text-text-primary ltr block leading-none">
                {summary.xp.toLocaleString('en-US')}
              </span>
              <span className="text-2xs text-text-muted">نقطة خبرة</span>
            </div>
          </Card>
        </div>

        {/* Daily goal */}
        <Card className="p-5 animate-fade-up">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-text-primary">هدف اليوم</p>
            <span className="text-2xs text-text-muted ltr tabular-nums">
              {summary.learnedToday} / {summary.dailyGoal} كلمة
            </span>
          </div>
          <ProgressBar value={summary.learnedToday} max={summary.dailyGoal} height={10} />
          <p className="text-2xs mt-2 font-medium" style={{ color: goalPct >= 100 ? '#34D399' : '#6B7A99' }}>
            {goalPct >= 100 ? '✓ تم تحقيق هدف اليوم!' : `${summary.dailyGoal - summary.learnedToday} كلمات متبقّية`}
          </p>
        </Card>

        {/* Weekly activity */}
        <WeeklyActivity activity={summary.weeklyActivity} />

        {/* Per-level breakdown */}
        <Card className="p-5 animate-fade-up">
          <p className="text-sm font-semibold text-text-primary mb-2">التقدّم حسب المستوى</p>
          <div className="flex flex-col divide-y divide-white/5">
            {summary.perLevel.map((lvl) => (
              <LevelRow
                key={lvl.code}
                code={lvl.code}
                learned={lvl.learned}
                total={lvl.total}
              />
            ))}
          </div>
        </Card>

        {/* Strengths & Weaknesses */}
        {skillsAnalysis.length > 0 && (
          <Card className="p-5 animate-fade-up">
            <p className="text-sm font-semibold text-text-primary mb-3">نقاط القوة والضعف</p>
            <div className="flex flex-col gap-3">
              {skillsAnalysis.map((skill) => {
                const category = getCategoryById(skill.categoryId);
                const isStrong = skill.strength === 'strong';
                const isWeak = skill.strength === 'weak';
                const accentColor = isStrong ? 'text-success-400' : isWeak ? 'text-error-400' : 'text-warning-400';
                const bgColor = isStrong ? 'bg-success-500/10' : isWeak ? 'bg-error-500/10' : 'bg-warning-500/10';
                const Icon = isStrong ? TrendingUp : isWeak ? TrendingDown : Target;
                return (
                  <div key={skill.categoryId} className="flex items-center gap-3">
                    <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${bgColor} ${accentColor}`}>
                      <Icon size={16} />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-secondary">{category?.nameAr ?? skill.categoryId}</p>
                      <p className="text-2xs text-text-muted ltr">
                        {skill.correctAnswers}/{skill.totalAnswers} · {skill.accuracy}%
                      </p>
                    </div>
                    <span className={`text-sm font-bold ${accentColor} ltr`}>{skill.accuracy}%</span>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* Weak words preview */}
        {weakWords.length > 0 && (
          <Card className="p-5 animate-fade-up">
            <div className="flex items-center gap-2 mb-3">
              <TrendingDown size={16} className="text-error-400" />
              <p className="text-sm font-semibold text-text-primary">كلمات تحتاج اهتمامك</p>
            </div>
            <div className="flex flex-col gap-1.5">
              {weakWords.map((w) => (
                <div
                  key={w.id}
                  className="flex items-center justify-between rounded-md bg-surface border border-border/50 px-4 py-2.5"
                >
                  <span className="text-sm font-medium text-text-secondary ltr">{w.word}</span>
                  <span className="text-sm text-primary-500">{w.arabicTranslation}</span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Best session accuracy */}
        {summary.bestSessionAccuracy > 0 && (
          <Card className="p-4 flex items-center gap-3 animate-fade-up">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500/15 text-primary-400">
              <Award size={18} />
            </span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-text-primary">أفضل دقة في جلسة</p>
              <p className="text-2xs text-text-muted">أعلى نسبة إجابات صحيحة في جلسة واحدة</p>
            </div>
            <span className="text-lg font-bold text-primary-400 ltr">{summary.bestSessionAccuracy}%</span>
          </Card>
        )}
      </div>
    </Screen>
  );
}

export default ProgressScreen;
