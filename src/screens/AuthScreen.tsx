import { useState, useCallback } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowRight, GraduationCap, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

type Mode = 'signin' | 'signup';

export function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setLoading(true);

      const { error } = mode === 'signin'
        ? await signIn(email.trim(), password)
        : await signUp(email.trim(), password);

      setLoading(false);

      if (error) {
        setError(error);
      } else if (mode === 'signup') {
        setError(null);
        setMode('signin');
        setEmail('');
        setPassword('');
      }
    },
    [mode, email, password, signIn, signUp],
  );

  const switchMode = () => {
    setMode((m) => (m === 'signin' ? 'signup' : 'signin'));
    setError(null);
  };

  return (
    <div className="flex flex-1 flex-col bg-bg overflow-y-auto no-scrollbar">
      {/* Decorative top glow */}
      <div className="relative shrink-0 pt-14 pb-8 px-5">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-primary-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-8 right-8 w-32 h-32 bg-accent-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative flex flex-col items-center gap-4 animate-fade-up">
          <div className="relative">
            <div className="absolute inset-0 rounded-3xl bg-primary-500/30 blur-2xl animate-pulse-glow" />
            <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-primary-400 to-accent-500 shadow-glow">
              <GraduationCap size={40} className="text-neutral-950" strokeWidth={2.2} />
            </div>
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-text-primary">كلمات</h1>
            <p className="text-sm text-text-muted mt-1">تعلّم الإنجليزية خطوة بخطوة</p>
          </div>
        </div>
      </div>

      {/* Form card */}
      <div className="flex-1 px-5 pb-8">
        <div className="flex flex-col gap-5 animate-fade-up" style={{ animationDelay: '100ms' }}>
          {/* Mode toggle */}
          <div className="flex gap-1 p-1 rounded-xl bg-white/5">
            <button
              onClick={() => { setMode('signin'); setError(null); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                mode === 'signin'
                  ? 'bg-primary-500 text-neutral-950 shadow-glow'
                  : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              تسجيل الدخول
            </button>
            <button
              onClick={() => { setMode('signup'); setError(null); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                mode === 'signup'
                  ? 'bg-primary-500 text-neutral-950 shadow-glow'
                  : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              حساب جديد
            </button>
          </div>

          {/* Welcome text */}
          <div className="text-center">
            <h2 className="text-lg font-bold text-text-primary">
              {mode === 'signin' ? 'مرحباً بعودتك!' : 'ابدأ رحلتك اليوم'}
            </h2>
            <p className="text-2xs text-text-muted mt-1">
              {mode === 'signin'
                ? 'سجّل دخولك لمتابعة تقدّمك'
                : 'أنشئ حسابك وابدأ تعلّم الإنجليزية'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label className="text-2xs font-semibold text-text-muted px-1">البريد الإلكتروني</label>
              <div className="relative">
                <Mail size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  dir="ltr"
                  className="w-full rounded-lg border-2 border-border bg-surface text-text-primary placeholder:text-text-muted/50 px-11 py-3.5 text-sm ltr text-left transition-all duration-200 focus:border-primary-500/60 focus:outline-none"
                />
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-2xs font-semibold text-text-muted px-1">كلمة المرور</label>
              <div className="relative">
                <Lock size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  dir="ltr"
                  className="w-full rounded-lg border-2 border-border bg-surface text-text-primary placeholder:text-text-muted/50 px-11 py-3.5 text-sm ltr text-left transition-all duration-200 focus:border-primary-500/60 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
                  aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-lg border border-error-500/30 bg-error-500/10 px-4 py-3 animate-fade-up">
                <p className="text-2xs text-error-400 font-medium">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !email || !password}
              className="flex items-center justify-center gap-2 w-full rounded-lg bg-primary-500 text-neutral-950 font-bold text-sm py-3.5 transition-all duration-200 hover:bg-primary-400 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] shadow-glow"
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  {mode === 'signin' ? 'تسجيل الدخول' : 'إنشاء الحساب'}
                  <ArrowRight size={18} className="rotate-180" />
                </>
              )}
            </button>
          </form>

          {/* Switch mode link */}
          <p className="text-center text-2xs text-text-muted">
            {mode === 'signin' ? 'ليس لديك حساب؟' : 'لديك حساب بالفعل؟'}
            <button
              onClick={switchMode}
              className="text-primary-400 font-semibold hover:text-primary-300 transition-colors mr-1"
            >
              {mode === 'signin' ? 'أنشئ حساباً' : 'سجّل دخولك'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default AuthScreen;
