import { useRefreshOnCompanyChange } from '@/hooks/useRefreshOnCompanyChange';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { useLocation } from 'wouter';
import { apolloClient } from '@/graphql/apollo-client';
import {
  GET_USERS,
  UPDATE_USER,
  GET_ACTIVE_SUBSCRIPTION,
  SEND_NOTIFICATION,
} from '@/graphql/operations';
import type { User, UserResponse, Subscription } from '@/graphql/types';
import { useFitConnectAuth } from '@/contexts/FitConnectAuthContext';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable, Column } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, MoreHorizontal, Pencil, ShieldBan, ShieldCheck, Mail, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

// ─── helpers ────────────────────────────────────────────────────────────────

function parseDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
  if (typeof value === 'number') return new Date(value);
  if (typeof value === 'string') {
    // ISO string or numeric string
    const n = Number(value);
    if (!isNaN(n) && value.trim() !== '') return new Date(n);
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

function formatDate(value: unknown): string {
  const d = parseDate(value);
  if (!d) return '—';
  try {
    return format(d, 'dd MMM yyyy');
  } catch {
    return '—';
  }
}

// ─── types ───────────────────────────────────────────────────────────────────

interface UserWithSub extends User {
  _sub?: Subscription | null;
  _subLoading?: boolean;
}

interface NotifyState {
  open: boolean;
  user: User | null;
  title: string;
  body: string;
  sending: boolean;
}

// ─── component ───────────────────────────────────────────────────────────────

export default function UsersPage() {
  const [, setLocation] = useLocation();
  const [users, setUsers] = useState<UserWithSub[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [blockDialog, setBlockDialog] = useState<{
    open: boolean;
    user: User | null;
    blocking: boolean;
  }>({ open: false, user: null, blocking: false });
  const [notifyState, setNotifyState] = useState<NotifyState>({
    open: false,
    user: null,
    title: '',
    body: '',
    sending: false,
  });

  // ── fetch subscriptions for each user in parallel ──────────────────────────
  const fetchSubscriptionForUser = useCallback(async (userId: string): Promise<Subscription | null> => {
    try {
      const { data } = await apolloClient.query({
        query: GET_ACTIVE_SUBSCRIPTION,
        variables: { userId },
        fetchPolicy: 'cache-first',
      });
      const result = (data as Record<string, unknown>)?.getActiveSubscription as {
        success: boolean;
        subscription?: Subscription | null;
      };
      return result?.subscription ?? null;
    } catch {
      return null;
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const variables: Record<string, unknown> = { query: search || undefined };
      if (roleFilter !== 'all') variables.roleFilter = [roleFilter];

      const { data } = await apolloClient.query({
        query: GET_USERS,
        variables,
        fetchPolicy: 'network-only',
      });
      const result = (data as Record<string, unknown>)?.getUsers as UserResponse;
      if (result?.success) {
        const rawUsers: UserWithSub[] = (result.users || []).map((u) => ({
          ...u,
          _sub: undefined,
          _subLoading: true,
        }));
        setUsers(rawUsers);

        // Fetch subscriptions in parallel, update each user row as they resolve
        rawUsers.forEach((u) => {
          fetchSubscriptionForUser(u.id).then((sub) => {
            setUsers((prev) =>
              prev.map((pu) =>
                pu.id === u.id ? { ...pu, _sub: sub, _subLoading: false } : pu
              )
            );
          });
        });
      }
    } catch {
      toast.error('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, fetchSubscriptionForUser]);

  const { activeCompanyId } = useFitConnectAuth();
  useRefreshOnCompanyChange(activeCompanyId, fetchUsers);
  useEffect(() => { fetchUsers(); }, [roleFilter, activeCompanyId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const timeout = setTimeout(() => { fetchUsers(); }, 400);
    return () => clearTimeout(timeout);
  }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── block / unblock ────────────────────────────────────────────────────────
  const handleToggleBlock = async () => {
    if (!blockDialog.user) return;
    setBlockDialog((prev) => ({ ...prev, blocking: true }));
    try {
      const isBlocked = !blockDialog.user.isBlocked;
      await apolloClient.mutate({
        mutation: UPDATE_USER,
        variables: {
          user: {
            id: blockDialog.user.id,
            email: blockDialog.user.email,
            nickname: blockDialog.user.nickname,
            isBlocked,
          },
        },
      });
      toast.success(isBlocked ? 'Usuario bloqueado' : 'Usuario desbloqueado');
      setBlockDialog({ open: false, user: null, blocking: false });
      fetchUsers();
    } catch {
      toast.error('Error al actualizar usuario');
      setBlockDialog((prev) => ({ ...prev, blocking: false }));
    }
  };

  // ── send notification ──────────────────────────────────────────────────────
  const openNotifyModal = (user: User) => {
    const name = user.name ? `${user.name} ${user.surname ?? ''}`.trim() : user.nickname;
    setNotifyState({
      open: true,
      user,
      title: '⏰ Recordatorio de pago',
      body: `Hola ${name}, tu suscripción está próxima a vencer. Por favor, realiza tu pago para continuar disfrutando de los beneficios.`,
      sending: false,
    });
  };

  const handleSendNotification = async () => {
    if (!notifyState.title.trim() || !notifyState.body.trim()) {
      toast.error('El título y el mensaje son obligatorios');
      return;
    }
    setNotifyState((prev) => ({ ...prev, sending: true }));
    try {
      await apolloClient.mutate({
        mutation: SEND_NOTIFICATION,
        variables: {
          notification: {
            title: notifyState.title.trim(),
            body: notifyState.body.trim(),
            forAll: false,
          },
        },
      });
      toast.success('Notificación enviada correctamente');
      setNotifyState({ open: false, user: null, title: '', body: '', sending: false });
    } catch {
      toast.error('Error al enviar la notificación');
      setNotifyState((prev) => ({ ...prev, sending: false }));
    }
  };

  // ── columns ────────────────────────────────────────────────────────────────
  const columns: Column<UserWithSub>[] = useMemo(
    () => [
      {
        key: 'user',
        header: 'Usuario',
        render: (user) => (
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarImage src={user.pictureUrl?.url || ''} />
              <AvatarFallback className="bg-muted text-muted-foreground text-xs font-semibold">
                {(user.name?.[0] || user.nickname[0] || '?').toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="font-medium text-sm truncate">
                {user.name && user.surname
                  ? `${user.name} ${user.surname}`
                  : user.nickname}
              </p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>
        ),
      },
      {
        key: 'role',
        header: 'Rol',
        render: (user) => <StatusBadge status={user.contextRole} />,
      },
      {
        key: 'status',
        header: 'Estado',
        render: (user) =>
          user.isBlocked ? (
            <StatusBadge status="blocked" />
          ) : user.isActive ? (
            <StatusBadge status="active" />
          ) : (
            <StatusBadge status="inactive" />
          ),
      },
      {
        key: 'subscription',
        header: 'Suscripción',
        render: (user) => {
          if (user._subLoading) {
            return <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />;
          }
          if (!user._sub) {
            return (
              <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-muted text-muted-foreground">
                Sin suscripción
              </span>
            );
          }
          return <StatusBadge status={user._sub.status} />;
        },
      },
      {
        key: 'nextPayment',
        header: 'Próximo pago',
        render: (user) => {
          if (user._subLoading) {
            return <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />;
          }
          if (!user._sub?.endDate) {
            return <span className="text-sm text-muted-foreground">—</span>;
          }
          const d = parseDate(user._sub.endDate);
          const isOverdue = d && d < new Date();
          return (
            <span
              className={`text-sm font-medium ${
                isOverdue ? 'text-red-500 dark:text-red-400' : 'text-foreground'
              }`}
            >
              {formatDate(user._sub.endDate)}
              {isOverdue && (
                <span className="ml-1 text-xs font-normal text-red-400">(vencido)</span>
              )}
            </span>
          );
        },
      },
      {
        key: 'phone',
        header: 'Teléfono',
        render: (user) => (
          <span className="text-sm text-muted-foreground">{user.phoneNumber || '—'}</span>
        ),
      },
      {
        key: 'actions',
        header: '',
        className: 'w-12',
        render: (user) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setLocation(`/users/${user.id}`)}>
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openNotifyModal(user)}>
                <Mail className="mr-2 h-4 w-4 text-primary" />
                Enviar notificación
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setBlockDialog({ open: true, user, blocking: false })}
                className={user.isBlocked ? 'text-emerald-600' : 'text-destructive'}
              >
                {user.isBlocked ? (
                  <>
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    Desbloquear
                  </>
                ) : (
                  <>
                    <ShieldBan className="mr-2 h-4 w-4" />
                    Bloquear
                  </>
                )}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [setLocation] // eslint-disable-line react-hooks/exhaustive-deps
  );

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <div>
      <PageHeader
        title="Usuarios"
        description="Gestiona los usuarios de la plataforma y sus roles"
        actions={
          <Button onClick={() => setLocation('/users/new')}>
            <Plus className="mr-2 h-4 w-4" />
            Añadir usuario
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={users}
        loading={loading}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por nombre, email o nickname..."
        emptyMessage="No se encontraron usuarios."
        keyExtractor={(u) => u.id}
        actions={
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Todos los roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los roles</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="coach">Coach</SelectItem>
              <SelectItem value="premium">Premium</SelectItem>
              <SelectItem value="standard">Standard</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      {/* Block / Unblock dialog */}
      <ConfirmDialog
        open={blockDialog.open}
        onOpenChange={(open) => setBlockDialog((prev) => ({ ...prev, open }))}
        title={blockDialog.user?.isBlocked ? 'Desbloquear usuario' : 'Bloquear usuario'}
        description={
          blockDialog.user?.isBlocked
            ? `¿Seguro que quieres desbloquear a ${blockDialog.user?.name || blockDialog.user?.nickname}?`
            : `¿Seguro que quieres bloquear a ${blockDialog.user?.name || blockDialog.user?.nickname}? Perderá acceso a la plataforma.`
        }
        confirmLabel={blockDialog.user?.isBlocked ? 'Desbloquear' : 'Bloquear'}
        onConfirm={handleToggleBlock}
        variant={blockDialog.user?.isBlocked ? 'default' : 'destructive'}
        loading={blockDialog.blocking}
      />

      {/* Send notification dialog */}
      <Dialog
        open={notifyState.open}
        onOpenChange={(open) => {
          if (!notifyState.sending) {
            setNotifyState((prev) => ({ ...prev, open }));
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              Enviar notificación push
            </DialogTitle>
            <DialogDescription>
              {notifyState.user && (
                <>
                  Enviando a{' '}
                  <span className="font-semibold text-foreground">
                    {notifyState.user.name
                      ? `${notifyState.user.name} ${notifyState.user.surname ?? ''}`.trim()
                      : notifyState.user.nickname}
                  </span>
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="notif-title">Título</Label>
              <Input
                id="notif-title"
                placeholder="Ej: Recordatorio de pago"
                value={notifyState.title}
                onChange={(e) =>
                  setNotifyState((prev) => ({ ...prev, title: e.target.value }))
                }
                disabled={notifyState.sending}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="notif-body">Mensaje</Label>
              <Textarea
                id="notif-body"
                placeholder="Escribe el mensaje de la notificación..."
                rows={4}
                value={notifyState.body}
                onChange={(e) =>
                  setNotifyState((prev) => ({ ...prev, body: e.target.value }))
                }
                disabled={notifyState.sending}
                className="resize-none"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() =>
                setNotifyState({ open: false, user: null, title: '', body: '', sending: false })
              }
              disabled={notifyState.sending}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSendNotification}
              disabled={notifyState.sending || !notifyState.title.trim() || !notifyState.body.trim()}
              className="bg-primary hover:bg-primary/90 text-white"
            >
              {notifyState.sending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Enviar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
