import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useFitConnectAuth } from '@/contexts/FitConnectAuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Building2, Check, LogOut, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { UserRoleEnum } from '@/graphql/types';

export default function SelectCompanyPage() {
  const [, setLocation] = useLocation();
  const {
    companies, selectCompany, activeCompanyId, isAuthenticated, loading, logout, user,
  } = useFitConnectAuth();
  const [selecting, setSelecting] = useState<string | null>(null);

  const isBoss = user?.contextRole === UserRoleEnum.BOSS;

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      setLocation('/login');
    }
  }, [loading, isAuthenticated, setLocation]);

  // Auto-redirect ONLY for non-boss users with a single company already selected
  useEffect(() => {
    if (!loading && isAuthenticated && !isBoss && activeCompanyId && companies.length <= 1) {
      setLocation('/');
    }
  }, [loading, isAuthenticated, isBoss, activeCompanyId, companies.length, setLocation]);

  const handleSelect = async (companyId: string) => {
    setSelecting(companyId);
    try {
      await selectCompany(companyId);
      toast.success('Empresa seleccionada');
      setLocation('/');
    } catch {
      toast.error('Error al seleccionar la empresa. Inténtalo de nuevo.');
    } finally {
      setSelecting(null);
    }
  };

  const handleLogout = () => {
    logout();
    setLocation('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-[#F97316]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-lg">
        {/* Brand header */}
        <div className="flex flex-col items-center mb-6">
          <div className="h-14 w-14 rounded-2xl bg-[#F97316] flex items-center justify-center mb-3 shadow-lg shadow-orange-500/25">
            <span className="text-white font-bold text-lg">FC</span>
          </div>
          {user && (
            <p className="text-sm text-muted-foreground">
              Bienvenido, <span className="font-medium text-foreground">{user.name || user.nickname}</span>
            </p>
          )}
        </div>

        <Card className="shadow-xl border-border/50">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl">Seleccionar Empresa</CardTitle>
            <CardDescription>Elige la empresa que deseas administrar</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {companies.length === 0 ? (
              <div className="text-center py-8">
                <Building2 className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No hay empresas disponibles.</p>
                <p className="text-xs text-muted-foreground/70 mt-1">Contacta a tu administrador para obtener acceso.</p>
              </div>
            ) : (
              companies.map((company) => {
                const isActive = activeCompanyId === company.id;
                const isSelecting = selecting === company.id;

                return (
                  <button
                    key={company.id}
                    onClick={() => handleSelect(company.id)}
                    disabled={selecting !== null}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left group
                      ${isActive
                        ? 'border-[#F97316] bg-[#F97316]/5 shadow-sm'
                        : 'border-border/50 hover:border-[#F97316]/40 hover:bg-[#F97316]/5 hover:shadow-sm'
                      }
                      ${selecting !== null && !isSelecting ? 'opacity-50' : ''}
                    `}
                  >
                    <div className="h-11 w-11 rounded-lg bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                      {company.logo?.url ? (
                        <img src={company.logo.url} alt={company.name} className="h-full w-full object-cover" />
                      ) : (
                        <Building2 className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-foreground truncate">{company.name}</p>
                      {company.email && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{company.email}</p>
                      )}
                    </div>
                    {isSelecting ? (
                      <Loader2 className="h-4 w-4 animate-spin text-[#F97316] shrink-0" />
                    ) : isActive ? (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Check className="h-4 w-4 text-[#F97316]" />
                        <span className="text-xs font-medium text-[#F97316]">Activa</span>
                      </div>
                    ) : (
                      <ArrowRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-[#F97316] transition-colors shrink-0" />
                    )}
                  </button>
                );
              })
            )}

            <div className="pt-4 border-t border-border/50 mt-4">
              <Button
                variant="outline"
                className="w-full"
                onClick={handleLogout}
                disabled={selecting !== null}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Cerrar sesión
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
