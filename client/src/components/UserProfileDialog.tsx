import { useState, useRef } from 'react';
import { apolloClient } from '@/graphql/apollo-client';
import { UPDATE_USER, UPDATE_USER_PICTURE, GET_PRESIGNED_URL } from '@/graphql/operations';
import { useFitConnectAuth } from '@/contexts/FitConnectAuthContext';
import type { UserResponse } from '@/graphql/types';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Camera } from 'lucide-react';
import { toast } from 'sonner';

interface UserProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserProfileDialog({ open, onOpenChange }: UserProfileDialogProps) {
  const { user, refreshUser } = useFitConnectAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: user?.name || '',
    surname: user?.surname || '',
    nickname: user?.nickname || '',
    email: user?.email || '',
    phoneNumber: user?.phoneNumber || '',
  });
  const [saving, setSaving] = useState(false);
  const [uploadingPicture, setUploadingPicture] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Reset form when dialog opens
  const handleOpenChange = (o: boolean) => {
    if (o && user) {
      setForm({
        name: user.name || '',
        surname: user.surname || '',
        nickname: user.nickname || '',
        email: user.email || '',
        phoneNumber: user.phoneNumber || '',
      });
      setPreviewUrl(null);
    }
    onOpenChange(o);
  };

  const handleSave = async () => {
    if (!user) return;
    if (!form.nickname.trim()) { toast.error('El nickname es requerido'); return; }
    if (!form.email.trim()) { toast.error('El email es requerido'); return; }

    setSaving(true);
    try {
      const { data } = await apolloClient.mutate({
        mutation: UPDATE_USER,
        variables: {
          user: {
            id: user.id,
            name: form.name || null,
            surname: form.surname || null,
            nickname: form.nickname,
            email: form.email,
            phoneNumber: form.phoneNumber || null,
          },
        },
      });
      const result = (data as Record<string, unknown>)?.updateUser as UserResponse;
      if (result?.success) {
        toast.success('Perfil actualizado correctamente');
        await refreshUser();
        onOpenChange(false);
      } else {
        toast.error(result?.message || 'Error al actualizar perfil');
      }
    } catch {
      toast.error('Error al guardar los cambios');
    } finally {
      setSaving(false);
    }
  };

  const handlePictureChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Preview
    const reader = new FileReader();
    reader.onload = (ev) => setPreviewUrl(ev.target?.result as string);
    reader.readAsDataURL(file);

    setUploadingPicture(true);
    try {
      // 1. Get presigned URL
      const ext = file.name.split('.').pop() || 'jpg';
      const key = `profile-pictures/${user.id}-${Date.now()}.${ext}`;
      const { data: presignedData } = await apolloClient.query({
        query: GET_PRESIGNED_URL,
        variables: { key, command: 'putObject' },
        fetchPolicy: 'network-only',
      });
      const presignedResult = (presignedData as Record<string, unknown>)?.getPresignedUrl as {
        presignedUrl?: string; key?: string;
      };

      if (!presignedResult?.presignedUrl) {
        toast.error('Error al obtener URL de subida');
        return;
      }

      // 2. Upload to S3
      const uploadRes = await fetch(presignedResult.presignedUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      });
      if (!uploadRes.ok) { toast.error('Error al subir imagen'); return; }

      // 3. Update user picture
      const { data } = await apolloClient.mutate({
        mutation: UPDATE_USER_PICTURE,
        variables: { picture: presignedResult.key, userId: user.id },
      });
      const result = (data as Record<string, unknown>)?.updateUserPicture as UserResponse;
      if (result?.success) {
        toast.success('Foto de perfil actualizada');
        await refreshUser();
      } else {
        toast.error(result?.message || 'Error al actualizar foto');
      }
    } catch {
      toast.error('Error al subir la imagen');
    } finally {
      setUploadingPicture(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const avatarSrc = previewUrl || user?.pictureUrl?.url || '';
  const initials = (user?.name?.[0] || user?.nickname?.[0] || '?').toUpperCase();

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Mi Perfil</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative group">
              <Avatar className="h-20 w-20 border-2 border-border">
                <AvatarImage src={avatarSrc} />
                <AvatarFallback className="text-xl font-bold bg-primary/10 text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPicture}
                className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                {uploadingPicture
                  ? <Loader2 className="h-5 w-5 text-white animate-spin" />
                  : <Camera className="h-5 w-5 text-white" />
                }
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePictureChange}
              />
            </div>
            <p className="text-xs text-muted-foreground">Haz clic en la imagen para cambiarla</p>
          </div>

          {/* Form fields */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Nombre</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Juan"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Apellido</Label>
              <Input
                value={form.surname}
                onChange={(e) => setForm({ ...form, surname: e.target.value })}
                placeholder="García"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Nickname *</Label>
            <Input
              value={form.nickname}
              onChange={(e) => setForm({ ...form, nickname: e.target.value })}
              placeholder="juangarcia"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Email *</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="juan@mail.com"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Teléfono</Label>
            <Input
              type="tel"
              value={form.phoneNumber}
              onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
              placeholder="+34 600 000 000"
            />
          </div>

          {/* Read-only info */}
          <div className="rounded-lg bg-muted/40 p-3 space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">Información de cuenta</p>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Rol:</span>
              <span className="font-medium capitalize">{user?.contextRole || '—'}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Estado:</span>
              <span className={`font-medium ${user?.isActive ? 'text-emerald-500' : 'text-red-500'}`}>
                {user?.isActive ? 'Activo' : 'Inactivo'}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Verificado:</span>
              <span className={`font-medium ${user?.isVerified ? 'text-emerald-500' : 'text-amber-500'}`}>
                {user?.isVerified ? 'Sí' : 'Pendiente'}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-primary hover:bg-primary/90 text-white"
          >
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Guardar cambios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
