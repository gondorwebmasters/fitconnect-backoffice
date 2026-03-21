import { useEffect, useState, useMemo } from 'react';
import { apolloClient } from '@/graphql/apollo-client';
import {
  LIST_USER_PAYMENT_METHODS, REMOVE_PAYMENT_METHOD, SET_DEFAULT_PAYMENT_METHOD,
  GET_PAYMENT_METHODS_STATS, GET_CUSTOMER_BY_USER_ID,
} from '@/graphql/operations';
import type { PaymentMethod, PaymentMethodResponse, BasicResponse, StatsResponse, StripeCustomerResponse } from '@/graphql/types';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Trash2, Star, CreditCard, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function PaymentMethodsPage() {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState('');
  const [stats, setStats] = useState<{ total?: number | null; active?: number | null; expired?: number | null } | null>(null);

  // Delete
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: string | null; deleting: boolean }>({ open: false, id: null, deleting: false });

  const fetchMethods = async () => {
    if (!userId) { setMethods([]); setStats(null); return; }
    setLoading(true);
    try {
      const { data } = await apolloClient.query({ query: LIST_USER_PAYMENT_METHODS, variables: { userId }, fetchPolicy: 'network-only' });
      const result = (data as Record<string, unknown>)?.listUserPaymentMethods as PaymentMethodResponse;
      if (result?.success) setMethods(result.paymentMethods || []);

      // Get stats via customer
      const { data: custData } = await apolloClient.query({ query: GET_CUSTOMER_BY_USER_ID, variables: { userId }, fetchPolicy: 'network-only' });
      const custResult = (custData as Record<string, unknown>)?.getCustomerByUserId as StripeCustomerResponse;
      if (custResult?.customer?.stripeCustomerId) {
        const { data: statsData } = await apolloClient.query({ query: GET_PAYMENT_METHODS_STATS, variables: { stripeCustomerId: custResult.customer.stripeCustomerId }, fetchPolicy: 'network-only' });
        const statsResult = (statsData as Record<string, unknown>)?.getPaymentMethodsStats as StatsResponse;
        if (statsResult?.stats) setStats(statsResult.stats);
      }
    } catch { toast.error('Failed to load payment methods'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    const t = setTimeout(() => fetchMethods(), 400);
    return () => clearTimeout(t);
  }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSetDefault = async (paymentMethodId: string) => {
    try {
      await apolloClient.mutate({ mutation: SET_DEFAULT_PAYMENT_METHOD, variables: { paymentMethodId } });
      toast.success('Default payment method updated');
      fetchMethods();
    } catch { toast.error('Failed'); }
  };

  const handleDelete = async () => {
    if (!deleteDialog.id) return;
    setDeleteDialog((p) => ({ ...p, deleting: true }));
    try {
      const { data } = await apolloClient.mutate({ mutation: REMOVE_PAYMENT_METHOD, variables: { paymentId: deleteDialog.id } });
      const result = (data as Record<string, unknown>)?.removePaymentMethod as BasicResponse;
      if (result?.success) { toast.success('Payment method removed'); setDeleteDialog({ open: false, id: null, deleting: false }); fetchMethods(); }
      else { toast.error(result?.message || 'Failed'); }
    } catch { toast.error('Error'); }
    finally { setDeleteDialog((p) => ({ ...p, deleting: false })); }
  };

  return (
    <div>
      <PageHeader title="Payment Methods" description="Manage user payment methods" />

      <div className="mb-6">
        <Label>User ID</Label>
        <Input value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="Enter user ID" className="max-w-sm mt-1" />
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card className="border-0 shadow-sm"><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{stats.total || 0}</p><p className="text-xs text-muted-foreground">Total</p></CardContent></Card>
          <Card className="border-0 shadow-sm"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-emerald-600">{stats.active || 0}</p><p className="text-xs text-muted-foreground">Active</p></CardContent></Card>
          <Card className="border-0 shadow-sm"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-red-600">{stats.expired || 0}</p><p className="text-xs text-muted-foreground">Expired</p></CardContent></Card>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : methods.length === 0 ? (
        <Card className="border-0 shadow-sm"><CardContent className="p-8 text-center text-muted-foreground">{userId ? 'No payment methods found.' : 'Enter a user ID to view payment methods.'}</CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {methods.map((m) => (
            <Card key={m.id} className={`border-0 shadow-sm ${m.isDefault ? 'ring-2 ring-primary' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center">
                      <CreditCard className="h-5 w-5 text-slate-500" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm capitalize">{m.brand || 'Card'}</p>
                        <span className="text-sm text-muted-foreground">****{m.last4}</span>
                        {m.isDefault && <Badge className="text-xs">Default</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Expires {m.expiryMonth}/{m.expiryYear}
                        {m.country && ` · ${m.country}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <StatusBadge status={m.status || 'active'} />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {!m.isDefault && <DropdownMenuItem onClick={() => handleSetDefault(m.id)}><Star className="mr-2 h-4 w-4" /> Set as Default</DropdownMenuItem>}
                        <DropdownMenuItem onClick={() => setDeleteDialog({ open: true, id: m.id, deleting: false })} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Remove</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog open={deleteDialog.open} onOpenChange={(o) => setDeleteDialog((p) => ({ ...p, open: o }))} title="Remove Payment Method" description="Are you sure you want to remove this payment method?" confirmLabel="Remove" onConfirm={handleDelete} variant="destructive" loading={deleteDialog.deleting} />
    </div>
  );
}
