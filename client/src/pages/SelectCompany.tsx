import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useFitConnectAuth } from '@/contexts/FitConnectAuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Building2, Check, LogOut, Dumbbell, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

export default function SelectCompanyPage() {
  const [, setLocation] = useLocation();
  const {
    companies,
    selectCompany,
    activeCompanyId,
    isAuthenticated,
    loading,
    logout,
    user,
  } = useFitConnectAuth();
  const [selecting, setSelecting] = useState<string | null>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      setLocation('/login');
    }
  }, [loading, isAuthenticated, setLocation]);

  // If user already has an active company and only 1 company, go to dashboard
  useEffect(() => {
    if (!loading && isAuthenticated && activeCompanyId && companies.length <= 1) {
      setLocation('/');
    }
  }, [loading, isAuthenticated, activeCompanyId, companies.length, setLocation]);

  const handleSelect = async (companyId: string) => {
    setSelecting(companyId);
    try {
      await selectCompany(companyId);
      toast.success('Company selected');
      setLocation('/');
    } catch {
      toast.error('Failed to select company. Please try again.');
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
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 p-4">
      <div className="w-full max-w-lg">
        {/* Brand header */}
        <div className="flex flex-col items-center mb-6">
          <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center mb-3 shadow-lg shadow-primary/25">
            <Dumbbell className="h-6 w-6 text-primary-foreground" />
          </div>
          {user && (
            <p className="text-sm text-slate-500">
              Welcome back, <span className="font-medium text-slate-700">{user.name || user.nickname}</span>
            </p>
          )}
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl">Select Company</CardTitle>
            <CardDescription>Choose which company you want to manage</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {companies.length === 0 ? (
              <div className="text-center py-8">
                <Building2 className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-slate-500">No companies available.</p>
                <p className="text-xs text-slate-400 mt-1">Contact your administrator for access.</p>
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
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'border-slate-200 hover:border-primary/40 hover:bg-primary/5 hover:shadow-sm'
                      }
                      ${selecting !== null && !isSelecting ? 'opacity-50' : ''}
                    `}
                  >
                    <div className="h-11 w-11 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 overflow-hidden">
                      {company.logo?.url ? (
                        <img
                          src={company.logo.url}
                          alt={company.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Building2 className="h-5 w-5 text-slate-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-slate-900 truncate">{company.name}</p>
                      {company.email && (
                        <p className="text-xs text-slate-500 truncate mt-0.5">{company.email}</p>
                      )}
                    </div>
                    {isSelecting ? (
                      <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
                    ) : isActive ? (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Check className="h-4 w-4 text-primary" />
                        <span className="text-xs font-medium text-primary">Active</span>
                      </div>
                    ) : (
                      <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-primary transition-colors shrink-0" />
                    )}
                  </button>
                );
              })
            )}

            <div className="pt-4 border-t mt-4">
              <Button
                variant="outline"
                className="w-full"
                onClick={handleLogout}
                disabled={selecting !== null}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
