import { useEffect, useState } from 'react';
import { apolloClient } from '@/graphql/apollo-client';
import {
  LIST_USER_PAYMENT_METHODS, REMOVE_PAYMENT_METHOD, SET_DEFAULT_PAYMENT_METHOD,
  GET_PAYMENT_METHODS_STATS, GET_CUSTOMER_BY_USER_ID,
} from '@/graphql/operations';
import type { PaymentMethod, PaymentMethodResponse, BasicResponse, StatsResponse, StripeCustomerResponse } from '@/graphql/types';
import { useFitConnectAuth } from '@/contexts/FitConnectAuthContext';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserAutocomplete } from '@/components/common/UserAutocomplete';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Trash2, Star, CreditCard, Loader2, Search, ShieldCheck, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

/** Map card brand slug to a display name and icon color */
const BRAND_META: Record<string, { label: string; color: string }> = {
  visa:       { label: 'Visa',       color: 'text-blue-500' },
  mastercard: { label: 'Mastercard', color: 'text-primary' },
  amex:       { label: 'Amex',       color: 'text-sky-500' },
  discover:   { label: 'Discover',   color: 'text-amber-500' },
  jcb:        { label: 'JCB',        color: 'text-green-500' },
  unionpay:   { label: 'UnionPay',   color: 'text-red-500' },
};

function CardBrandIcon({ brand, className = '' }: { brand?: string | null; className?: string }) {
  const meta = BRAND_META[(brand || '').toLowerCase()];
  return (
    <div className={`h-10 w-14 rounded-md flex items-center justify-center bg-muted shrink-0 ${className}`}>
      <CreditCard className={`h-5 w-5 ${meta?.color ?? 'text-muted-foreground'}`} />
    </div>
  );
}

function StatCard({ value, label, color = '' }: { value: number; label: string; color?: string }) {
  return (
    <Card className="border border-border/50 shadow-none">
      <CardContent className="p-4 flex flex-col items-center justify-center gap-1 min-h-[72px]">
        <p className={`text-2xl font-bold leading-none ${color}`}>{value}</p>
        <p className="text-xs text-muted-foreground text-center">{label}</p>
      </CardContent>
    </Card>
  );
}

export default function PaymentMethodsPage() {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState('');
  const [stats, setStats] = useState<{ total?: number | null; active?: number | null; expired?: number | null } | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: string | null; deleting: boolean }>({
    open: false, id: null, deleting: false,
  });

  const fetchMethods = async () => {
    if (!userId.trim()) { setMethods([]); setStats(null); return; }
    setLoading(true);
    try {
      const { data } = await apolloClient.query({
        query: LIST_USER_PAYMENT_METHODS,
        variables: { userId: userId.trim() },
        fetchPolicy: 'network-only',
      });
      const result = (data as Record<string, unknown>)?.listUserPaymentMethods as PaymentMethodResponse;
      if (result?.success) setMethods(result.paymentMethods || []);

      // Stats via customer
      const { data: custData } = await apolloClient.query({
        query: GET_CUSTOMER_BY_USER_ID,
        variables: { userId: userId.trim() },
        fetchPolicy: 'network-only',
      });
      const custResult = (custData as Record<string, unknown>)?.getCustomerByUserId as StripeCustomerResponse;
      if (custResult?.customer?.stripeCustomerId) {
        const { data: statsData } = await apolloClient.query({
          query: GET_PAYMENT_METHODS_STATS,
          variables: { stripeCustomerId: custResult.customer.stripeCustomerId },
          fetchPolicy: 'network-only',
        });
        const statsResult = (statsData as Record<string, unknown>)?.getPaymentMethodsStats as StatsResponse;
        if (statsResult?.stats) setStats(statsResult.stats);
      }
    } catch {
      toast.error('Error al cargar los métodos de pago');
    } finally {
      setLoading(false);
    }
  };

  const { activeCompanyId } = useFitConnectAuth();
  useEffect(() => {
    const t = setTimeout(() => fetchMethods(), 400);
    return () => clearTimeout(t);
  }, [userId, activeCompanyId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSetDefault = async (paymentMethodId: string) => {
    try {
      await apolloClient.mutate({ mutation: SET_DEFAULT_PAYMENT_METHOD, variables: { paymentMethodId } });
      toast.success('Método de pago predeterminado actualizado');
      fetchMethods();
    } catch {
      toast.error('Error al actualizar');
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.id) return;
    setDeleteDialog((p) => ({ ...p, deleting: true }));
    try {
      const { data } = await apolloClient.mutate({
        mutation: REMOVE_PAYMENT_METHOD,
        variables: { paymentId: deleteDialog.id },
      });
      const result = (data as Record<string, unknown>)?.removePaymentMethod as BasicResponse;
      if (result?.success) {
        toast.success('Método de pago eliminado');
        setDeleteDialog({ open: false, id: null, deleting: false });
        fetchMethods();
      } else {
        toast.error(result?.message || 'Error al eliminar');
      }
    } catch {
      toast.error('Error al eliminar');
    } finally {
      setDeleteDialog((p) => ({ ...p, deleting: false }));
    }
  };

  const isExpired = (m: PaymentMethod) => {
    if (!m.expiryYear || !m.expiryMonth) return false;
    const now = new Date();
    const expiry = new Date(Number(m.expiryYear), Number(m.expiryMonth), 0); // last day of expiry month
    return expiry < now;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Métodos de Pago"
        description="Gestiona los métodos de pago de los usuarios"
      />

      {/* ── Search bar ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
        <div className="flex-1 min-w-0 max-w-sm">
          <UserAutocomplete
            value={userId}
            onChange={(id) => { setUserId(id); }}
            label="Usuario"
            placeholder="Buscar usuario por nombre..."
          />
        </div>
        {userId && (
          <Button variant="outline" size="sm" onClick={fetchMethods} disabled={loading} className="shrink-0 mt-6">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Actualizar'}
          </Button>
        )}
      </div>

      {/* ── Stats ──────────────────────────────────────────────────────── */}
      {stats && (
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          <StatCard value={stats.total ?? 0} label="Total" />
          <StatCard value={stats.active ?? 0} label="Activos" color="text-emerald-500" />
          <StatCard value={stats.expired ?? 0} label="Expirados" color="text-rose-500" />
        </div>
      )}

      {/* ── Content ────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : !userId.trim() ? (
        <Card className="border border-dashed border-border/60 shadow-none">
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center px-4">
            <CreditCard className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">Ingresa un ID de usuario para ver sus métodos de pago</p>
          </CardContent>
        </Card>
      ) : methods.length === 0 ? (
        <Card className="border border-dashed border-border/60 shadow-none">
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center px-4">
            <AlertCircle className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No se encontraron métodos de pago para este usuario</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {methods.map((m) => {
            const expired = isExpired(m);
            const brandMeta = BRAND_META[(m.brand || '').toLowerCase()];
            return (
              <Card
                key={m.id}
                className={`
                  border shadow-none transition-shadow hover:shadow-sm
                  ${m.isDefault ? 'border-primary/50 bg-primary/5' : 'border-border/50'}
                  ${expired ? 'opacity-70' : ''}
                `}
              >
                <CardContent className="p-4">
                  {/* ── Top row: icon + info + menu ── */}
                  <div className="flex items-start gap-3">
                    {/* Card brand icon */}
                    <CardBrandIcon brand={m.brand} />

                    {/* Card details — takes all remaining space */}
                    <div className="flex-1 min-w-0 space-y-1">
                      {/* Brand + last4 */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm capitalize leading-none">
                          {brandMeta?.label ?? (m.brand || 'Tarjeta')}
                        </span>
                        <span className="text-sm text-muted-foreground font-mono leading-none">
                          ···· {m.last4 ?? '????'}
                        </span>
                      </div>

                      {/* Expiry + country */}
                      <p className="text-xs text-muted-foreground truncate">
                        Vence {m.expiryMonth ?? '??'}/{m.expiryYear ?? '????'}
                        {m.country ? ` · ${m.country}` : ''}
                        {expired && <span className="ml-1 text-rose-400 font-medium">(Expirada)</span>}
                      </p>

                      {/* Badges row */}
                      <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                        <StatusBadge status={expired ? 'expired' : (m.status || 'active')} showDot />
                        {m.isDefault && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-primary/15 text-primary ring-1 ring-inset ring-primary/30">
                            <Star className="h-2.5 w-2.5 fill-current" />
                            Predeterminada
                          </span>
                        )}

                      </div>
                    </div>

                    {/* Actions menu — pinned to top-right */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 -mt-0.5 -mr-1">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        {!m.isDefault && (
                          <DropdownMenuItem onClick={() => handleSetDefault(m.id)}>
                            <Star className="mr-2 h-4 w-4" />
                            Predeterminar
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => setDeleteDialog({ open: true, id: m.id, deleting: false })}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* ── Security indicator ── */}
                  <div className="mt-3 pt-3 border-t border-border/40 flex items-center gap-1.5">
                    <ShieldCheck className="h-3 w-3 text-muted-foreground/60 shrink-0" />
                    <span className="text-xs text-muted-foreground/60 truncate">
                      ID: {m.id}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(o) => setDeleteDialog((p) => ({ ...p, open: o }))}
        title="Eliminar Método de Pago"
        description="¿Estás seguro de que deseas eliminar este método de pago? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        onConfirm={handleDelete}
        variant="destructive"
        loading={deleteDialog.deleting}
      />
    </div>
  );
}
