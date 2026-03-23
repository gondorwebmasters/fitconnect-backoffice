import { useEffect, useState, useMemo } from 'react';
import { useLocation } from 'wouter';
import { apolloClient } from '@/graphql/apollo-client';
import { GET_COMPANIES, CREATE_COMPANY } from '@/graphql/operations';
import type { Company, CompanyResponse } from '@/graphql/types';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable, Column } from '@/components/common/DataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Plus, Building2, Pencil, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function CompaniesPage() {
  const [, setLocation] = useLocation();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newCompany, setNewCompany] = useState({ name: '', phoneNumber: '', email: '', address: '' });

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const { data } = await apolloClient.query({
        query: GET_COMPANIES,
        variables: { query: search || undefined },
        fetchPolicy: 'network-only',
      });
      const result = (data as Record<string, unknown>)?.getCompanies as CompanyResponse;
      if (result?.success) setCompanies(result.companies || (result.company ? [result.company] : []));
    } catch { toast.error('Error al cargar las empresas'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchCompanies(); }, []);

  useEffect(() => {
    const t = setTimeout(() => fetchCompanies(), 400);
    return () => clearTimeout(t);
  }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCreate = async () => {
    if (!newCompany.name || !newCompany.email) { toast.error('El nombre y el email son obligatorios'); return; }
    setCreating(true);
    try {
      const { data } = await apolloClient.mutate({
        mutation: CREATE_COMPANY,
        variables: { company: newCompany },
      });
      const result = (data as Record<string, unknown>)?.createCompany as CompanyResponse;
      if (result?.success) {
        toast.success('Empresa creada');
        setCreateOpen(false);
        setNewCompany({ name: '', phoneNumber: '', email: '', address: '' });
        fetchCompanies();
      } else { toast.error(result?.message || 'Error'); }
    } catch { toast.error('Error al crear la empresa'); }
    finally { setCreating(false); }
  };

  const columns: Column<Company>[] = useMemo(() => [
    {
      key: 'company',
      header: 'Empresa',
      render: (c) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9 rounded-lg">
            <AvatarImage src={c.logo?.url || ''} />
            <AvatarFallback className="rounded-lg"><Building2 className="h-4 w-4" /></AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="font-medium text-sm truncate">{c.name}</p>
            <p className="text-xs text-muted-foreground truncate">{c.email}</p>
          </div>
        </div>
      ),
    },
    { key: 'phone', header: 'Teléfono', render: (c) => <span className="text-sm">{c.phoneNumber || '—'}</span> },
    { key: 'address', header: 'Dirección', render: (c) => <span className="text-sm text-muted-foreground truncate max-w-xs block">{c.address || '—'}</span> },
    {
      key: 'features',
      header: 'Funciones',
      render: (c) => (
        <div className="flex flex-wrap gap-1">
          {c.companyConfig?.pollsEnabled && <Badge variant="secondary" className="text-xs">Encuestas</Badge>}
          {c.companyConfig?.productsEnabled && <Badge variant="secondary" className="text-xs">Productos</Badge>}
          {c.companyConfig?.chatEnabled && <Badge variant="secondary" className="text-xs">Chat</Badge>}
          {c.companyConfig?.trainingEnabled && <Badge variant="secondary" className="text-xs">Entrenamiento</Badge>}
        </div>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-12',
      render: (c) => (
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setLocation(`/companies/${c.id}`)}>
          <Pencil className="h-4 w-4" />
        </Button>
      ),
    },
  ], [setLocation]);

  return (
    <div>
      <PageHeader
        title="Empresas"
        description="Gestiona las empresas de la plataforma"
        actions={<Button onClick={() => setCreateOpen(true)}><Plus className="mr-2 h-4 w-4" /> Añadir empresa</Button>}
      />

      <DataTable columns={columns} data={companies} loading={loading} searchValue={search} onSearchChange={setSearch} searchPlaceholder="Buscar empresas..." emptyMessage="No se encontraron empresas." keyExtractor={(c) => c.id} />

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Crear empresa</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label>Nombre *</Label><Input value={newCompany.name} onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })} placeholder="Nombre de la empresa" /></div>
            <div className="space-y-2"><Label>Email *</Label><Input type="email" value={newCompany.email} onChange={(e) => setNewCompany({ ...newCompany, email: e.target.value })} placeholder="empresa@ejemplo.com" /></div>
            <div className="space-y-2"><Label>Teléfono</Label><Input value={newCompany.phoneNumber} onChange={(e) => setNewCompany({ ...newCompany, phoneNumber: e.target.value })} placeholder="+34 600 000 000" /></div>
            <div className="space-y-2"><Label>Dirección</Label><Input value={newCompany.address} onChange={(e) => setNewCompany({ ...newCompany, address: e.target.value })} placeholder="Calle, Ciudad, País" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={creating}>{creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Crear</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
