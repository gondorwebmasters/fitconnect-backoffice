import { useEffect, useState, useMemo } from 'react';
import { apolloClient } from '@/graphql/apollo-client';
import {
  GET_SCHEDULES_FROM_TODAY, CREATE_SCHEDULE, REMOVE_SCHEDULE,
  CHANGE_SCHEDULE_STATUS, ADD_USER_TO_SCHEDULE, REMOVE_USER_FROM_SCHEDULE,
  GET_SCHEDULES_RANGE,
} from '@/graphql/operations';
import type { Schedule, ScheduleResponse, BasicResponse, ScheduleType } from '@/graphql/types';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Plus, Calendar, Clock, Users, Trash2, Loader2, ChevronLeft, ChevronRight, UserMinus,
} from 'lucide-react';
import { toast } from 'sonner';

const DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const SCHEDULE_TYPES: ScheduleType[] = ['standard', 'sparring', 'free', 'conditioning', 'competition'] as unknown as ScheduleType[];
const SCHEDULE_TYPE_LABELS: Record<string, string> = {
  standard: 'Estándar',
  sparring: 'Sparring',
  free: 'Libre',
  conditioning: 'Acondicionamiento',
  competition: 'Competencia',
};

// Helper to format time from HH:mm string
const formatTimeDisplay = (timeStr: string): string => {
  if (!timeStr) return '—';
  // timeStr is expected to be HH:mm format
  return timeStr;
};

export default function SchedulesPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [calendarDate, setCalendarDate] = useState(new Date());

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newSchedule, setNewSchedule] = useState({
    title: '', description: '', type: 'standard', startHour: '09:00', endHour: '10:00',
    days: [1] as number[], maxUsers: 10, admin: '',
  });

  // Delete dialog
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: string | null; deleting: boolean }>({
    open: false, id: null, deleting: false,
  });

  // Detail dialog
  const [detailSchedule, setDetailSchedule] = useState<Schedule | null>(null);

  const fetchSchedules = async () => {
    setLoading(true);
    try {
      if (viewMode === 'calendar') {
        const start = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), 1);
        const end = new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 0);
        const { data } = await apolloClient.query({
          query: GET_SCHEDULES_RANGE,
          variables: { startDate: start.toISOString(), endDate: end.toISOString() },
          fetchPolicy: 'network-only',
        });
        const result = (data as Record<string, unknown>)?.getSchedulesRange as ScheduleResponse;
        if (result?.success) setSchedules(result.schedules || []);
      } else {
        const { data } = await apolloClient.query({ query: GET_SCHEDULES_FROM_TODAY, fetchPolicy: 'network-only' });
        const result = (data as Record<string, unknown>)?.getSchedulesFromToday as ScheduleResponse;
        if (result?.success) setSchedules(result.schedules || []);
      }
    } catch { toast.error('Error al cargar horarios'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchSchedules(); }, [viewMode, calendarDate]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCreate = async () => {
    if (!newSchedule.title) { toast.error('El título es requerido'); return; }
    if (!newSchedule.startHour || !newSchedule.endHour) { toast.error('Las horas son requeridas'); return; }
    setCreating(true);
    try {
      const { data } = await apolloClient.mutate({
        mutation: CREATE_SCHEDULE,
        variables: {
          schedule: {
            title: newSchedule.title,
            description: newSchedule.description,
            type: newSchedule.type,
            startHour: newSchedule.startHour,
            endHour: newSchedule.endHour,
            days: newSchedule.days,
            maxUsers: newSchedule.maxUsers,
            admin: newSchedule.admin || undefined,
          },
        },
      });
      const result = (data as Record<string, unknown>)?.createSchedule as ScheduleResponse;
      if (result?.success) {
        toast.success('Horario creado exitosamente');
        setCreateOpen(false);
        setNewSchedule({
          title: '', description: '', type: 'standard', startHour: '09:00', endHour: '10:00',
          days: [1], maxUsers: 10, admin: '',
        });
        fetchSchedules();
      } else { toast.error(result?.message || 'Error al crear'); }
    } catch (err) { toast.error('Error al crear horario'); }
    finally { setCreating(false); }
  };

  const handleDelete = async () => {
    if (!deleteDialog.id) return;
    setDeleteDialog((p) => ({ ...p, deleting: true }));
    try {
      const { data } = await apolloClient.mutate({ mutation: REMOVE_SCHEDULE, variables: { scheduleId: deleteDialog.id } });
      const result = (data as Record<string, unknown>)?.removeSchedule as BasicResponse;
      if (result?.success) { toast.success('Horario eliminado'); setDeleteDialog({ open: false, id: null, deleting: false }); fetchSchedules(); }
      else { toast.error(result?.message || 'Error'); }
    } catch { toast.error('Error al eliminar'); }
    finally { setDeleteDialog((p) => ({ ...p, deleting: false })); }
  };

  const handleStatusChange = async (scheduleId: string) => {
    try {
      await apolloClient.mutate({ mutation: CHANGE_SCHEDULE_STATUS, variables: { scheduleId } });
      toast.success('Estado actualizado');
      fetchSchedules();
    } catch { toast.error('Error al cambiar estado'); }
  };

  const handleRemoveUser = async (scheduleId: string, userId: string) => {
    try {
      await apolloClient.mutate({ mutation: REMOVE_USER_FROM_SCHEDULE, variables: { scheduleId, userId } });
      toast.success('Usuario removido del horario');
      fetchSchedules();
      setDetailSchedule(null);
    } catch { toast.error('Error al remover usuario'); }
  };

  // Calendar helpers
  const calendarDays = useMemo(() => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const offset = firstDay === 0 ? 6 : firstDay - 1;
    const days: (number | null)[] = Array(offset).fill(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  }, [calendarDate]);

  const schedulesByDay = useMemo(() => {
    const map: Record<number, Schedule[]> = {};
    schedules.forEach((s) => {
      const d = new Date(s.startDate).getDate();
      if (!map[d]) map[d] = [];
      map[d].push(s);
    });
    return map;
  }, [schedules]);

  return (
    <div>
      <PageHeader
        title="Horarios"
        description="Administra los horarios de clases y reservas"
        actions={
          <div className="flex items-center gap-2">
            <Button variant={viewMode === 'list' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('list')}>Lista</Button>
            <Button variant={viewMode === 'calendar' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('calendar')}><Calendar className="mr-1 h-4 w-4" /> Calendario</Button>
            <Button onClick={() => setCreateOpen(true)} className="bg-[#F97316] hover:bg-[#EA580C] text-white"><Plus className="mr-2 h-4 w-4" /> Nuevo Horario</Button>
          </div>
        }
      />

      {viewMode === 'calendar' ? (
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <Button variant="ghost" size="icon" onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1))}><ChevronLeft className="h-4 w-4" /></Button>
            <CardTitle className="text-base">{calendarDate.toLocaleString('es-ES', { month: 'long', year: 'numeric' })}</CardTitle>
            <Button variant="ghost" size="icon" onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1))}><ChevronRight className="h-4 w-4" /></Button>
          </CardHeader>
          <CardContent>
            {loading ? <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-[#F97316]" /></div> : (
              <div className="grid grid-cols-7 gap-px bg-muted rounded-lg overflow-hidden">
                {DAYS.map((d) => <div key={d} className="bg-muted/50 p-2 text-center text-xs font-medium text-muted-foreground">{d}</div>)}
                {calendarDays.map((day, i) => (
                  <div key={i} className={`bg-card min-h-[80px] p-1 ${day ? '' : 'bg-muted/30'}`}>
                    {day && (
                      <>
                        <span className="text-xs font-medium text-muted-foreground">{day}</span>
                        <div className="space-y-0.5 mt-0.5">
                          {(schedulesByDay[day] || []).slice(0, 3).map((s) => {
                            const startTime = formatTimeDisplay(s.startDate.split('T')[1]?.substring(0, 5) || '');
                            return (
                              <button key={s.id} onClick={() => setDetailSchedule(s)} className="block w-full text-left">
                                <div className={`text-[10px] leading-tight px-1 py-0.5 rounded truncate font-medium ${s.state === 'cancelled' ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300' : s.state === 'full' ? 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'}`}>
                                  {startTime} {s.title}
                                </div>
                              </button>
                            );
                          })}
                          {(schedulesByDay[day] || []).length > 3 && <p className="text-[10px] text-muted-foreground px-1">+{(schedulesByDay[day] || []).length - 3} más</p>}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <Card key={i} className="border-border/50"><CardContent className="p-4"><div className="h-16 animate-pulse bg-muted rounded" /></CardContent></Card>)
          ) : schedules.length === 0 ? (
            <Card className="border-border/50"><CardContent className="p-8 text-center text-muted-foreground">No hay horarios próximos.</CardContent></Card>
          ) : (
            schedules.map((s) => {
              const startTime = formatTimeDisplay(s.startDate.split('T')[1]?.substring(0, 5) || '');
              const endTime = formatTimeDisplay(s.endDate.split('T')[1]?.substring(0, 5) || '');
              return (
                <Card key={s.id} className="border-border/50 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setDetailSchedule(s)}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="text-center min-w-[50px]">
                          <p className="text-xs text-muted-foreground">{new Date(s.startDate).toLocaleDateString('es-ES', { weekday: 'short' })}</p>
                          <p className="text-lg font-bold">{new Date(s.startDate).getDate()}</p>
                        </div>
                        <div>
                          <p className="font-medium text-sm">{s.title}</p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{startTime} - {endTime}</span>
                            <span className="flex items-center gap-1"><Users className="h-3 w-3" />{s.users?.length || 0}/{s.maxUsers}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={s.state} />
                        <Badge variant="outline" className="text-xs">{SCHEDULE_TYPE_LABELS[s.type] || s.type}</Badge>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteDialog({ open: true, id: s.id, deleting: false }); }}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      )}

      {/* Schedule Detail Dialog */}
      <Dialog open={!!detailSchedule} onOpenChange={(o) => { if (!o) setDetailSchedule(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{detailSchedule?.title}</DialogTitle></DialogHeader>
          {detailSchedule && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-muted-foreground">Tipo:</span> <Badge variant="outline">{SCHEDULE_TYPE_LABELS[detailSchedule.type] || detailSchedule.type}</Badge></div>
                <div><span className="text-muted-foreground">Estado:</span> <StatusBadge status={detailSchedule.state} /></div>
                <div><span className="text-muted-foreground">Inicio:</span> {new Date(detailSchedule.startDate).toLocaleString('es-ES')}</div>
                <div><span className="text-muted-foreground">Fin:</span> {new Date(detailSchedule.endDate).toLocaleString('es-ES')}</div>
                <div><span className="text-muted-foreground">Capacidad:</span> {detailSchedule.users?.length || 0}/{detailSchedule.maxUsers}</div>
                <div><span className="text-muted-foreground">Entrenador:</span> {detailSchedule.admin?.nickname || '—'}</div>
              </div>
              {detailSchedule.description && <p className="text-sm text-muted-foreground">{detailSchedule.description}</p>}
              <div>
                <h4 className="text-sm font-medium mb-2">Usuarios Inscritos ({detailSchedule.users?.length || 0})</h4>
                {detailSchedule.users && detailSchedule.users.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {detailSchedule.users.map((u) => (
                      <div key={u.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                        <span className="text-sm">{u.name && u.surname ? `${u.name} ${u.surname}` : u.nickname}</span>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleRemoveUser(detailSchedule.id, u.id)}>
                          <UserMinus className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-sm text-muted-foreground">Sin usuarios inscritos aún.</p>}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Schedule Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Crear Horario</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2"><Label>Título *</Label><Input value={newSchedule.title} onChange={(e) => setNewSchedule({ ...newSchedule, title: e.target.value })} placeholder="Nombre de la clase" /></div>
            <div className="space-y-2"><Label>Descripción</Label><Textarea value={newSchedule.description} onChange={(e) => setNewSchedule({ ...newSchedule, description: e.target.value })} rows={2} /></div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={newSchedule.type} onValueChange={(v) => setNewSchedule({ ...newSchedule, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{SCHEDULE_TYPES.map((t) => <SelectItem key={String(t)} value={String(t)}>{SCHEDULE_TYPE_LABELS[String(t)]}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Hora Inicio *</Label><Input type="time" value={newSchedule.startHour} onChange={(e) => setNewSchedule({ ...newSchedule, startHour: e.target.value })} /></div>
              <div className="space-y-2"><Label>Hora Fin *</Label><Input type="time" value={newSchedule.endHour} onChange={(e) => setNewSchedule({ ...newSchedule, endHour: e.target.value })} /></div>
            </div>
            <div className="space-y-2">
              <Label>Días</Label>
              <div className="flex flex-wrap gap-2">
                {DAYS.map((d, i) => (
                  <label key={d} className="flex items-center gap-1.5 text-sm">
                    <Checkbox
                      checked={newSchedule.days.includes(i + 1)}
                      onCheckedChange={(checked) => {
                        const days = checked ? [...newSchedule.days, i + 1] : newSchedule.days.filter((x) => x !== i + 1);
                        setNewSchedule({ ...newSchedule, days });
                      }}
                    />
                    {d}
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-2"><Label>Máximo de Usuarios</Label><Input type="number" min="1" value={newSchedule.maxUsers} onChange={(e) => setNewSchedule({ ...newSchedule, maxUsers: parseInt(e.target.value) || 1 })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={creating} className="bg-[#F97316] hover:bg-[#EA580C] text-white">{creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Crear</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={deleteDialog.open} onOpenChange={(o) => setDeleteDialog((p) => ({ ...p, open: o }))} title="Eliminar Horario" description="¿Estás seguro de que deseas eliminar este horario? Esta acción no se puede deshacer." confirmLabel="Eliminar" onConfirm={handleDelete} variant="destructive" loading={deleteDialog.deleting} />
    </div>
  );
}
