import { useEffect, useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { apolloClient } from '@/graphql/apollo-client';
import { FIND_USER, CREATE_USER, UPDATE_USER } from '@/graphql/operations';
import type { UserResponse, UserRoleEnum } from '@/graphql/types';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';

export default function UserDetailPage() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const isNew = params.id === 'new';

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    surname: '',
    email: '',
    nickname: '',
    phoneNumber: '',
    role: 'standard' as string,
    isBlocked: false,
    password: '',
  });

  useEffect(() => {
    if (!isNew && params.id) {
      apolloClient
        .query({ query: FIND_USER, variables: { id: params.id }, fetchPolicy: 'network-only' })
        .then(({ data }) => {
          const result = (data as Record<string, unknown>)?.findUser as UserResponse;
          if (result?.success && result.user) {
            const u = result.user;
            setForm({
              name: u.name || '',
              surname: u.surname || '',
              email: u.email || '',
              nickname: u.nickname || '',
              phoneNumber: u.phoneNumber || '',
              role: u.contextRole || 'standard',
              isBlocked: u.isBlocked || false,
              password: '',
            });
          }
        })
        .catch(() => toast.error('Error al cargar el usuario'))
        .finally(() => setLoading(false));
    }
  }, [isNew, params.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (isNew) {
        if (!form.password) {
          toast.error('La contraseña es obligatoria para nuevos usuarios');
          setSaving(false);
          return;
        }
        const { data } = await apolloClient.mutate({
          mutation: CREATE_USER,
          variables: {
            user: {
              email: form.email,
              nickname: form.nickname,
              password: form.password,
              role: form.role,
            },
          },
        });
        const result = (data as Record<string, unknown>)?.createUser as UserResponse;
        if (result?.success) {
          toast.success('Usuario creado correctamente');
          setLocation('/users');
        } else {
          toast.error(result?.message || 'Error al crear el usuario');
        }
      } else {
        const { data } = await apolloClient.mutate({
          mutation: UPDATE_USER,
          variables: {
            user: {
              id: params.id,
              name: form.name || undefined,
              surname: form.surname || undefined,
              email: form.email,
              nickname: form.nickname,
              phoneNumber: form.phoneNumber || undefined,
              role: form.role as UserRoleEnum,
              isBlocked: form.isBlocked,
            },
          },
        });
        const result = (data as Record<string, unknown>)?.updateUser as UserResponse;
        if (result?.success) {
          toast.success('Usuario actualizado correctamente');
          setLocation('/users');
        } else {
          toast.error(result?.message || 'Error al actualizar el usuario');
        }
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Ha ocurrido un error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Card><CardContent className="p-6 space-y-4">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
        </CardContent></Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={isNew ? 'Crear usuario' : 'Editar usuario'}
        description={isNew ? 'Añade un nuevo usuario a la plataforma' : 'Actualiza la información del usuario'}
        actions={
          <Button variant="outline" onClick={() => setLocation('/users')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver
          </Button>
        }
      />

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-0 shadow-sm">
            <CardHeader><CardTitle className="text-base">Información básica</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {!isNew && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nombre</Label>
                    <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nombre" />
                  </div>
                  <div className="space-y-2">
                    <Label>Apellido</Label>
                    <Input value={form.surname} onChange={(e) => setForm({ ...form, surname: e.target.value })} placeholder="Apellido" />
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required placeholder="usuario@ejemplo.com" />
              </div>
              <div className="space-y-2">
                <Label>Nickname *</Label>
                <Input value={form.nickname} onChange={(e) => setForm({ ...form, nickname: e.target.value })} required placeholder="nickname_unico" />
              </div>
              {!isNew && (
                <div className="space-y-2">
                  <Label>Teléfono</Label>
                  <Input value={form.phoneNumber} onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })} placeholder="+34 600 000 000" />
                </div>
              )}
              {isNew && (
                <div className="space-y-2">
                  <Label>Contraseña *</Label>
                  <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required placeholder="Mínimo 6 caracteres" />
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader><CardTitle className="text-base">Rol y estado</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Rol</Label>
                <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Estándar</SelectItem>
                    <SelectItem value="boss">Admin</SelectItem>
                    <SelectItem value="coach">Coach</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {!isNew && (
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <Label>Bloqueado</Label>
                    <p className="text-xs text-muted-foreground mt-1">Bloquear el acceso del usuario a la plataforma</p>
                  </div>
                  <Switch checked={form.isBlocked} onCheckedChange={(v) => setForm({ ...form, isBlocked: v })} />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end mt-6">
          <Button type="submit" disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {isNew ? 'Crear usuario' : 'Guardar cambios'}
          </Button>
        </div>
      </form>
    </div>
  );
}
