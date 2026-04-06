import { useRefreshOnCompanyChange } from '@/hooks/useRefreshOnCompanyChange';
import { useEffect, useState } from 'react';
import { apolloClient } from '@/graphql/apollo-client';
import {
  LIST_USER_SUBSCRIPTIONS, CREATE_SUBSCRIPTION, CANCEL_SUBSCRIPTION,
  PAUSE_SUBSCRIPTION, RESUME_SUBSCRIPTION, CHANGE_SUBSCRIPTION_PLAN, LIST_PLANS,
} from '@/graphql/operations';
import type { Subscription, SubscriptionResponse, Plan, PlanResponse, BasicResponse, User } from '@/graphql/types';
import { useFitConnectAuth } from '@/contexts/FitConnectAuthContext';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { UserAutocomplete } from '@/components/common/UserAutocomplete';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Plus, MoreHorizontal, XCircle, Pause, Play, RefreshCw, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  // Start as false — skeleton only shows when a userId is selected and loading
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState('');
  // Full user object from the autocomplete (needed to check contextRole)
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newSub, setNewSub] = useState({ planId: '', userId: '' });

  // Cancel dialog
  const [cancelDialog, setCancelDialog] = useState<{ open: boolean; id: string | null; cancelling: boolean }>({ open: false, id: null, cancelling: false });

  // Change plan dialog
  const [changePlanDialog, setChangePlanDialog] = useState<{ open: boolean; subId: string | null; newPlanId: string; saving: boolean }>({ open: false, subId: null, newPlanId: '', saving: false });

  const { activeCompanyId } = useFitConnectAuth();

  // Fetch plans — uses showGlobal when the selected user is an admin
  const fetchPlans = (user: User | null) => {
    const isAdmin = user?.contextRole === 'admin';
    apolloClient.query({
      query: LIST_PLANS,
      variables: { showGlobal: isAdmin || undefined },
      fetchPolicy: 'network-only',
    })
      .then(({ data }) => {
        const result = (data as Record<string, unknown>)?.listPlans as PlanResponse;
        if (result?.success) setPlans(result.plans || []);
      }).catch(() => {});
  };

  // Refetch plans when company changes (with current selected user)
  useEffect(() => {
    fetchPlans(selectedUser);
  }, [activeCompanyId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Refetch plans when selected user changes (to apply/remove showGlobal)
  useEffect(() => {
    fetchPlans(selectedUser);
  }, [selectedUser]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchSubscriptions = async (uid: string) => {
    if (!uid) { setSubscriptions([]); setLoading(false); return; }
    setLoading(true);
    try {
      const { data } = await apolloClient.query({
        query: LIST_USER_SUBSCRIPTIONS,
        variables: { userId: uid },
        fetchPolicy: 'network-only',
      });
      const result = (data as Record<string, unknown>)?.listUserSubscriptions as SubscriptionResponse;
      if (result?.success) setSubscriptions(result.subscriptions || []);
      else setSubscriptions([]);
    } catch { toast.error('Error al cargar las suscripciones'); setSubscriptions([]); }
    finally { setLoading(false); }
  };

  // Refetch when userId changes (debounced)
  useEffect(() => {
    const t = setTimeout(() => fetchSubscriptions(userId), 400);
    return () => clearTimeout(t);
  }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Refetch when company changes (if a user is already selected)
  useRefreshOnCompanyChange(activeCompanyId, () => fetchSubscriptions(userId));

  const handleCreate = async () => {
    if (!newSub.planId || !newSub.userId) { toast.error('El plan y el usuario son obligatorios'); return; }
    setCreating(true);
    try {
      const { data } = await apolloClient.mutate({
        mutation: CREATE_SUBSCRIPTION,
        variables: { subscription: { planId: newSub.planId, userId: newSub.userId } },
      });
      const result = (data as Record<string, unknown>)?.createSubscription as SubscriptionResponse;
      if (result?.success) { toast.success('Suscripción creada'); setCreateOpen(false); setUserId(newSub.userId); fetchSubscriptions(newSub.userId); }
      else { toast.error(result?.message || 'Error al crear'); }
    } catch { toast.error('Error'); }
    finally { setCreating(false); }
  };

  const handleCancel = async () => {
    if (!cancelDialog.id) return;
    setCancelDialog((p) => ({ ...p, cancelling: true }));
    try {
      const { data } = await apolloClient.mutate({ mutation: CANCEL_SUBSCRIPTION, variables: { input: { subscriptionId: cancelDialog.id } } });
      const result = (data as Record<string, unknown>)?.cancelSubscription as SubscriptionResponse;
      if (result?.success) { toast.success('Suscripción cancelada'); setCancelDialog({ open: false, id: null, cancelling: false }); fetchSubscriptions(userId); }
      else { toast.error(result?.message || 'Error'); }
    } catch { toast.error('Error'); }
    finally { setCancelDialog((p) => ({ ...p, cancelling: false })); }
  };

  const handlePause = async (id: string) => {
    try { await apolloClient.mutate({ mutation: PAUSE_SUBSCRIPTION, variables: { subscriptionId: id } }); toast.success('Suscripción pausada'); fetchSubscriptions(userId); }
    catch { toast.error('Error al pausar'); }
  };

  const handleResume = async (id: string) => {
    try { await apolloClient.mutate({ mutation: RESUME_SUBSCRIPTION, variables: { subscriptionId: id } }); toast.success('Suscripción reanudada'); fetchSubscriptions(userId); }
    catch { toast.error('Error al reanudar'); }
  };

  const handleChangePlan = async () => {
    if (!changePlanDialog.subId || !changePlanDialog.newPlanId) return;
    setChangePlanDialog((p) => ({ ...p, saving: true }));
    try {
      await apolloClient.mutate({ mutation: CHANGE_SUBSCRIPTION_PLAN, variables: { subscriptionId: changePlanDialog.subId, newPlanId: changePlanDialog.newPlanId } });
      toast.success('Plan cambiado');
      setChangePlanDialog({ open: false, subId: null, newPlanId: '', saving: false });
      fetchSubscriptions(userId);
    } catch { toast.error('Error al cambiar el plan'); }
    finally { setChangePlanDialog((p) => ({ ...p, saving: false })); }
  };

  return (
    <div>
      <PageHeader title="Suscripciones" description="Gestiona las suscripciones de los usuarios" actions={<Button onClick={() => setCreateOpen(true)}><Plus className="mr-2 h-4 w-4" /> Nueva suscripción</Button>} />

      <div className="mb-6 max-w-sm">
        <UserAutocomplete
          value={userId}
          onChange={setUserId}
          onUserSelect={(user) => {
            setSelectedUser(user);
          }}
          label="Usuario"
          placeholder="Buscar usuario para ver suscripciones..."
        />
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Card key={i} className="border-0 shadow-sm"><CardContent className="p-4"><div className="h-16 animate-pulse bg-muted rounded" /></CardContent></Card>)}</div>
      ) : subscriptions.length === 0 ? (
        <Card className="border-0 shadow-sm"><CardContent className="p-8 text-center text-muted-foreground">{userId ? 'No se encontraron suscripciones para este usuario.' : 'Selecciona un usuario para ver sus suscripciones.'}</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {subscriptions.map((sub) => (
            <Card key={sub.id} className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">Suscripción #{sub.id.slice(0, 8)}</p>
                      <StatusBadge status={sub.status} />
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Inicio: {new Date(sub.startDate).toLocaleDateString('es-ES')}</span>
                      <span>Fin: {new Date(sub.endDate).toLocaleDateString('es-ES')}</span>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {sub.status === 'active' && <DropdownMenuItem onClick={() => handlePause(sub.id)}><Pause className="mr-2 h-4 w-4" /> Pausar</DropdownMenuItem>}
                      {sub.status === 'paused' && <DropdownMenuItem onClick={() => handleResume(sub.id)}><Play className="mr-2 h-4 w-4" /> Reanudar</DropdownMenuItem>}
                      <DropdownMenuItem onClick={() => setChangePlanDialog({ open: true, subId: sub.id, newPlanId: '', saving: false })}><RefreshCw className="mr-2 h-4 w-4" /> Cambiar plan</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setCancelDialog({ open: true, id: sub.id, cancelling: false })} className="text-destructive"><XCircle className="mr-2 h-4 w-4" /> Cancelar</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Crear suscripción */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Crear suscripción</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <UserAutocomplete
                value={newSub.userId}
                onChange={(id) => setNewSub({ ...newSub, userId: id })}
                label="Usuario *"
                placeholder="Buscar usuario..."
                required
              />
            </div>
            <div className="space-y-2"><Label>Plan *</Label>
              <Select value={newSub.planId} onValueChange={(v) => setNewSub({ ...newSub, planId: v })}><SelectTrigger><SelectValue placeholder="Seleccionar plan" /></SelectTrigger>
                <SelectContent>{plans.map((p) => <SelectItem key={p.id} value={p.id}>{p.name} — {p.amount} {p.currency.toUpperCase()}/{p.interval}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={creating}>{creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Crear</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cambiar plan */}
      <Dialog open={changePlanDialog.open} onOpenChange={(o) => setChangePlanDialog((p) => ({ ...p, open: o }))}>
        <DialogContent>
          <DialogHeader><DialogTitle>Cambiar plan de suscripción</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label>Nuevo plan</Label>
              <Select value={changePlanDialog.newPlanId} onValueChange={(v) => setChangePlanDialog((p) => ({ ...p, newPlanId: v }))}><SelectTrigger><SelectValue placeholder="Seleccionar nuevo plan" /></SelectTrigger>
                <SelectContent>{plans.map((p) => <SelectItem key={p.id} value={p.id}>{p.name} — {p.amount} {p.currency.toUpperCase()}/{p.interval}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setChangePlanDialog((p) => ({ ...p, open: false }))}>Cancelar</Button>
            <Button onClick={handleChangePlan} disabled={changePlanDialog.saving}>{changePlanDialog.saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Cambiar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={cancelDialog.open} onOpenChange={(o) => setCancelDialog((p) => ({ ...p, open: o }))} title="Cancelar suscripción" description="¿Estás seguro de que quieres cancelar esta suscripción?" confirmLabel="Cancelar suscripción" onConfirm={handleCancel} variant="destructive" loading={cancelDialog.cancelling} />
    </div>
  );
}
