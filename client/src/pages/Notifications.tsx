import { useState } from 'react';
import { apolloClient } from '@/graphql/apollo-client';
import { SEND_NOTIFICATION } from '@/graphql/operations';
import type { BasicResponse } from '@/graphql/types';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserAutocomplete } from '@/components/common/UserAutocomplete';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell, Send, Loader2, Users, User } from 'lucide-react';
import { toast } from 'sonner';

export default function NotificationsPage() {
  const [singleForm, setSingleForm] = useState({ userId: '', title: '', body: '' });
  const [broadcastForm, setBroadcastForm] = useState({ title: '', body: '' });
  const [sendingSingle, setSendingSingle] = useState(false);
  const [sendingBroadcast, setSendingBroadcast] = useState(false);

  const handleSendSingle = async () => {
    if (!singleForm.userId || !singleForm.title || !singleForm.body) {
      toast.error('Todos los campos son obligatorios');
      return;
    }
    setSendingSingle(true);
    try {
      const { data } = await apolloClient.mutate({
        mutation: SEND_NOTIFICATION,
        variables: {
          notification: { title: singleForm.title, body: singleForm.body, forAll: false, userId: singleForm.userId },
        },
      });
      const result = (data as Record<string, unknown>)?.sendNotification as BasicResponse;
      if (result?.success) {
        toast.success('Notificación enviada');
        setSingleForm({ userId: '', title: '', body: '' });
      } else {
        toast.error(result?.message || 'Error al enviar');
      }
    } catch {
      toast.error('Error al enviar la notificación');
    } finally {
      setSendingSingle(false);
    }
  };

  const handleSendBroadcast = async () => {
    if (!broadcastForm.title || !broadcastForm.body) {
      toast.error('El título y el mensaje son obligatorios');
      return;
    }
    setSendingBroadcast(true);
    try {
      const { data } = await apolloClient.mutate({
        mutation: SEND_NOTIFICATION,
        variables: {
          notification: { title: broadcastForm.title, body: broadcastForm.body, forAll: true },
        },
      });
      const result = (data as Record<string, unknown>)?.sendNotification as BasicResponse;
      if (result?.success) {
        toast.success('Notificación enviada a todos los usuarios');
        setBroadcastForm({ title: '', body: '' });
      } else {
        toast.error(result?.message || 'Error al enviar');
      }
    } catch {
      toast.error('Error al enviar la notificación masiva');
    } finally {
      setSendingBroadcast(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Notificaciones"
        description="Envía notificaciones push a los usuarios"
      />

      <Tabs defaultValue="single" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="single" className="gap-2">
            <User className="h-4 w-4" /> Usuario individual
          </TabsTrigger>
          <TabsTrigger value="broadcast" className="gap-2">
            <Users className="h-4 w-4" /> Masiva
          </TabsTrigger>
        </TabsList>

        <TabsContent value="single">
          <Card className="border-0 shadow-sm max-w-xl">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Bell className="h-4 w-4" /> Enviar a usuario
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <UserAutocomplete
                  value={singleForm.userId}
                  onChange={(id) => setSingleForm({ ...singleForm, userId: id })}
                  label="Usuario *"
                  placeholder="Buscar usuario destinatario..."
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Título *</Label>
                <Input
                  value={singleForm.title}
                  onChange={(e) => setSingleForm({ ...singleForm, title: e.target.value })}
                  placeholder="Título de la notificación"
                />
              </div>
              <div className="space-y-2">
                <Label>Mensaje *</Label>
                <Textarea
                  value={singleForm.body}
                  onChange={(e) => setSingleForm({ ...singleForm, body: e.target.value })}
                  placeholder="Cuerpo de la notificación"
                  rows={3}
                />
              </div>
              <Button onClick={handleSendSingle} disabled={sendingSingle} className="w-full">
                {sendingSingle ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                Enviar notificación
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="broadcast">
          <Card className="border-0 shadow-sm max-w-xl">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4" /> Enviar a todos los usuarios
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 p-3">
                <p className="text-sm text-amber-800 dark:text-amber-300">
                  Esto enviará una notificación a todos los usuarios registrados. Úsalo con precaución.
                </p>
              </div>
              <div className="space-y-2">
                <Label>Título *</Label>
                <Input
                  value={broadcastForm.title}
                  onChange={(e) => setBroadcastForm({ ...broadcastForm, title: e.target.value })}
                  placeholder="Título de la notificación"
                />
              </div>
              <div className="space-y-2">
                <Label>Mensaje *</Label>
                <Textarea
                  value={broadcastForm.body}
                  onChange={(e) => setBroadcastForm({ ...broadcastForm, body: e.target.value })}
                  placeholder="Cuerpo de la notificación"
                  rows={3}
                />
              </div>
              <Button onClick={handleSendBroadcast} disabled={sendingBroadcast} className="w-full" variant="default">
                {sendingBroadcast ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                Enviar a todos
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
