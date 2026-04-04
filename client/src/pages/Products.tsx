import { useRefreshOnCompanyChange } from '@/hooks/useRefreshOnCompanyChange';
import { useEffect, useState, useMemo } from 'react';
import { apolloClient } from '@/graphql/apollo-client';
import { GET_PRODUCTS, CREATE_PRODUCT, REMOVE_PRODUCT, UPDATE_PRODUCT_PICTURE, GET_PRESIGNED_URL } from '@/graphql/operations';
import type { Product, ProductResponse, BasicResponse, PresignedUrlResponse } from '@/graphql/types';
import { useFitConnectAuth } from '@/contexts/FitConnectAuthContext';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable, Column } from '@/components/common/DataTable';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Plus, MoreHorizontal, Trash2, ImagePlus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', description: '', price: 0 });

  // Delete dialog
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; product: Product | null; deleting: boolean }>({
    open: false, product: null, deleting: false,
  });

  // Image upload
  const [uploadDialog, setUploadDialog] = useState<{ open: boolean; product: Product | null; uploading: boolean }>({
    open: false, product: null, uploading: false,
  });

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data } = await apolloClient.query({ query: GET_PRODUCTS, fetchPolicy: 'network-only' });
      const result = (data as Record<string, unknown>)?.getProducts as ProductResponse;
      if (result?.success) setProducts(result.products || []);
    } catch { toast.error('Error al cargar los productos'); }
    finally { setLoading(false); }
  };

  const { activeCompanyId } = useFitConnectAuth();
  useRefreshOnCompanyChange(activeCompanyId, fetchProducts);
  useEffect(() => { fetchProducts(); }, [activeCompanyId]); // eslint-disable-line react-hooks/exhaustive-deps

  const filteredProducts = useMemo(() => {
    if (!search) return products;
    const q = search.toLowerCase();
    return products.filter((p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
  }, [products, search]);

  const handleCreate = async () => {
    if (!newProduct.name) { toast.error('El nombre es obligatorio'); return; }
    setCreating(true);
    try {
      const { data } = await apolloClient.mutate({
        mutation: CREATE_PRODUCT,
        variables: { product: { name: newProduct.name, description: newProduct.description, price: Number(newProduct.price) } },
      });
      const result = (data as Record<string, unknown>)?.createProduct as ProductResponse;
      if (result?.success) {
        toast.success('Producto creado');
        setCreateOpen(false);
        setNewProduct({ name: '', description: '', price: 0 });
        fetchProducts();
      } else { toast.error(result?.message || 'Error'); }
    } catch { toast.error('Error al crear el producto'); }
    finally { setCreating(false); }
  };

  const handleDelete = async () => {
    if (!deleteDialog.product) return;
    setDeleteDialog((p) => ({ ...p, deleting: true }));
    try {
      const { data } = await apolloClient.mutate({
        mutation: REMOVE_PRODUCT,
        variables: { ids: [deleteDialog.product.id] },
      });
      const result = (data as Record<string, unknown>)?.removeProduct as BasicResponse;
      if (result?.success) {
        toast.success('Producto eliminado');
        setDeleteDialog({ open: false, product: null, deleting: false });
        fetchProducts();
      } else { toast.error(result?.message || 'Error'); }
    } catch { toast.error('Error al eliminar el producto'); }
    finally { setDeleteDialog((p) => ({ ...p, deleting: false })); }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadDialog.product) return;
    setUploadDialog((p) => ({ ...p, uploading: true }));
    try {
      // Get presigned URL
      const { data: urlData } = await apolloClient.query({
        query: GET_PRESIGNED_URL,
        variables: { key: `products/${uploadDialog.product.id}/${file.name}`, command: 'putObject' },
        fetchPolicy: 'network-only',
      });
      const urlResult = (urlData as Record<string, unknown>)?.getPresignedUrl as PresignedUrlResponse;
      if (urlResult?.presignedUrl) {
        // Upload file to S3
        await fetch(urlResult.presignedUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
        // Update product picture
        await apolloClient.mutate({
          mutation: UPDATE_PRODUCT_PICTURE,
          variables: { imageName: urlResult.key, productId: uploadDialog.product.id },
        });
        toast.success('Imagen subida correctamente');
        setUploadDialog({ open: false, product: null, uploading: false });
        fetchProducts();
      }
    } catch { toast.error('Error al subir la imagen'); }
    finally { setUploadDialog((p) => ({ ...p, uploading: false })); }
  };

  const columns: Column<Product>[] = useMemo(() => [
    {
      key: 'image',
      header: '',
      className: 'w-16',
      render: (p) => (
        <div className="h-10 w-10 rounded-lg bg-slate-100 overflow-hidden">
          {p.pictures?.[0]?.url ? (
            <img src={p.pictures[0].url} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-slate-300">
              <ImagePlus className="h-4 w-4" />
            </div>
          )}
        </div>
      ),
    },
    { key: 'name', header: 'Nombre', render: (p) => <span className="font-medium text-sm">{p.name}</span> },
    { key: 'description', header: 'Descripción', render: (p) => <span className="text-sm text-muted-foreground truncate max-w-xs block">{p.description}</span> },
    { key: 'price', header: 'Precio', render: (p) => <span className="text-sm font-medium">{p.price.toFixed(2)} &euro;</span> },
    {
      key: 'actions',
      header: '',
      className: 'w-12',
      render: (p) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setUploadDialog({ open: true, product: p, uploading: false })}>
              <ImagePlus className="mr-2 h-4 w-4" /> Subir imagen
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setDeleteDialog({ open: true, product: p, deleting: false })} className="text-destructive">
              <Trash2 className="mr-2 h-4 w-4" /> Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ], []);

  return (
    <div>
      <PageHeader
        title="Productos"
        description="Gestiona el catálogo de productos"
        actions={<Button onClick={() => setCreateOpen(true)}><Plus className="mr-2 h-4 w-4" /> Añadir producto</Button>}
      />

      <DataTable columns={columns} data={filteredProducts} loading={loading} searchValue={search} onSearchChange={setSearch} searchPlaceholder="Buscar productos..." emptyMessage="No se encontraron productos." keyExtractor={(p) => p.id} />

      {/* Crear producto */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Crear producto</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label>Nombre *</Label><Input value={newProduct.name} onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })} placeholder="Nombre del producto" /></div>
            <div className="space-y-2"><Label>Descripción</Label><Textarea value={newProduct.description} onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })} placeholder="Descripción del producto" rows={3} /></div>
            <div className="space-y-2"><Label>Precio *</Label><Input type="number" step="0.01" min="0" value={newProduct.price} onChange={(e) => setNewProduct({ ...newProduct, price: parseFloat(e.target.value) || 0 })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={creating}>
              {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Crear
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Subir imagen */}
      <Dialog open={uploadDialog.open} onOpenChange={(o) => setUploadDialog((p) => ({ ...p, open: o }))}>
        <DialogContent>
          <DialogHeader><DialogTitle>Subir imagen del producto</DialogTitle></DialogHeader>
          <div className="py-4">
            <Label>Seleccionar imagen</Label>
            <Input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploadDialog.uploading} className="mt-2" />
            {uploadDialog.uploading && <p className="text-sm text-muted-foreground mt-2 flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Subiendo...</p>}
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(o) => setDeleteDialog((p) => ({ ...p, open: o }))}
        title="Eliminar producto"
        description={`¿Estás seguro de que quieres eliminar "${deleteDialog.product?.name}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        onConfirm={handleDelete}
        variant="destructive"
        loading={deleteDialog.deleting}
      />
    </div>
  );
}
