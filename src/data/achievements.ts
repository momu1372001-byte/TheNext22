import {
  Flame,
  Zap,
  BookOpen,
  Trophy,
  Target,
  Star,
  Crown,
  GraduationCap,
  Award,
  type LucideIcon,
} from 'lucide-react';

export type AchievementCategory = 'streak' | 'xp' | 'words' | 'lessons' | 'accuracy' | 'milestone';

export type Achievement = {
  id: string;
  titleAr: string;
  descriptionAr: string;
  icon: LucideIcon;
  category: AchievementCategory;
  /** Threshold value to unlock. */
  threshold: number;
  /** XP reward for unlocking. */
  xpReward: number;
};

export const ACHIEVEMENTS: Achievement[] = [
  // Streak
  {
    id: 'streak-3',
    titleAr: 'بداية موفقة',
    descriptionAr: 'حافظ على سلسلة ٣ أيام متتالية',
    icon: Flame,
    category: 'streak',
    threshold: 3,
    xpReward: 50,
  },
  {
    id: 'streak-7',
    titleAr: 'أسبوع كامل',
    descriptionAr: 'حافظ على سلسلة ٧ أيام متتالية',
    icon: Flame,
    category: 'streak',
    threshold: 7,
    xpReward: 150,
  },
  {
    id: 'streak-30',
    titleAr: 'شهر الإصرار',
    descriptionAr: 'حافظ على سلسلة ٣٠ يوماً متتالية',
    icon: Crown,
    category: 'streak',
    threshold: 30,
    xpReward: 500,
  },

  // XP
  {
    id: 'xp-100',
    titleAr: 'أول خطوة',
    descriptionAr: 'اجمع ١٠٠ نقطة خبرة',
    icon: Zap,
    category: 'xp',
    threshold: 100,
    xpReward: 20,
  },
  {
    id: 'xp-500',
    titleAr: 'متعلم نشط',
    descriptionAr: 'اجمع ٥٠٠ نقطة خبرة',
    icon: Zap,
    category: 'xp',
    threshold: 500,
    xpReward: 50,
  },
  {
    id: 'xp-2000',
    titleAr: 'خبير التعلّم',
    descriptionAr: 'اجمع ٢٠٠٠ نقطة خبرة',
    icon: Award,
    category: 'xp',
    threshold: 2000,
    xpReward: 200,
  },

  // Words
  {
    id: 'words-10',
    titleAr: 'أول عشر كلمات',
    descriptionAr: 'تعلّم ١٠ كلمات',
    icon: BookOpen,
    category: 'words',
    threshold: 10,
    xpReward: 30,
  },
  {
    id: 'words-50',
    titleAr: 'بناء المفردات',
    descriptionAr: 'تعلّم ٥٠ كلمة',
    icon: BookOpen,
    category: 'words',
    threshold: 50,
    xpReward: 100,
  },
  {
    id: 'words-200',
    titleAr: 'ثروة لغوية',
    descriptionAr: 'تعلّم ٢٠٠ كلمة',
    icon: Trophy,
    category: 'words',
    threshold: 200,
    xpReward: 300,
  },

  // Lessons
  {
    id: 'lessons-1',
    titleAr: 'الدرس الأول',
    descriptionAr: 'أكمل أول درس',
    icon: GraduationCap,
    category: 'lessons',
    threshold: 1,
    xpReward: 25,
  },
  {
    id: 'lessons-5',
    titleAr: 'متعلم مجتهد',
    descriptionAr: 'أكمل ٥ دروس',
    icon: GraduationCap,
    category: 'lessons',
    threshold: 5,
    xpReward: 100,
  },
  {
    id: 'lessons-10',
    titleAr: 'نصف الطريق',
    descriptionAr: 'أكمل ١٠ دروس',
    icon: Trophy,
    category: 'lessons',
    threshold: 10,
    xpReward: 250,
  },

  // Accuracy
  {
    id: 'accuracy-90',
    titleAr: 'دقة عالية',
    descriptionAr: 'حقق ٩٠٪ دقة في جلسة كاملة',
    icon: Target,
    category: 'accuracy',
    threshold: 90,
    xpReward: 75,
  },
  {
    id: 'accuracy-100',
    titleAr: 'إتقان كامل',
    descriptionAr: 'حقق ١٠٠٪ في جلسة كاملة',
    icon: Star,
    category: 'accuracy',
    threshold: 100,
    xpReward: 150,
  },

  // Milestone
  {
    id: 'milestone-first-goal',
    titleAr: 'تحقيق الهدف',
    descriptionAr: 'أكمل هدفك اليومي لأول مرة',
    icon: Target,
    category: 'milestone',
    threshold: 1,
    xpReward: 50,
  },
];

export function getAchievementById(id: string): Achievement | undefined {
  return ACHIEVEMENTS.find((a) => a.id === id);
}
