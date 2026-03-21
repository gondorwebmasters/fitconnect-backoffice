import { useState } from 'react';
import { useLocation } from 'wouter';
import { useFitConnectAuth } from '@/contexts/FitConnectAuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Building2, Check } from 'lucide-react';
import { toast } from 'sonner';

export default function SelectCompanyPage() {
  const [, setLocation] = useLocation();
  const { companies, selectCompany, activeCompanyId, logout } = useFitConnectAuth();
  const [selecting, setSelecting] = useState<string | null>(null);

  const handleSelect = async (companyId: string) => {
    setSelecting(companyId);
    try {
      await selectCompany(companyId);
      toast.success('Company selected');
      setLocation('/');
    } catch {
      toast.error('Failed to select company');
    } finally {
      setSelecting(null);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="w-full max-w-lg">
        <Card className="shadow-xl border-0">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Select Company</CardTitle>
            <CardDescription>Choose which company you want to manage</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {companies.map((company) => (
              <button
                key={company.id}
                onClick={() => handleSelect(company.id)}
                disabled={selecting !== null}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left hover:border-primary/50 hover:bg-primary/5 ${
                  activeCompanyId === company.id
                    ? 'border-primary bg-primary/5'
                    : 'border-slate-200'
                }`}
              >
                <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                  {company.logo?.url ? (
                    <img src={company.logo.url} alt="" className="h-8 w-8 rounded-md object-cover" />
                  ) : (
                    <Building2 className="h-5 w-5 text-slate-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-slate-900 truncate">{company.name}</p>
                  <p className="text-xs text-slate-500 truncate">{company.email}</p>
                </div>
                {selecting === company.id ? (
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                ) : activeCompanyId === company.id ? (
                  <Check className="h-4 w-4 text-primary" />
                ) : null}
              </button>
            ))}

            <div className="pt-4 border-t">
              <Button variant="outline" className="w-full" onClick={logout}>
                Sign out
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
