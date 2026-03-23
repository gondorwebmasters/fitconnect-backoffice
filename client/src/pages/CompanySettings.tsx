import { useEffect, useState } from 'react';
import { apolloClient } from '@/graphql/apollo-client';
import { GET_COMPANIES, UPDATE_COMPANY, UPDATE_SCHEDULE_OPTIONS, UPDATE_COMPANY_LOGO, GET_PRESIGNED_URL } from '@/graphql/operations';
import { useFitConnectAuth } from '@/contexts/FitConnectAuthContext';
import { useCompanyColor } from '@/contexts/CompanyColorContext';
import type { Company, CompanyResponse, ScheduleOptionsResponse, PresignedUrlResponse } from '@/graphql/types';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Building2, Settings, Calendar, Save, Loader2, Upload, Palette } from 'lucide-react';
import { toast } from 'sonner';

// Preset color palettes
const COLOR_PRESETS = [
  { name: 'Naranja FitConnect', primary: '#F97316' },
  { name: 'Azul Océano', primary: '#3B82F6' },
  { name: 'Verde Esmeralda', primary: '#10B981' },
  { name: 'Violeta', primary: '#8B5CF6' },
  { name: 'Rosa', primary: '#EC4899' },
  { name: 'Rojo', primary: '#EF4444' },
  { name: 'Cian', primary: '#06B6D4' },
  { name: 'Ámbar', primary: '#F59E0B' },
  { name: 'Lima', primary: '#84CC16' },
  { name: 'Índigo', primary: '#6366F1' },
];

export default function CompanySettingsPage() {
  const { activeCompanyId } = useFitConnectAuth();
  const { primaryColor, setPrimaryColor } = useCompanyColor();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Local draft color (before saving)
  const [draftColor, setDraftColor] = useState<string>(primaryColor);

  // Sync draft when context color changes (e.g. on company switch)
  useEffect(() => {
    setDraftColor(primaryColor);
  }, [primaryColor]);

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
  const [sameDayBookingAllowed, setSameDayBookingAllowed] = useState(true);
  const [fullOpenHours, setFullOpenHours] = useState(24);
  const [bookingCutoffMinutes, setBookingCutoffMinutes] = useState(30);
  const [minBookingsRequired, setMinBookingsRequired] = useState(1);

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
          setSameDayBookingAllowed(c.scheduleOptions.sameDayBookingAllowed ?? true);
          setFullOpenHours(c.scheduleOptions.fullOpenHours || 24);
          setBookingCutoffMinutes(c.scheduleOptions.bookingCutoffMinutes || 30);
          setMinBookingsRequired(c.scheduleOptions.minBookingsRequired || 1);
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
          companyData: {
            name, email, phoneNumber: phone, address,
            companyConfig: { pollsEnabled, productsEnabled, chatEnabled, trainingEnabled },
          },
          scheduleOptions: {
            maxActiveReservations, maxAdvanceBookingDays, sameDayBookingAllowed,
            fullOpenHours, bookingCutoffMinutes, minBookingsRequired,
          },
        },
      });
      const result = (data as Record<string, unknown>)?.updateCompany as CompanyResponse;
      if (result?.success) toast.success('Información actualizada');
      else toast.error(result?.message || 'Error al actualizar');
    } catch { toast.error('Error al guardar'); }
    finally { setSaving(false); }
  };

  const handleSaveConfig = async () => {
    if (!activeCompanyId) return;
    setSaving(true);
    try {
      const { data } = await apolloClient.mutate({
        mutation: UPDATE_COMPANY,
        variables: {
          companyId: activeCompanyId,
          companyData: {
            name, email, phoneNumber: phone, address,
            companyConfig: { pollsEnabled, productsEnabled, chatEnabled, trainingEnabled },
          },
          scheduleOptions: {
            maxActiveReservations, maxAdvanceBookingDays, sameDayBookingAllowed,
            fullOpenHours, bookingCutoffMinutes, minBookingsRequired,
          },
        },
      });
      const result = (data as Record<string, unknown>)?.updateCompany as CompanyResponse;
      if (result?.success) toast.success('Funcionalidades actualizadas');
      else toast.error(result?.message || 'Error al actualizar');
    } catch { toast.error('Error al guardar'); }
    finally { setSaving(false); }
  };

  const handleSaveScheduleOptions = async () => {
    if (!activeCompanyId) return;
    setSaving(true);
    try {
      const { data } = await apolloClient.mutate({
        mutation: UPDATE_SCHEDULE_OPTIONS,
        variables: {
          scheduleOptions: {
            maxActiveReservations, maxAdvanceBookingDays, sameDayBookingAllowed,
            fullOpenHours, bookingCutoffMinutes, minBookingsRequired,
          },
        },
      });
      const result = (data as Record<string, unknown>)?.updateScheduleOptions as ScheduleOptionsResponse;
      if (result?.success) toast.success('Opciones de horarios actualizadas');
      else toast.error(result?.message || 'Error');
    } catch { toast.error('Error al guardar opciones'); }
    finally { setSaving(false); }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeCompanyId) return;
    setUploading(true);
    try {
      const { data: urlData } = await apolloClient.query({
        query: GET_PRESIGNED_URL,
        variables: { key: `companies/${activeCompanyId}/logo-${file.name}`, command: 'putObject' },
        fetchPolicy: 'network-only',
      });
      const urlResult = (urlData as Record<string, unknown>)?.getPresignedUrl as PresignedUrlResponse;
      if (urlResult?.presignedUrl) {
        await fetch(urlResult.presignedUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
        await apolloClient.mutate({
          mutation: UPDATE_COMPANY_LOGO,
          variables: { companyId: activeCompanyId, picture: urlResult.key },
        });
        toast.success('Logo actualizado');
        const { data } = await apolloClient.query({ query: GET_COMPANIES, variables: { companyId: activeCompanyId }, fetchPolicy: 'network-only' });
        const result = (data as Record<string, unknown>)?.getCompanies as CompanyResponse;
        if (result?.company) setCompany(result.company);
      }
    } catch { toast.error('Error al subir el logo'); }
    finally { setUploading(false); }
  };

  /** Apply the draft color immediately to the whole app and persist it */
  const handleSaveColors = () => {
    setPrimaryColor(draftColor);
    toast.success('Color aplicado en toda la aplicación');
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
          <TabsTrigger value="appearance" className="gap-2"><Palette className="h-4 w-4" /> Apariencia</TabsTrigger>
        </TabsList>

        {/* General Info */}
        <TabsContent value="general">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Logo */}
            <Card className="border-border/50 lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-base">Logo de la empresa</CardTitle>
                <CardDescription>Imagen que representa a tu empresa</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-4">
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

            {/* Basic info */}
            <Card className="border-border/50 lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Información General</CardTitle>
                <CardDescription>Datos básicos de la empresa</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
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
                  <Button onClick={handleSaveGeneral} disabled={saving}>
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Guardar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
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
                <Button onClick={handleSaveConfig} disabled={saving}>
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
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                <div className="space-y-2">
                  <Label>Horas de apertura completa</Label>
                  <Input type="number" min={1} max={24} value={fullOpenHours} onChange={(e) => setFullOpenHours(parseInt(e.target.value) || 24)} />
                  <p className="text-xs text-muted-foreground">Horas al día que el centro está abierto</p>
                </div>
                <div className="space-y-2">
                  <Label>Corte de reserva (minutos)</Label>
                  <Input type="number" min={0} value={bookingCutoffMinutes} onChange={(e) => setBookingCutoffMinutes(parseInt(e.target.value) || 0)} />
                  <p className="text-xs text-muted-foreground">Minutos antes de la clase para cerrar reservas</p>
                </div>
                <div className="space-y-2">
                  <Label>Mínimo de reservas requeridas</Label>
                  <Input type="number" min={0} value={minBookingsRequired} onChange={(e) => setMinBookingsRequired(parseInt(e.target.value) || 0)} />
                  <p className="text-xs text-muted-foreground">Mínimo de reservas para que la clase no se cancele</p>
                </div>
              </div>
              <Separator />
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="text-sm font-medium">Reserva el mismo día</p>
                  <p className="text-xs text-muted-foreground">Permitir a los usuarios reservar clases del mismo día</p>
                </div>
                <Switch checked={sameDayBookingAllowed} onCheckedChange={setSameDayBookingAllowed} />
              </div>
              <div className="flex justify-end pt-2">
                <Button onClick={handleSaveScheduleOptions} disabled={saving}>
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Guardar Opciones
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance / Colors */}
        <TabsContent value="appearance">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Color de marca</CardTitle>
              <CardDescription>
                El color primario se aplica a botones, badges, iconos activos y todos los elementos de acento de la interfaz.
                Al guardar, el cambio se aplica inmediatamente sin recargar la página.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Presets */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Paletas predefinidas</Label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {COLOR_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => setDraftColor(preset.primary)}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border text-center transition-all hover:shadow-md ${
                        draftColor === preset.primary
                          ? 'border-primary ring-2 ring-primary/30 bg-primary/5'
                          : 'border-border/50 hover:border-primary/40'
                      }`}
                    >
                      <div
                        className="h-8 w-8 rounded-full shadow-sm"
                        style={{ backgroundColor: preset.primary }}
                      />
                      <span className="text-xs font-medium leading-tight">{preset.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Custom color picker */}
              <div className="space-y-4">
                <Label className="text-sm font-medium">Color personalizado</Label>
                <div className="flex items-center gap-4">
                  <div className="relative shrink-0">
                    <input
                      type="color"
                      value={draftColor}
                      onChange={(e) => setDraftColor(e.target.value)}
                      className="h-14 w-14 rounded-xl cursor-pointer border border-border/50 p-1 bg-transparent"
                      title="Seleccionar color"
                    />
                  </div>
                  <div className="flex-1 space-y-1">
                    <Input
                      value={draftColor}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) setDraftColor(val);
                      }}
                      placeholder="#F97316"
                      className="font-mono text-sm max-w-[160px]"
                    />
                    <p className="text-xs text-muted-foreground">Introduce un código HEX válido (ej: #F97316)</p>
                  </div>
                  {/* Live preview swatch */}
                  <div
                    className="h-14 w-28 rounded-xl shadow-md flex items-center justify-center text-xs font-medium shrink-0 transition-all"
                    style={{ backgroundColor: draftColor, color: '#fff' }}
                  >
                    Vista previa
                  </div>
                </div>
              </div>

              {/* Live preview of UI elements */}
              <div className="rounded-xl border border-border/50 p-5 space-y-4">
                <p className="text-sm font-medium text-muted-foreground">Previsualización de elementos</p>
                <div className="flex flex-wrap gap-3 items-center">
                  <button
                    className="px-4 py-2 rounded-lg text-white text-sm font-medium shadow-sm transition-all"
                    style={{ backgroundColor: draftColor }}
                  >
                    Botón primario
                  </button>
                  <button
                    className="px-4 py-2 rounded-lg text-sm font-medium border-2 bg-transparent transition-all"
                    style={{ borderColor: draftColor, color: draftColor }}
                  >
                    Botón outline
                  </button>
                  <span
                    className="px-3 py-1 rounded-full text-white text-xs font-semibold"
                    style={{ backgroundColor: draftColor }}
                  >
                    Badge activo
                  </span>
                  <span
                    className="text-sm font-medium"
                    style={{ color: draftColor }}
                  >
                    Enlace / ícono activo
                  </span>
                </div>
              </div>

              {/* Current vs draft comparison */}
              {draftColor !== primaryColor && (
                <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/40 border border-border/50">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full border" style={{ backgroundColor: primaryColor }} />
                    <span className="text-xs text-muted-foreground">Color actual</span>
                  </div>
                  <span className="text-muted-foreground">→</span>
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full border" style={{ backgroundColor: draftColor }} />
                    <span className="text-xs font-medium">Nuevo color</span>
                  </div>
                  <span className="text-xs text-muted-foreground ml-auto">Guarda para aplicar el cambio</span>
                </div>
              )}

              <div className="flex justify-end">
                <Button
                  onClick={handleSaveColors}
                  disabled={draftColor === primaryColor || draftColor.length < 7}
                  className="gap-2"
                >
                  <Save className="h-4 w-4" />
                  Aplicar color de marca
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
