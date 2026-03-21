import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useFitConnectAuth } from '@/contexts/FitConnectAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Loader2, Dumbbell, Eye, EyeOff, AlertCircle, Mail, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

// ===== Validation helpers =====
function validateEmail(value: string): string | null {
  if (!value.trim()) return 'Email or nickname is required';
  return null;
}

function validatePassword(value: string): string | null {
  if (!value) return 'Password is required';
  if (value.length < 4) return 'Password must be at least 4 characters';
  return null;
}

function validateForgotEmail(value: string): string | null {
  if (!value.trim()) return 'Email is required';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Enter a valid email address';
  return null;
}

export default function LoginPage() {
  const [location, setLocation] = useLocation();
  const { login, isAuthenticated, activeCompanyId, forgotPassword } = useFitConnectAuth();

  // --- Redirect if already authenticated ---
  useEffect(() => {
    if (isAuthenticated) {
      if (!activeCompanyId) {
        setLocation('/select-company');
      } else {
        setLocation('/');
      }
    }
  }, [isAuthenticated, activeCompanyId, setLocation]);

  // --- Login form state ---
  const [emailOrNickname, setEmailOrNickname] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  // --- Forgot password dialog state ---
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [forgotSuccess, setForgotSuccess] = useState(false);

  // --- Login form validation & submit ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate fields
    const emailErr = validateEmail(emailOrNickname);
    const passErr = validatePassword(password);
    setFieldErrors({ email: emailErr || undefined, password: passErr || undefined });

    if (emailErr || passErr) return;

    setIsLoading(true);

    try {
      const result = await login(emailOrNickname, password);

      if (result?.success) {
        toast.success('Login successful');
        // If user has multiple companies and no active one, go to company selection
        if (result.companies && result.companies.length > 1 && !result.user?.activeCompanyId) {
          setLocation('/select-company');
        } else if (result.companies?.length === 1) {
          // Auto-select if only one company
          setLocation('/');
        } else {
          setLocation('/');
        }
      } else {
        // Map backend error messages to user-friendly text
        const msg = result?.message || '';
        if (msg.toLowerCase().includes('blocked') || msg.toLowerCase().includes('bloqueado')) {
          setError('Your account has been blocked. Please contact your administrator.');
        } else if (msg.toLowerCase().includes('not found') || msg.toLowerCase().includes('invalid') || msg.toLowerCase().includes('incorrect')) {
          setError('Invalid email/nickname or password. Please check your credentials.');
        } else if (msg.toLowerCase().includes('not active') || msg.toLowerCase().includes('inactive')) {
          setError('Your account is not active. Please verify your email first.');
        } else {
          setError(msg || 'Login failed. Please try again.');
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
          setError('Unable to connect to the server. Please check your connection and try again.');
        } else {
          setError(err.message);
        }
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // --- Forgot password submit ---
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);

    const emailErr = validateForgotEmail(forgotEmail);
    if (emailErr) {
      setForgotError(emailErr);
      return;
    }

    setForgotLoading(true);
    try {
      await forgotPassword(forgotEmail);
      setForgotSuccess(true);
    } catch {
      setForgotError('Failed to send reset email. Please try again.');
    } finally {
      setForgotLoading(false);
    }
  };

  const closeForgotDialog = () => {
    setForgotOpen(false);
    setForgotEmail('');
    setForgotError(null);
    setForgotSuccess(false);
  };

  // --- Clear field errors on input change ---
  const handleEmailChange = (val: string) => {
    setEmailOrNickname(val);
    if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: undefined }));
    if (error) setError(null);
  };

  const handlePasswordChange = (val: string) => {
    setPassword(val);
    if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: undefined }));
    if (error) setError(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 p-4">
      <div className="w-full max-w-md">
        {/* Logo / Brand */}
        <div className="flex flex-col items-center mb-8">
          <div className="h-14 w-14 rounded-2xl bg-primary flex items-center justify-center mb-4 shadow-lg shadow-primary/25">
            <Dumbbell className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">FitConnect</h1>
          <p className="text-sm text-slate-500 mt-1">Backoffice Administration</p>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl">Sign in</CardTitle>
            <CardDescription>Enter your credentials to access the dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {/* Global error alert */}
              {error && (
                <Alert variant="destructive" className="animate-in fade-in-0 slide-in-from-top-1">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Email / Nickname field */}
              <div className="space-y-2">
                <Label htmlFor="emailOrNickname">Email or Nickname</Label>
                <Input
                  id="emailOrNickname"
                  type="text"
                  placeholder="you@example.com"
                  value={emailOrNickname}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  autoComplete="username"
                  disabled={isLoading}
                  aria-invalid={!!fieldErrors.email}
                  aria-describedby={fieldErrors.email ? 'email-error' : undefined}
                  className={fieldErrors.email ? 'border-destructive focus-visible:ring-destructive' : ''}
                />
                {fieldErrors.email && (
                  <p id="email-error" className="text-xs text-destructive mt-1">
                    {fieldErrors.email}
                  </p>
                )}
              </div>

              {/* Password field */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <button
                    type="button"
                    onClick={() => setForgotOpen(true)}
                    className="text-xs text-primary hover:text-primary/80 font-medium transition-colors"
                    tabIndex={-1}
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => handlePasswordChange(e.target.value)}
                    autoComplete="current-password"
                    disabled={isLoading}
                    aria-invalid={!!fieldErrors.password}
                    aria-describedby={fieldErrors.password ? 'password-error' : undefined}
                    className={`pr-10 ${fieldErrors.password ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    tabIndex={-1}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {fieldErrors.password && (
                  <p id="password-error" className="text-xs text-destructive mt-1">
                    {fieldErrors.password}
                  </p>
                )}
              </div>

              {/* Submit button */}
              <Button type="submit" className="w-full" disabled={isLoading} size="lg">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-slate-400 mt-6">
          FitConnect Backoffice &copy; {new Date().getFullYear()}
        </p>
      </div>

      {/* ===== Forgot Password Dialog ===== */}
      <Dialog open={forgotOpen} onOpenChange={(open) => !open && closeForgotDialog()}>
        <DialogContent className="sm:max-w-md">
          {forgotSuccess ? (
            <>
              <DialogHeader>
                <div className="mx-auto h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mb-2">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                </div>
                <DialogTitle className="text-center">Check your email</DialogTitle>
                <DialogDescription className="text-center">
                  We&apos;ve sent a password reset link to <strong>{forgotEmail}</strong>.
                  Please check your inbox and follow the instructions.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button onClick={closeForgotDialog} className="w-full">
                  Back to login
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
                <DialogTitle className="text-center">Reset your password</DialogTitle>
                <DialogDescription className="text-center">
                  Enter your email address and we&apos;ll send you a link to reset your password.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleForgotPassword} className="space-y-4">
                {forgotError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{forgotError}</AlertDescription>
                  </Alert>
                )}
                <div className="space-y-2">
                  <Label htmlFor="forgot-email">Email address</Label>
                  <Input
                    id="forgot-email"
                    type="email"
                    placeholder="you@example.com"
                    value={forgotEmail}
                    onChange={(e) => {
                      setForgotEmail(e.target.value);
                      if (forgotError) setForgotError(null);
                    }}
                    disabled={forgotLoading}
                    autoComplete="email"
                  />
                </div>
                <DialogFooter className="gap-2 sm:gap-0">
                  <Button type="button" variant="outline" onClick={closeForgotDialog} disabled={forgotLoading}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={forgotLoading}>
                    {forgotLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      'Send reset link'
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
