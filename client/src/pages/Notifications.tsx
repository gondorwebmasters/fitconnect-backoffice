import { useEffect, useState, useMemo } from 'react';
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
      toast.error('All fields are required');
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
        toast.success('Notification sent');
        setSingleForm({ userId: '', title: '', body: '' });
      } else {
        toast.error(result?.message || 'Failed to send');
      }
    } catch {
      toast.error('Error sending notification');
    } finally {
      setSendingSingle(false);
    }
  };

  const handleSendBroadcast = async () => {
    if (!broadcastForm.title || !broadcastForm.body) {
      toast.error('Title and body are required');
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
        toast.success('Broadcast notification sent to all users');
        setBroadcastForm({ title: '', body: '' });
      } else {
        toast.error(result?.message || 'Failed to send');
      }
    } catch {
      toast.error('Error sending broadcast');
    } finally {
      setSendingBroadcast(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Notifications"
        description="Send push notifications to users"
      />

      <Tabs defaultValue="single" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="single" className="gap-2">
            <User className="h-4 w-4" /> Single User
          </TabsTrigger>
          <TabsTrigger value="broadcast" className="gap-2">
            <Users className="h-4 w-4" /> Broadcast
          </TabsTrigger>
        </TabsList>

        <TabsContent value="single">
          <Card className="border-0 shadow-sm max-w-xl">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Bell className="h-4 w-4" /> Send to User
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
                <Label>Title *</Label>
                <Input
                  value={singleForm.title}
                  onChange={(e) => setSingleForm({ ...singleForm, title: e.target.value })}
                  placeholder="Notification title"
                />
              </div>
              <div className="space-y-2">
                <Label>Body *</Label>
                <Textarea
                  value={singleForm.body}
                  onChange={(e) => setSingleForm({ ...singleForm, body: e.target.value })}
                  placeholder="Notification message"
                  rows={3}
                />
              </div>
              <Button onClick={handleSendSingle} disabled={sendingSingle} className="w-full">
                {sendingSingle ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                Send Notification
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="broadcast">
          <Card className="border-0 shadow-sm max-w-xl">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4" /> Broadcast to All Users
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                <p className="text-sm text-amber-800">
                  This will send a notification to all registered users. Use with caution.
                </p>
              </div>
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input
                  value={broadcastForm.title}
                  onChange={(e) => setBroadcastForm({ ...broadcastForm, title: e.target.value })}
                  placeholder="Notification title"
                />
              </div>
              <div className="space-y-2">
                <Label>Body *</Label>
                <Textarea
                  value={broadcastForm.body}
                  onChange={(e) => setBroadcastForm({ ...broadcastForm, body: e.target.value })}
                  placeholder="Notification message"
                  rows={3}
                />
              </div>
              <Button onClick={handleSendBroadcast} disabled={sendingBroadcast} className="w-full" variant="default">
                {sendingBroadcast ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                Send to All Users
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
