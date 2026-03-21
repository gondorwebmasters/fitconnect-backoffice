import { useEffect, useState, useMemo } from 'react';
import { useLocation } from 'wouter';
import { apolloClient } from '@/graphql/apollo-client';
import { GET_USERS, UPDATE_USER } from '@/graphql/operations';
import type { User, UserResponse, UserRoleEnum } from '@/graphql/types';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable, Column } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, MoreHorizontal, Pencil, ShieldBan, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

export default function UsersPage() {
  const [, setLocation] = useLocation();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [blockDialog, setBlockDialog] = useState<{ open: boolean; user: User | null; blocking: boolean }>({
    open: false, user: null, blocking: false,
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const variables: Record<string, unknown> = { query: search || undefined };
      if (roleFilter !== 'all') {
        variables.roleFilter = [roleFilter];
      }
      const { data } = await apolloClient.query({
        query: GET_USERS,
        variables,
        fetchPolicy: 'network-only',
      });
      const result = (data as Record<string, unknown>)?.getUsers as UserResponse;
      if (result?.success) {
        setUsers(result.users || []);
      }
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const timeout = setTimeout(() => { fetchUsers(); }, 400);
    return () => clearTimeout(timeout);
  }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

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
      toast.success(isBlocked ? 'User blocked' : 'User unblocked');
      setBlockDialog({ open: false, user: null, blocking: false });
      fetchUsers();
    } catch {
      toast.error('Failed to update user');
      setBlockDialog((prev) => ({ ...prev, blocking: false }));
    }
  };

  const columns: Column<User>[] = useMemo(
    () => [
      {
        key: 'user',
        header: 'User',
        render: (user) => (
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarImage src={user.pictureUrl?.url || ''} />
              <AvatarFallback className="text-xs">
                {(user.name?.[0] || user.nickname[0] || '?').toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="font-medium text-sm truncate">
                {user.name && user.surname ? `${user.name} ${user.surname}` : user.nickname}
              </p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>
        ),
      },
      {
        key: 'nickname',
        header: 'Nickname',
        render: (user) => <span className="text-sm">{user.nickname}</span>,
      },
      {
        key: 'role',
        header: 'Role',
        render: (user) => <StatusBadge status={user.contextRole} />,
      },
      {
        key: 'status',
        header: 'Status',
        render: (user) => (
          <div className="flex items-center gap-2">
            {user.isBlocked ? (
              <StatusBadge status="blocked" />
            ) : user.isActive ? (
              <StatusBadge status="active" />
            ) : (
              <StatusBadge status="inactive" />
            )}
          </div>
        ),
      },
      {
        key: 'phone',
        header: 'Phone',
        render: (user) => <span className="text-sm text-muted-foreground">{user.phoneNumber || '—'}</span>,
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
                <Pencil className="mr-2 h-4 w-4" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setBlockDialog({ open: true, user, blocking: false })}
                className={user.isBlocked ? 'text-emerald-600' : 'text-destructive'}
              >
                {user.isBlocked ? (
                  <><ShieldCheck className="mr-2 h-4 w-4" /> Unblock</>
                ) : (
                  <><ShieldBan className="mr-2 h-4 w-4" /> Block</>
                )}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [setLocation]
  );

  return (
    <div>
      <PageHeader
        title="Users"
        description="Manage platform users and their roles"
        actions={
          <Button onClick={() => setLocation('/users/new')}>
            <Plus className="mr-2 h-4 w-4" /> Add User
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={users}
        loading={loading}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by name, email, or nickname..."
        emptyMessage="No users found."
        keyExtractor={(u) => u.id}
        actions={
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All roles</SelectItem>
              <SelectItem value="boss">Boss</SelectItem>
              <SelectItem value="coach">Coach</SelectItem>
              <SelectItem value="premium">Premium</SelectItem>
              <SelectItem value="standard">Standard</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      <ConfirmDialog
        open={blockDialog.open}
        onOpenChange={(open) => setBlockDialog((prev) => ({ ...prev, open }))}
        title={blockDialog.user?.isBlocked ? 'Unblock User' : 'Block User'}
        description={
          blockDialog.user?.isBlocked
            ? `Are you sure you want to unblock ${blockDialog.user?.name || blockDialog.user?.nickname}?`
            : `Are you sure you want to block ${blockDialog.user?.name || blockDialog.user?.nickname}? They will lose access to the platform.`
        }
        confirmLabel={blockDialog.user?.isBlocked ? 'Unblock' : 'Block'}
        onConfirm={handleToggleBlock}
        variant={blockDialog.user?.isBlocked ? 'default' : 'destructive'}
        loading={blockDialog.blocking}
      />
    </div>
  );
}
