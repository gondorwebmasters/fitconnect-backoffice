import { useEffect, useState, useMemo } from 'react';
import { apolloClient } from '@/graphql/apollo-client';
import { LIST_PLANS, CREATE_PLAN, UPDATE_PLAN, REMOVE_PLAN } from '@/graphql/operations';
import type { Plan, PlanResponse, BasicResponse } from '@/graphql/types';
import { useFitConnectAuth } from '@/contexts/FitConnectAuthContext';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable, Column } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Plus, MoreHorizontal, Pencil, Trash2, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';

const defaultPlan = {
  name: '', description: '', amount: 0, currency: 'eur', interval: 'month',
  intervalCount: 1, trialPeriodDays: 0, features: [] as string[], status: 'active',
};

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [form, setForm] = useState({ ...defaultPlan });
  const [saving, setSaving] = useState(false);
  const [featureInput, setFeatureInput] = useState('');

  // Delete
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: string | null; deleting: boolean }>({ open: false, id: null, deleting: false });

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const { data } = await apolloClient.query({ query: LIST_PLANS, fetchPolicy: 'network-only' });
      const result = (data as Record<string, unknown>)?.listPlans as PlanResponse;
      if (result?.success) setPlans(result.plans || []);
    } catch { toast.error('Error al cargar los planes'); }
    finally { setLoading(false); }
  };

  const { activeCompanyId } = useFitConnectAuth();
  useEffect(() => { fetchPlans(); }, [activeCompanyId]); // eslint-disable-line react-hooks/exhaustive-deps

  const filteredPlans = useMemo(() => {
    if (!search) return plans;
    const q = search.toLowerCase();
    return plans.filter((p) => p.name.toLowerCase().includes(q));
  }, [plans, search]);

  const openCreate = () => { setEditingPlan(null); setForm({ ...defaultPlan }); setDialogOpen(true); };
  const openEdit = (plan: Plan) => {
    setEditingPlan(plan);
    setForm({
      name: plan.name, description: plan.description, amount: plan.amount,
      currency: plan.currency, interval: plan.interval, intervalCount: plan.intervalCount || 1,
      trialPeriodDays: plan.trialPeriodDays || 0, features: plan.features || [],
      status: plan.status,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name) { toast.error('El nombre es obligatorio'); return; }
    setSaving(true);
    try {
      const mutation = editingPlan ? UPDATE_PLAN : CREATE_PLAN;
      const variables = {
        plan: {
          ...(editingPlan ? { id: editingPlan.id } : {}),
          name: form.name, description: form.description, amount: Number(form.amount),
          currency: form.currency, interval: form.interval, intervalCount: Number(form.intervalCount),
          trialPeriodDays: Number(form.trialPeriodDays), features: form.features, status: form.status,
        },
      };
      const { data } = await apolloClient.mutate({ mutation, variables });
      const key = editingPlan ? 'updatePlan' : 'createPlan';
      const result = (data as Record<string, unknown>)?.[key] as PlanResponse;
      if (result?.success) {
        toast.success(editingPlan ? 'Plan actualizado' : 'Plan creado');
        setDialogOpen(false);
        fetchPlans();
      } else { toast.error(result?.message || 'Error'); }
    } catch { toast.error('Error al guardar el plan'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteDialog.id) return;
    setDeleteDialog((p) => ({ ...p, deleting: true }));
    try {
      const { data } = await apolloClient.mutate({ mutation: REMOVE_PLAN, variables: { planId: deleteDialog.id } });
      const result = (data as Record<string, unknown>)?.removePlan as BasicResponse;
      if (result?.success) { toast.success('Plan eliminado'); setDeleteDialog({ open: false, id: null, deleting: false }); fetchPlans(); }
      else { toast.error(result?.message || 'Error'); }
    } catch { toast.error('Error'); }
    finally { setDeleteDialog((p) => ({ ...p, deleting: false })); }
  };

  const addFeature = () => {
    if (featureInput.trim()) {
      setForm({ ...form, features: [...form.features, featureInput.trim()] });
      setFeatureInput('');
    }
  };

  const removeFeature = (idx: number) => {
    setForm({ ...form, features: form.features.filter((_, i) => i !== idx) });
  };

  const columns: Column<Plan>[] = useMemo(() => [
    { key: 'name', header: 'Plan', render: (p) => <div><p className="font-medium text-sm">{p.name}</p><p className="text-xs text-muted-foreground truncate max-w-xs">{p.description}</p></div> },
    { key: 'price', header: 'Precio', render: (p) => <span className="text-sm font-medium">{p.amount.toFixed(2)} {p.currency.toUpperCase()}/{p.interval}</span> },
    { key: 'status', header: 'Estado', render: (p) => <StatusBadge status={p.status} /> },
    { key: 'features', header: 'Funciones', render: (p) => <div className="flex flex-wrap gap-1">{(p.features || []).slice(0, 3).map((f, i) => <Badge key={i} variant="secondary" className="text-xs">{f}</Badge>)}{(p.features || []).length > 3 && <Badge variant="outline" className="text-xs">+{p.features.length - 3}</Badge>}</div> },
    { key: 'trial', header: 'Prueba', render: (p) => <span className="text-sm">{p.trialPeriodDays ? `${p.trialPeriodDays} días` : '—'}</span> },
    {
      key: 'actions', header: '', className: 'w-12',
      render: (p) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => openEdit(p)}><Pencil className="mr-2 h-4 w-4" /> Editar</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setDeleteDialog({ open: true, id: p.id, deleting: false })} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Eliminar</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ], []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      <PageHeader title="Planes" description="Gestiona los planes de suscripción" actions={<Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" /> Añadir plan</Button>} />
      <DataTable columns={columns} data={filteredPlans} loading={loading} searchValue={search} onSearchChange={setSearch} searchPlaceholder="Buscar planes..." emptyMessage="No se encontraron planes." keyExtractor={(p) => p.id} />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingPlan ? 'Editar plan' : 'Crear plan'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2"><Label>Nombre *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="space-y-2"><Label>Descripción</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Importe</Label><Input type="number" step="0.01" min="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })} /></div>
              <div className="space-y-2"><Label>Moneda</Label>
                <Select value={form.currency} onValueChange={(v) => setForm({ ...form, currency: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="eur">EUR</SelectItem><SelectItem value="usd">USD</SelectItem></SelectContent></Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Intervalo</Label>
                <Select value={form.interval} onValueChange={(v) => setForm({ ...form, interval: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="day">Día</SelectItem><SelectItem value="week">Semana</SelectItem><SelectItem value="month">Mes</SelectItem><SelectItem value="year">Año</SelectItem></SelectContent></Select>
              </div>
              <div className="space-y-2"><Label>Cantidad de intervalos</Label><Input type="number" min="1" value={form.intervalCount} onChange={(e) => setForm({ ...form, intervalCount: parseInt(e.target.value) || 1 })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Período de prueba (días)</Label><Input type="number" min="0" value={form.trialPeriodDays} onChange={(e) => setForm({ ...form, trialPeriodDays: parseInt(e.target.value) || 0 })} /></div>
              <div className="space-y-2"><Label>Estado</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="active">Activo</SelectItem><SelectItem value="inactive">Inactivo</SelectItem><SelectItem value="archived">Archivado</SelectItem></SelectContent></Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Funciones incluidas</Label>
              <div className="flex gap-2"><Input value={featureInput} onChange={(e) => setFeatureInput(e.target.value)} placeholder="Añadir función" onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addFeature(); } }} /><Button type="button" variant="outline" onClick={addFeature}>Añadir</Button></div>
              <div className="flex flex-wrap gap-1 mt-2">{form.features.map((f, i) => <Badge key={i} variant="secondary" className="gap-1">{f}<button onClick={() => removeFeature(i)}><X className="h-3 w-3" /></button></Badge>)}</div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} {editingPlan ? 'Actualizar' : 'Crear'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={deleteDialog.open} onOpenChange={(o) => setDeleteDialog((p) => ({ ...p, open: o }))} title="Eliminar plan" description="¿Estás seguro? Esto eliminará el plan de forma permanente." confirmLabel="Eliminar" onConfirm={handleDelete} variant="destructive" loading={deleteDialog.deleting} />
    </div>
  );
}
