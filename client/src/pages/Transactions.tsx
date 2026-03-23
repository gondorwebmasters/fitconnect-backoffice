import { useEffect, useState, useMemo } from 'react';
import { apolloClient } from '@/graphql/apollo-client';
import {
  LIST_USER_TRANSACTIONS, GET_TRANSACTIONS_BY_STATUS, CREATE_CHARGE,
  REFUND_TRANSACTION, RETRY_FAILED_TRANSACTION, MARK_TRANSACTION_AS_RECONCILED,
} from '@/graphql/operations';
import type { Transaction, TransactionResponse } from '@/graphql/types';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable, Column } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserAutocomplete } from '@/components/common/UserAutocomplete';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Plus, MoreHorizontal, RotateCcw, RefreshCw, CheckCircle, Loader2, CreditCard } from 'lucide-react';
import { toast } from 'sonner';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Create charge dialog
  const [chargeOpen, setChargeOpen] = useState(false);
  const [charging, setCharging] = useState(false);
  const [newCharge, setNewCharge] = useState({ userId: '', amount: 0, currency: 'eur', description: '' });

  // Refund dialog
  const [refundDialog, setRefundDialog] = useState<{ open: boolean; id: string | null; amount: number; reason: string; processing: boolean }>({ open: false, id: null, amount: 0, reason: '', processing: false });

  // Confirm dialogs
  const [retryDialog, setRetryDialog] = useState<{ open: boolean; id: string | null; processing: boolean }>({ open: false, id: null, processing: false });
  const [reconcileDialog, setReconcileDialog] = useState<{ open: boolean; id: string | null; processing: boolean }>({ open: false, id: null, processing: false });

  const fetchTransactions = async () => {
    if (!userId) { setTransactions([]); return; }
    setLoading(true);
    try {
      let data;
      if (statusFilter !== 'all') {
        const res = await apolloClient.query({ query: GET_TRANSACTIONS_BY_STATUS, variables: { userId, status: statusFilter }, fetchPolicy: 'network-only' });
        data = res.data;
        const result = (data as Record<string, unknown>)?.getTransactionsByStatus as TransactionResponse;
        if (result?.success) setTransactions(result.transactions || []);
      } else {
        const res = await apolloClient.query({ query: LIST_USER_TRANSACTIONS, variables: { userId }, fetchPolicy: 'network-only' });
        data = res.data;
        const result = (data as Record<string, unknown>)?.listUserTransactions as TransactionResponse;
        if (result?.success) setTransactions(result.transactions || []);
      }
    } catch { toast.error('Error al cargar las transacciones'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    const t = setTimeout(() => fetchTransactions(), 400);
    return () => clearTimeout(t);
  }, [userId, statusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCreateCharge = async () => {
    if (!newCharge.userId || !newCharge.amount) { toast.error('El usuario y el importe son obligatorios'); return; }
    setCharging(true);
    try {
      const { data } = await apolloClient.mutate({
        mutation: CREATE_CHARGE,
        variables: { input: { userId: newCharge.userId, amount: Number(newCharge.amount), currency: newCharge.currency, description: newCharge.description || undefined } },
      });
      const result = (data as Record<string, unknown>)?.createCharge as TransactionResponse;
      if (result?.success) { toast.success('Cargo creado'); setChargeOpen(false); setUserId(newCharge.userId); fetchTransactions(); }
      else { toast.error(result?.message || 'Error'); }
    } catch { toast.error('Error'); }
    finally { setCharging(false); }
  };

  const handleRefund = async () => {
    if (!refundDialog.id) return;
    setRefundDialog((p) => ({ ...p, processing: true }));
    try {
      const { data } = await apolloClient.mutate({
        mutation: REFUND_TRANSACTION,
        variables: { input: { transactionId: refundDialog.id, amount: refundDialog.amount || undefined, reason: refundDialog.reason || undefined } },
      });
      const result = (data as Record<string, unknown>)?.refundTransaction as TransactionResponse;
      if (result?.success) { toast.success('Reembolso procesado'); setRefundDialog({ open: false, id: null, amount: 0, reason: '', processing: false }); fetchTransactions(); }
      else { toast.error(result?.message || 'Error'); }
    } catch { toast.error('Error'); }
    finally { setRefundDialog((p) => ({ ...p, processing: false })); }
  };

  const handleRetry = async () => {
    if (!retryDialog.id) return;
    setRetryDialog((p) => ({ ...p, processing: true }));
    try {
      await apolloClient.mutate({ mutation: RETRY_FAILED_TRANSACTION, variables: { transactionId: retryDialog.id } });
      toast.success('Transacción reintentada');
      setRetryDialog({ open: false, id: null, processing: false });
      fetchTransactions();
    } catch { toast.error('Error al reintentar'); }
    finally { setRetryDialog((p) => ({ ...p, processing: false })); }
  };

  const handleReconcile = async () => {
    if (!reconcileDialog.id) return;
    setReconcileDialog((p) => ({ ...p, processing: true }));
    try {
      await apolloClient.mutate({ mutation: MARK_TRANSACTION_AS_RECONCILED, variables: { transactionId: reconcileDialog.id } });
      toast.success('Marcada como conciliada');
      setReconcileDialog({ open: false, id: null, processing: false });
      fetchTransactions();
    } catch { toast.error('Error'); }
    finally { setReconcileDialog((p) => ({ ...p, processing: false })); }
  };

  const columns: Column<Transaction>[] = useMemo(() => [
    { key: 'id', header: 'ID', render: (t) => <span className="text-xs font-mono">{t.id.slice(0, 8)}...</span> },
    { key: 'type', header: 'Tipo', render: (t) => <StatusBadge status={t.type || 'unknown'} /> },
    { key: 'status', header: 'Estado', render: (t) => <StatusBadge status={t.status || 'unknown'} /> },
    { key: 'amount', header: 'Importe', render: (t) => <span className="font-medium text-sm">{(t.formattedAmount || 0).toFixed(2)} {(t.currency || 'eur').toUpperCase()}</span> },
    { key: 'payment', header: 'Método de pago', render: (t) => t.paymentMethod ? <span className="text-xs">{t.paymentMethod.brand} ****{t.paymentMethod.last4}</span> : <span className="text-xs text-muted-foreground">—</span> },
    { key: 'date', header: 'Fecha', render: (t) => <span className="text-xs text-muted-foreground">{new Date(t.created_at).toLocaleDateString('es-ES')}</span> },
    {
      key: 'actions', header: '', className: 'w-12',
      render: (t) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {t.status === 'succeeded' && <DropdownMenuItem onClick={() => setRefundDialog({ open: true, id: t.id, amount: t.formattedAmount || 0, reason: '', processing: false })}><RotateCcw className="mr-2 h-4 w-4" /> Reembolsar</DropdownMenuItem>}
            {t.status === 'failed' && <DropdownMenuItem onClick={() => setRetryDialog({ open: true, id: t.id, processing: false })}><RefreshCw className="mr-2 h-4 w-4" /> Reintentar</DropdownMenuItem>}
            <DropdownMenuItem onClick={() => setReconcileDialog({ open: true, id: t.id, processing: false })}><CheckCircle className="mr-2 h-4 w-4" /> Conciliar</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ], []);

  return (
    <div>
      <PageHeader title="Transacciones" description="Visualiza y gestiona los pagos" actions={<Button onClick={() => setChargeOpen(true)}><Plus className="mr-2 h-4 w-4" /> Crear cargo</Button>} />

      <div className="flex gap-4 mb-6">
        <div className="flex-1 max-w-sm">
          <UserAutocomplete
            value={userId}
            onChange={setUserId}
            label="Usuario"
            placeholder="Buscar usuario para ver transacciones..."
          />
        </div>
        <div className="w-48">
          <Label>Filtrar por estado</Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="succeeded">Completado</SelectItem>
              <SelectItem value="pending">Pendiente</SelectItem>
              <SelectItem value="failed">Fallido</SelectItem>
              <SelectItem value="refunded">Reembolsado</SelectItem>
              <SelectItem value="canceled">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <DataTable columns={columns} data={transactions} loading={loading} emptyMessage={userId ? 'No se encontraron transacciones.' : 'Selecciona un usuario para ver sus transacciones.'} keyExtractor={(t) => t.id} />

      {/* Crear cargo */}
      <Dialog open={chargeOpen} onOpenChange={setChargeOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Crear cargo</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <UserAutocomplete
                value={newCharge.userId}
                onChange={(id) => setNewCharge({ ...newCharge, userId: id })}
                label="Usuario *"
                placeholder="Buscar usuario..."
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Importe *</Label><Input type="number" step="0.01" min="0" value={newCharge.amount} onChange={(e) => setNewCharge({ ...newCharge, amount: parseFloat(e.target.value) || 0 })} /></div>
              <div className="space-y-2"><Label>Moneda</Label>
                <Select value={newCharge.currency} onValueChange={(v) => setNewCharge({ ...newCharge, currency: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="eur">EUR</SelectItem><SelectItem value="usd">USD</SelectItem></SelectContent></Select>
              </div>
            </div>
            <div className="space-y-2"><Label>Descripción</Label><Input value={newCharge.description} onChange={(e) => setNewCharge({ ...newCharge, description: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setChargeOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreateCharge} disabled={charging}>{charging ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CreditCard className="mr-2 h-4 w-4" />} Cobrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reembolso */}
      <Dialog open={refundDialog.open} onOpenChange={(o) => setRefundDialog((p) => ({ ...p, open: o }))}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reembolsar transacción</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label>Importe (deja 0 para reembolso total)</Label><Input type="number" step="0.01" min="0" value={refundDialog.amount} onChange={(e) => setRefundDialog((p) => ({ ...p, amount: parseFloat(e.target.value) || 0 }))} /></div>
            <div className="space-y-2"><Label>Motivo</Label><Input value={refundDialog.reason} onChange={(e) => setRefundDialog((p) => ({ ...p, reason: e.target.value }))} placeholder="Motivo opcional" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRefundDialog((p) => ({ ...p, open: false }))}>Cancelar</Button>
            <Button onClick={handleRefund} disabled={refundDialog.processing} variant="destructive">{refundDialog.processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Reembolsar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={retryDialog.open} onOpenChange={(o) => setRetryDialog((p) => ({ ...p, open: o }))} title="Reintentar transacción" description="¿Reintentar esta transacción fallida?" confirmLabel="Reintentar" onConfirm={handleRetry} loading={retryDialog.processing} />
      <ConfirmDialog open={reconcileDialog.open} onOpenChange={(o) => setReconcileDialog((p) => ({ ...p, open: o }))} title="Marcar como conciliada" description="¿Marcar esta transacción como conciliada?" confirmLabel="Conciliar" onConfirm={handleReconcile} loading={reconcileDialog.processing} />
    </div>
  );
}
