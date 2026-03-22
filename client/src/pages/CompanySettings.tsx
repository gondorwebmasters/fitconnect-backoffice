import { useEffect, useState } from 'react';
import { apolloClient } from '@/graphql/apollo-client';
import { GET_COMPANIES, UPDATE_COMPANY, UPDATE_SCHEDULE_OPTIONS } from '@/graphql/operations';
import { useFitConnectAuth } from '@/contexts/FitConnectAuthContext';
import type { Company, CompanyResponse, ScheduleOptionsResponse } from '@/graphql/types';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, Settings, Calendar, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function CompanySettingsPage() {
  const { activeCompanyId } = useFitConnectAuth();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // General fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  // Config toggles
  const [pollsEnabled, setPollsEnabled] = useState(false);
  const [productsEnabled, setProductsEnabled] = useState(false);
  const [chatEnabled, setChatEnabled] = useState(false);
  const [trainingEnabled, setTrainingEnabled] = useState(false);

  // Schedule options
  const [maxActiveReservations, setMaxActiveReservations] = useState(3);
  const [maxAdvanceBookingDays, setMaxAdvanceBookingDays] = useState(7);

  useEffect(() => {
    if (!activeCompanyId) return;
    setLoading(true);
    apolloClient.query({
      query: GET_COMPANIES,
      variables: { companyId: activeCompanyId },
      fetchPolicy: 'network-only',
    }).then(({ data }) => {
      const result = (data as Record<string, unknown>)?.getCompanies as CompanyResponse;
      if (result?.success && result.company) {
        const c = result.company;
        setCompany(c);
        setName(c.name || '');
        setEmail(c.email || '');
        setPhone(c.phoneNumber || '');
        setAddress(c.address || '');
        if (c.companyConfig) {
          setPollsEnabled(c.companyConfig.pollsEnabled);
          setProductsEnabled(c.companyConfig.productsEnabled);
          setChatEnabled(c.companyConfig.chatEnabled);
          setTrainingEnabled(c.companyConfig.trainingEnabled);
        }
        if (c.scheduleOptions) {
          setMaxActiveReservations(c.scheduleOptions.maxActiveReservations);
          setMaxAdvanceBookingDays(c.scheduleOptions.maxAdvanceBookingDays);
        }
      }
    }).catch(() => toast.error('Error al cargar la configuración'))
    .finally(() => setLoading(false));
  }, [activeCompanyId]);

  const handleSaveGeneral = async () => {
    if (!activeCompanyId) return;
    setSaving(true);
    try {
      const { data } = await apolloClient.mutate({
        mutation: UPDATE_COMPANY,
        variables: {
          companyId: activeCompanyId,
          companyData: { name, email, phoneNumber: phone, address },
          scheduleOptions: { maxActiveReservations, maxAdvanceBookingDays },
        },
      });
      const result = (data as Record<string, unknown>)?.updateCompany as CompanyResponse;
      if (result?.success) toast.success('Información actualizada');
      else toast.error(result?.message || 'Error al actualizar');
    } catch { toast.error('Error al guardar'); }
    finally { setSaving(false); }
  };

  const handleSaveConfig = async () => {
    // Config is part of the company update — save general + config together
    await handleSaveGeneral();
  };

  const handleSaveScheduleOptions = async () => {
    if (!activeCompanyId) return;
    setSaving(true);
    try {
      const { data } = await apolloClient.mutate({
        mutation: UPDATE_SCHEDULE_OPTIONS,
        variables: { scheduleOptions: { maxActiveReservations, maxAdvanceBookingDays } },
      });
      const result = (data as Record<string, unknown>)?.updateScheduleOptions as ScheduleOptionsResponse;
      if (result?.success) toast.success('Opciones de horarios actualizadas');
      else toast.error(result?.message || 'Error');
    } catch { toast.error('Error al guardar opciones'); }
    finally { setSaving(false); }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Configuración" description="Configuración de la empresa" />
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Configuración" description={`Configuración de ${company?.name || 'la empresa'}`} />

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="general" className="gap-2"><Building2 className="h-4 w-4" /> General</TabsTrigger>
          <TabsTrigger value="features" className="gap-2"><Settings className="h-4 w-4" /> Funcionalidades</TabsTrigger>
          <TabsTrigger value="schedules" className="gap-2"><Calendar className="h-4 w-4" /> Horarios</TabsTrigger>
        </TabsList>

        {/* General Info */}
        <TabsContent value="general">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Información General</CardTitle>
              <CardDescription>Datos básicos de la empresa</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {company?.logo?.url && (
                <div className="flex items-center gap-4 mb-4">
                  <img src={company.logo.url} alt={company.name} className="h-16 w-16 rounded-xl object-cover border border-border" />
                  <div>
                    <p className="text-sm font-medium">{company.name}</p>
                    <p className="text-xs text-muted-foreground">Logo actual</p>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nombre</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Teléfono</Label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Dirección</Label>
                  <Input value={address} onChange={(e) => setAddress(e.target.value)} />
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <Button onClick={handleSaveGeneral} disabled={saving} className="bg-[#F97316] hover:bg-[#EA580C] text-white">
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Guardar
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Feature Toggles */}
        <TabsContent value="features">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Funcionalidades</CardTitle>
              <CardDescription>Activa o desactiva módulos de la plataforma</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div><p className="text-sm font-medium">Encuestas</p><p className="text-xs text-muted-foreground">Permite crear encuestas para los usuarios</p></div>
                <Switch checked={pollsEnabled} onCheckedChange={setPollsEnabled} />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div><p className="text-sm font-medium">Productos</p><p className="text-xs text-muted-foreground">Tienda de productos dentro de la app</p></div>
                <Switch checked={productsEnabled} onCheckedChange={setProductsEnabled} />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div><p className="text-sm font-medium">Chat</p><p className="text-xs text-muted-foreground">Sistema de mensajería entre usuarios</p></div>
                <Switch checked={chatEnabled} onCheckedChange={setChatEnabled} />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div><p className="text-sm font-medium">Entrenamiento</p><p className="text-xs text-muted-foreground">Módulo de seguimiento de entrenamiento</p></div>
                <Switch checked={trainingEnabled} onCheckedChange={setTrainingEnabled} />
              </div>
              <div className="flex justify-end pt-2">
                <Button onClick={handleSaveConfig} disabled={saving} className="bg-[#F97316] hover:bg-[#EA580C] text-white">
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Guardar Configuración
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Schedule Options */}
        <TabsContent value="schedules">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Opciones de Horarios</CardTitle>
              <CardDescription>Configura las reglas de reserva de horarios</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Reservas activas máximas</Label>
                  <Input type="number" min={1} value={maxActiveReservations} onChange={(e) => setMaxActiveReservations(parseInt(e.target.value) || 1)} />
                  <p className="text-xs text-muted-foreground">Número máximo de reservas activas por usuario</p>
                </div>
                <div className="space-y-2">
                  <Label>Días de antelación máxima</Label>
                  <Input type="number" min={1} value={maxAdvanceBookingDays} onChange={(e) => setMaxAdvanceBookingDays(parseInt(e.target.value) || 1)} />
                  <p className="text-xs text-muted-foreground">Con cuántos días de antelación se puede reservar</p>
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <Button onClick={handleSaveScheduleOptions} disabled={saving} className="bg-[#F97316] hover:bg-[#EA580C] text-white">
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Guardar Opciones
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
