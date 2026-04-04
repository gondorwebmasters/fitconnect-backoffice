import { useRefreshOnCompanyChange } from '@/hooks/useRefreshOnCompanyChange';
import { useEffect, useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { apolloClient } from '@/graphql/apollo-client';
import { GET_COMPANIES, UPDATE_COMPANY, UPDATE_COMPANY_LOGO, GET_PRESIGNED_URL, ADMIT_USER_TO_COMPANY } from '@/graphql/operations';
import type { Company, CompanyResponse, PresignedUrlResponse, BasicResponse } from '@/graphql/types';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserAutocomplete } from '@/components/common/UserAutocomplete';
import { ArrowLeft, Building2, Loader2, Save, Upload, UserPlus } from 'lucide-react';
import { toast } from 'sonner';

export default function CompanyDetailPage() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [admitting, setAdmitting] = useState(false);
  const [admitUserId, setAdmitUserId] = useState('');
  const [company, setCompany] = useState<Company | null>(null);

  const [form, setForm] = useState({
    name: '', email: '', phoneNumber: '', address: '',
    pollsEnabled: false, productsEnabled: false, chatEnabled: false, trainingEnabled: false,
    maxActiveReservations: 3, maxAdvanceBookingDays: 7, sameDayBookingAllowed: true,
    fullOpenHours: 24, bookingCutoffMinutes: 30, minBookingsRequired: 1,
  });

  useEffect(() => {
    if (params.id) {
      apolloClient.query({ query: GET_COMPANIES, variables: { companyId: params.id }, fetchPolicy: 'network-only' })
        .then(({ data }) => {
          const result = (data as Record<string, unknown>)?.getCompanies as CompanyResponse;
          const c = result?.company;
          if (c) {
            setCompany(c);
            setForm({
              name: c.name, email: c.email, phoneNumber: c.phoneNumber, address: c.address,
              pollsEnabled: c.companyConfig?.pollsEnabled || false,
              productsEnabled: c.companyConfig?.productsEnabled || false,
              chatEnabled: c.companyConfig?.chatEnabled || false,
              trainingEnabled: c.companyConfig?.trainingEnabled || false,
              maxActiveReservations: c.scheduleOptions?.maxActiveReservations || 3,
              maxAdvanceBookingDays: c.scheduleOptions?.maxAdvanceBookingDays || 7,
              sameDayBookingAllowed: c.scheduleOptions?.sameDayBookingAllowed ?? true,
              fullOpenHours: c.scheduleOptions?.fullOpenHours || 24,
              bookingCutoffMinutes: c.scheduleOptions?.bookingCutoffMinutes || 30,
              minBookingsRequired: c.scheduleOptions?.minBookingsRequired || 1,
            });
          }
        })
        .catch(() => toast.error('Error al cargar la empresa'))
        .finally(() => setLoading(false));
    }
  }, [params.id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await apolloClient.mutate({
        mutation: UPDATE_COMPANY,
        variables: {
          companyId: params.id,
          companyData: {
            name: form.name, email: form.email, phoneNumber: form.phoneNumber, address: form.address,
            companyConfig: { pollsEnabled: form.pollsEnabled, productsEnabled: form.productsEnabled, chatEnabled: form.chatEnabled, trainingEnabled: form.trainingEnabled },
          },
          scheduleOptions: {
            maxActiveReservations: form.maxActiveReservations, maxAdvanceBookingDays: form.maxAdvanceBookingDays,
            sameDayBookingAllowed: form.sameDayBookingAllowed, fullOpenHours: form.fullOpenHours,
            bookingCutoffMinutes: form.bookingCutoffMinutes, minBookingsRequired: form.minBookingsRequired,
          },
        },
      });
      const result = (data as Record<string, unknown>)?.updateCompany as CompanyResponse;
      if (result?.success) { toast.success('Empresa actualizada'); } else { toast.error(result?.message || 'Error'); }
    } catch { toast.error('Error al actualizar la empresa'); }
    finally { setSaving(false); }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { data: urlData } = await apolloClient.query({
        query: GET_PRESIGNED_URL,
        variables: { key: `companies/${params.id}/logo-${file.name}`, command: 'putObject' },
        fetchPolicy: 'network-only',
      });
      const urlResult = (urlData as Record<string, unknown>)?.getPresignedUrl as PresignedUrlResponse;
      if (urlResult?.presignedUrl) {
        await fetch(urlResult.presignedUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
        await apolloClient.mutate({ mutation: UPDATE_COMPANY_LOGO, variables: { companyId: params.id, picture: urlResult.key } });
        toast.success('Logo actualizado');
      }
    } catch { toast.error('Error al subir el logo'); }
    finally { setUploading(false); }
  };

  const handleAdmitUser = async () => {
    if (!admitUserId) { toast.error('Selecciona un usuario'); return; }
    setAdmitting(true);
    try {
      const { data } = await apolloClient.mutate({
        mutation: ADMIT_USER_TO_COMPANY,
        variables: { companyId: params.id, userId: admitUserId },
      });
      const result = (data as Record<string, unknown>)?.admitUserToCompany as BasicResponse;
      if (result?.success) {
        toast.success('Usuario admitido en la empresa');
        setAdmitUserId('');
      } else {
        toast.error(result?.message || 'Error al admitir usuario');
      }
    } catch { toast.error('Error al admitir usuario'); }
    finally { setAdmitting(false); }
  };

  if (loading) {
    return <div className="space-y-6"><Skeleton className="h-8 w-48" /><Card><CardContent className="p-6 space-y-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</CardContent></Card></div>;
  }

  return (
    <div>
      <PageHeader title="Editar empresa" description={company?.name || ''} actions={<Button variant="outline" onClick={() => setLocation('/companies')}><ArrowLeft className="mr-2 h-4 w-4" /> Volver</Button>} />

      <form onSubmit={handleSave}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Logo */}
          <Card className="border-0 shadow-sm lg:col-span-1">
            <CardContent className="p-6 flex flex-col items-center gap-4">
              <Avatar className="h-24 w-24 rounded-2xl">
                <AvatarImage src={company?.logo?.url || ''} />
                <AvatarFallback className="rounded-2xl text-2xl"><Building2 className="h-10 w-10" /></AvatarFallback>
              </Avatar>
              <Label htmlFor="logo-upload" className="cursor-pointer">
                <div className="flex items-center gap-2 text-sm text-primary hover:underline">
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  {uploading ? 'Subiendo...' : 'Cambiar logo'}
                </div>
                <input id="logo-upload" type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={uploading} />
              </Label>
            </CardContent>
          </Card>

          {/* Información básica */}
          <Card className="border-0 shadow-sm lg:col-span-2">
            <CardHeader><CardTitle className="text-base">Información de la empresa</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Nombre</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                <div className="space-y-2"><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Teléfono</Label><Input value={form.phoneNumber} onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })} /></div>
                <div className="space-y-2"><Label>Dirección</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
              </div>
            </CardContent>
          </Card>

          {/* Funciones */}
          <Card className="border-0 shadow-sm lg:col-span-1">
            <CardHeader><CardTitle className="text-base">Funciones</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {[
                { key: 'pollsEnabled' as const, label: 'Encuestas', desc: 'Habilitar encuestas comunitarias' },
                { key: 'productsEnabled' as const, label: 'Productos', desc: 'Habilitar catálogo de productos' },
                { key: 'chatEnabled' as const, label: 'Chat', desc: 'Habilitar mensajería' },
                { key: 'trainingEnabled' as const, label: 'Entrenamiento', desc: 'Habilitar tareas de entrenamiento' },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between">
                  <div><p className="text-sm font-medium">{item.label}</p><p className="text-xs text-muted-foreground">{item.desc}</p></div>
                  <Switch checked={form[item.key]} onCheckedChange={(v) => setForm({ ...form, [item.key]: v })} />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Opciones de horario */}
          <Card className="border-0 shadow-sm lg:col-span-2">
            <CardHeader><CardTitle className="text-base">Opciones de horario</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Máx. reservas activas</Label><Input type="number" min="1" value={form.maxActiveReservations} onChange={(e) => setForm({ ...form, maxActiveReservations: parseInt(e.target.value) || 1 })} /></div>
                <div className="space-y-2"><Label>Días máx. de reserva anticipada</Label><Input type="number" min="1" value={form.maxAdvanceBookingDays} onChange={(e) => setForm({ ...form, maxAdvanceBookingDays: parseInt(e.target.value) || 1 })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Corte de reserva (minutos)</Label><Input type="number" min="0" value={form.bookingCutoffMinutes} onChange={(e) => setForm({ ...form, bookingCutoffMinutes: parseInt(e.target.value) || 0 })} /></div>
                <div className="space-y-2"><Label>Mín. reservas requeridas</Label><Input type="number" min="0" value={form.minBookingsRequired} onChange={(e) => setForm({ ...form, minBookingsRequired: parseInt(e.target.value) || 0 })} /></div>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div><p className="text-sm font-medium">Reserva el mismo día</p><p className="text-xs text-muted-foreground">Permitir reservas para el mismo día</p></div>
                <Switch checked={form.sameDayBookingAllowed} onCheckedChange={(v) => setForm({ ...form, sameDayBookingAllowed: v })} />
              </div>
            </CardContent>
          </Card>

          {/* Admitir usuario */}
          <Card className="border-0 shadow-sm lg:col-span-3">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-primary" />
                Admitir usuario en la empresa
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Añade un usuario existente a esta empresa directamente, sin necesidad de que solicite unirse.
              </p>
              <div className="flex flex-wrap items-end gap-4">
                <div className="flex-1 min-w-[200px] max-w-sm">
                  <UserAutocomplete
                    value={admitUserId}
                    onChange={setAdmitUserId}
                    label="Usuario"
                    placeholder="Buscar usuario para admitir..."
                  />
                </div>
                <Button
                  type="button"
                  onClick={handleAdmitUser}
                  disabled={admitting || !admitUserId}
                  className="shrink-0"
                >
                  {admitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
                  Admitir usuario
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end mt-6">
          <Button type="submit" disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Guardar cambios
          </Button>
        </div>
      </form>
    </div>
  );
}
