import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useFitConnectAuth } from '@/contexts/FitConnectAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Loader2, Eye, EyeOff, AlertCircle, Mail, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

function validateEmail(value: string): string | null {
  if (!value.trim()) return 'El email o nickname es obligatorio';
  return null;
}
function validatePassword(value: string): string | null {
  if (!value) return 'La contraseña es obligatoria';
  if (value.length < 4) return 'La contraseña debe tener al menos 4 caracteres';
  return null;
}
function validateForgotEmail(value: string): string | null {
  if (!value.trim()) return 'El email es obligatorio';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Introduce un email válido';
  return null;
}

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { login, isAuthenticated, activeCompanyId, forgotPassword } = useFitConnectAuth();

  useEffect(() => {
    if (isAuthenticated) {
      setLocation(!activeCompanyId ? '/select-company' : '/');
    }
  }, [isAuthenticated, activeCompanyId, setLocation]);

  const [emailOrNickname, setEmailOrNickname] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [forgotSuccess, setForgotSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const emailErr = validateEmail(emailOrNickname);
    const passErr = validatePassword(password);
    setFieldErrors({ email: emailErr || undefined, password: passErr || undefined });
    if (emailErr || passErr) return;

    setIsLoading(true);
    try {
      const result = await login(emailOrNickname, password);
      if (result?.success) {
        toast.success('Inicio de sesión exitoso');
        if (result.companies && result.companies.length > 1 && !result.user?.activeCompanyId) {
          setLocation('/select-company');
        } else {
          setLocation('/');
        }
      } else {
        const msg = result?.message || '';
        if (msg.toLowerCase().includes('blocked') || msg.toLowerCase().includes('bloqueado')) {
          setError('Tu cuenta ha sido bloqueada. Contacta con tu administrador.');
        } else if (msg.toLowerCase().includes('not found') || msg.toLowerCase().includes('invalid') || msg.toLowerCase().includes('incorrect')) {
          setError('Email/nickname o contraseña incorrectos.');
        } else if (msg.toLowerCase().includes('not active') || msg.toLowerCase().includes('inactive')) {
          setError('Tu cuenta no está activa. Verifica tu email primero.');
        } else {
          setError(msg || 'Error al iniciar sesión. Inténtalo de nuevo.');
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && (err.message.includes('Failed to fetch') || err.message.includes('NetworkError'))) {
        setError('No se puede conectar con el servidor. Comprueba tu conexión.');
      } else {
        setError('Ha ocurrido un error inesperado. Inténtalo de nuevo.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    const emailErr = validateForgotEmail(forgotEmail);
    if (emailErr) { setForgotError(emailErr); return; }
    setForgotLoading(true);
    try {
      await forgotPassword(forgotEmail);
      setForgotSuccess(true);
    } catch { setForgotError('Error al enviar el email. Inténtalo de nuevo.'); }
    finally { setForgotLoading(false); }
  };

  const closeForgotDialog = () => {
    setForgotOpen(false); setForgotEmail(''); setForgotError(null); setForgotSuccess(false);
  };

  const handleEmailChange = (val: string) => {
    setEmailOrNickname(val);
    if (fieldErrors.email) setFieldErrors((p) => ({ ...p, email: undefined }));
    if (error) setError(null);
  };
  const handlePasswordChange = (val: string) => {
    setPassword(val);
    if (fieldErrors.password) setFieldErrors((p) => ({ ...p, password: undefined }));
    if (error) setError(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B1120] p-4">
      <div className="w-full max-w-sm">
        {/* FC Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="h-16 w-16 rounded-2xl bg-[#F97316] flex items-center justify-center mb-5 shadow-lg shadow-orange-500/30">
            <span className="text-white font-bold text-xl tracking-tight">FC</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">FitConnect</h1>
          <p className="text-sm text-slate-400 mt-1">Backoffice Admin Dashboard</p>
        </div>

        {/* Login card */}
        <div className="rounded-2xl border border-slate-700/60 bg-[#111827]/80 backdrop-blur-sm p-6">
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {error && (
              <Alert variant="destructive" className="bg-red-500/10 border-red-500/30 text-red-400 animate-in fade-in-0 slide-in-from-top-1">
                <AlertCircle className="h-4 w-4 !text-red-400" />
                <AlertDescription className="text-red-400">{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="emailOrNickname" className="text-slate-300 text-sm font-medium">Email</Label>
              <Input
                id="emailOrNickname"
                type="text"
                placeholder="juan@mail.com"
                value={emailOrNickname}
                onChange={(e) => handleEmailChange(e.target.value)}
                autoComplete="username"
                disabled={isLoading}
                className={`bg-[#1E293B] border-slate-600/50 text-white placeholder:text-slate-500 focus:border-orange-500 focus:ring-orange-500/30 h-11 ${fieldErrors.email ? 'border-red-500 focus:ring-red-500/30' : ''}`}
              />
              {fieldErrors.email && <p className="text-xs text-red-400 mt-1">{fieldErrors.email}</p>}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-slate-300 text-sm font-medium">Contraseña</Label>
                <button type="button" onClick={() => setForgotOpen(true)} className="text-xs text-orange-400 hover:text-orange-300 font-medium transition-colors" tabIndex={-1}>
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••"
                  value={password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  autoComplete="current-password"
                  disabled={isLoading}
                  className={`bg-[#1E293B] border-slate-600/50 text-white placeholder:text-slate-500 focus:border-orange-500 focus:ring-orange-500/30 h-11 pr-10 ${fieldErrors.password ? 'border-red-500 focus:ring-red-500/30' : ''}`}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors" tabIndex={-1}>
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {fieldErrors.password && <p className="text-xs text-red-400 mt-1">{fieldErrors.password}</p>}
            </div>

            <Button
              type="submit"
              className="w-full h-11 bg-[#F97316] hover:bg-[#EA580C] text-white font-semibold text-sm rounded-xl shadow-lg shadow-orange-500/25 transition-all"
              disabled={isLoading}
            >
              {isLoading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Iniciando sesión...</>
              ) : (
                'Iniciar Sesión'
              )}
            </Button>
          </form>

          <p className="text-center text-xs text-slate-500 mt-5">
            Usa tus credenciales de FitConnect para acceder al backoffice
          </p>
        </div>

        <p className="text-center text-xs text-slate-600 mt-6">
          &copy; {new Date().getFullYear()} FitConnect. Todos los derechos reservados.
        </p>
      </div>

      {/* Forgot Password Dialog */}
      <Dialog open={forgotOpen} onOpenChange={(open) => !open && closeForgotDialog()}>
        <DialogContent className="sm:max-w-md bg-[#111827] border-slate-700/60 text-white">
          {forgotSuccess ? (
            <>
              <DialogHeader>
                <div className="mx-auto h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center mb-2">
                  <CheckCircle2 className="h-6 w-6 text-green-400" />
                </div>
                <DialogTitle className="text-center text-white">Email enviado</DialogTitle>
                <DialogDescription className="text-center text-slate-400">
                  Hemos enviado un enlace de recuperación a <strong className="text-slate-300">{forgotEmail}</strong>. Revisa tu bandeja de entrada.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button onClick={closeForgotDialog} className="w-full bg-[#F97316] hover:bg-[#EA580C] text-white">Volver al login</Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <div className="mx-auto h-12 w-12 rounded-full bg-orange-500/10 flex items-center justify-center mb-2">
                  <Mail className="h-6 w-6 text-orange-400" />
                </div>
                <DialogTitle className="text-center text-white">Recuperar contraseña</DialogTitle>
                <DialogDescription className="text-center text-slate-400">
                  Introduce tu email y te enviaremos un enlace para restablecer tu contraseña.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleForgotPassword} className="space-y-4">
                {forgotError && (
                  <Alert variant="destructive" className="bg-red-500/10 border-red-500/30">
                    <AlertCircle className="h-4 w-4 !text-red-400" />
                    <AlertDescription className="text-red-400">{forgotError}</AlertDescription>
                  </Alert>
                )}
                <div className="space-y-2">
                  <Label htmlFor="forgot-email" className="text-slate-300">Email</Label>
                  <Input
                    id="forgot-email" type="email" placeholder="tu@email.com"
                    value={forgotEmail}
                    onChange={(e) => { setForgotEmail(e.target.value); if (forgotError) setForgotError(null); }}
                    disabled={forgotLoading}
                    className="bg-[#1E293B] border-slate-600/50 text-white placeholder:text-slate-500"
                  />
                </div>
                <DialogFooter className="gap-2 sm:gap-0">
                  <Button type="button" variant="outline" onClick={closeForgotDialog} disabled={forgotLoading} className="border-slate-600 text-slate-300 hover:bg-slate-700">Cancelar</Button>
                  <Button type="submit" disabled={forgotLoading} className="bg-[#F97316] hover:bg-[#EA580C] text-white">
                    {forgotLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enviando...</> : 'Enviar enlace'}
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
