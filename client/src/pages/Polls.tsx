import { useMutation, useQuery } from '@apollo/client/react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  BarChart2,
  CheckCircle2,
  Clock,
  Plus,
  Search,
  Trash2,
  Users,
  Vote,
  X,
  XCircle,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  CREATE_OR_CHANGE_POLL_VOTE,
  CREATE_POLL,
  DELETE_POLL_VOTE,
  GET_ADMIN_POLLS,
  REMOVE_POLLS,
} from '../graphql/operations';
import type {
  CreatePollInput,
  CreatePollVoteInput,
  Poll,
  PollResponse,
  PollVote,
} from '../graphql/types';

// ─── Helpers ────────────────────────────────────────────────────────────────

function parseDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'number') return new Date(value);
  if (typeof value === 'string') {
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
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatDateTime(value: unknown): string {
  const d = parseDate(value);
  if (!d) return '—';
  return d.toLocaleString('es-ES', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function isPollActive(poll: Poll): boolean {
  const end = parseDate(poll.endDate);
  if (!end) return false;
  return end > new Date();
}

function getVoteCountForOption(poll: Poll, optionIndex: number): number {
  if (!poll.pollVotes) return 0;
  return poll.pollVotes.filter(v => Number(v.optionSelected) === optionIndex).length;
}

function getTotalVotes(poll: Poll): number {
  return poll.pollVotes?.length ?? 0;
}

// ─── Create Poll Dialog ──────────────────────────────────────────────────────

interface CreatePollDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

function CreatePollDialog({ open, onClose, onCreated }: CreatePollDialogProps) {
  const [title, setTitle] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('23:59');

  const [createPoll, { loading }] = useMutation<{ createPoll: PollResponse }>(CREATE_POLL, {
    onCompleted: (data) => {
      if (data.createPoll.success) {
        toast.success('Encuesta creada correctamente');
        onCreated();
        handleClose();
      } else {
        toast.error(data.createPoll.message || 'Error al crear la encuesta');
      }
    },
    onError: (err) => toast.error(err.message),
  });

  function handleClose() {
    setTitle('');
    setOptions(['', '']);
    setEndDate('');
    setEndTime('23:59');
    onClose();
  }

  function addOption() {
    setOptions(prev => [...prev, '']);
  }

  function removeOption(index: number) {
    if (options.length <= 2) {
      toast.error('Una encuesta necesita al menos 2 opciones');
      return;
    }
    setOptions(prev => prev.filter((_, i) => i !== index));
  }

  function updateOption(index: number, value: string) {
    setOptions(prev => prev.map((o, i) => i === index ? value : o));
  }

  function handleSubmit() {
    if (!title.trim()) { toast.error('El título es obligatorio'); return; }
    if (!endDate) { toast.error('La fecha de cierre es obligatoria'); return; }
    const filledOptions = options.filter(o => o.trim() !== '');
    if (filledOptions.length < 2) { toast.error('Se necesitan al menos 2 opciones'); return; }

    const endDateTimeStr = `${endDate}T${endTime}:00.000Z`;
    const endDateObj = new Date(endDateTimeStr);
    if (isNaN(endDateObj.getTime())) { toast.error('Fecha de cierre inválida'); return; }
    if (endDateObj <= new Date()) { toast.error('La fecha de cierre debe ser futura'); return; }

    const input: CreatePollInput = {
      title: title.trim(),
      options: filledOptions,
      endDate: endDateObj.toISOString(),
    };
    createPoll({ variables: { poll: input } });
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Vote className="h-5 w-5 text-primary" />
            Nueva Encuesta
          </DialogTitle>
          <DialogDescription>
            Crea una encuesta para los usuarios de la empresa activa.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="poll-title">Pregunta / Título *</Label>
            <Input
              id="poll-title"
              placeholder="¿Cuál es tu clase favorita?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Options */}
          <div className="space-y-2">
            <Label>Opciones de respuesta *</Label>
            <div className="space-y-2">
              {options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-5 shrink-0">{i + 1}.</span>
                  <Input
                    placeholder={`Opción ${i + 1}`}
                    value={opt}
                    onChange={(e) => updateOption(i, e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => removeOption(i)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addOption}
              className="mt-1"
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Añadir opción
            </Button>
          </div>

          {/* End date */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="poll-end-date">Fecha de cierre *</Label>
              <Input
                id="poll-end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="poll-end-time">Hora de cierre</Label>
              <Input
                id="poll-end-time"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Creando...' : 'Crear encuesta'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Poll Results Dialog ─────────────────────────────────────────────────────

interface PollResultsDialogProps {
  poll: Poll | null;
  open: boolean;
  onClose: () => void;
  onVoteRemoved: () => void;
}

function PollResultsDialog({ poll, open, onClose, onVoteRemoved }: PollResultsDialogProps) {
  const [deleteVote, { loading: deletingVote }] = useMutation<{ deletePollVote: PollResponse }>(
    DELETE_POLL_VOTE,
    {
      onCompleted: (data) => {
        if (data.deletePollVote.success) {
          toast.success('Voto eliminado');
          onVoteRemoved();
        } else {
          toast.error(data.deletePollVote.message || 'Error al eliminar el voto');
        }
      },
      onError: (err) => toast.error(err.message),
    }
  );

  if (!poll) return null;

  const totalVotes = getTotalVotes(poll);
  const active = isPollActive(poll);

  // Group votes by option
  const optionResults = poll.options.map((opt, i) => {
    const count = getVoteCountForOption(poll, i);
    const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
    const voters = (poll.pollVotes || []).filter(v => Number(v.optionSelected) === i);
    return { opt, count, pct, voters };
  });

  // Sort by votes desc
  const sorted = [...optionResults].sort((a, b) => b.count - a.count);
  const winner = sorted[0];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart2 className="h-5 w-5 text-primary" />
            Resultados de la Encuesta
          </DialogTitle>
          <DialogDescription className="text-base font-medium text-foreground mt-1">
            {poll.title}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Meta */}
          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Users className="h-4 w-4" />
              {totalVotes} {totalVotes === 1 ? 'voto' : 'votos'}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              Cierra: {formatDateTime(poll.endDate)}
            </span>
            <Badge variant={active ? 'default' : 'secondary'} className={active ? 'bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/30' : ''}>
              {active ? 'Activa' : 'Cerrada'}
            </Badge>
          </div>

          <Separator />

          {/* Results bars */}
          <div className="space-y-4">
            {optionResults.map((r, i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    {r === winner && totalVotes > 0 && (
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    )}
                    <span className={r === winner && totalVotes > 0 ? 'font-semibold' : ''}>{r.opt}</span>
                  </div>
                  <span className="text-muted-foreground tabular-nums">
                    {r.count} ({r.pct}%)
                  </span>
                </div>
                <Progress value={r.pct} className="h-2.5" />

                {/* Voters list */}
                {r.voters.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {r.voters.map((v: PollVote) => (
                      <div
                        key={v.user.id}
                        className="flex items-center gap-1 bg-muted rounded-full pl-2 pr-1 py-0.5 text-xs"
                      >
                        <span>{v.user.nickname || v.user.name || v.user.id}</span>
                        <button
                          onClick={() => deleteVote({ variables: { pollId: poll.id } })}
                          disabled={deletingVote}
                          className="ml-0.5 rounded-full p-0.5 hover:bg-destructive/20 hover:text-destructive transition-colors"
                          title="Eliminar voto"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {totalVotes === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Vote className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p>Aún no hay votos en esta encuesta.</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Poll Card ───────────────────────────────────────────────────────────────

interface PollCardProps {
  poll: Poll;
  onViewResults: (poll: Poll) => void;
  onDelete: (poll: Poll) => void;
}

function PollCard({ poll, onViewResults, onDelete }: PollCardProps) {
  const active = isPollActive(poll);
  const totalVotes = getTotalVotes(poll);
  const topOption = useMemo(() => {
    if (!poll.pollVotes || poll.pollVotes.length === 0) return null;
    let maxCount = 0;
    let maxIdx = 0;
    poll.options.forEach((_, i) => {
      const c = getVoteCountForOption(poll, i);
      if (c > maxCount) { maxCount = c; maxIdx = i; }
    });
    return maxCount > 0 ? { label: poll.options[maxIdx], count: maxCount } : null;
  }, [poll]);

  return (
    <Card className="flex flex-col hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-base leading-snug line-clamp-2">{poll.title}</CardTitle>
          <Badge
            className={`shrink-0 text-xs ${
              active
                ? 'bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/30'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {active ? 'Activa' : 'Cerrada'}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
          <Clock className="h-3.5 w-3.5" />
          {active ? 'Cierra el' : 'Cerró el'} {formatDate(poll.endDate)}
        </p>
      </CardHeader>

      <CardContent className="flex-1 space-y-3">
        {/* Options preview */}
        <div className="space-y-1.5">
          {poll.options.slice(0, 3).map((opt, i) => {
            const count = getVoteCountForOption(poll, i);
            const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
            return (
              <div key={i} className="space-y-0.5">
                <div className="flex justify-between text-xs">
                  <span className="truncate text-muted-foreground">{opt}</span>
                  <span className="tabular-nums text-muted-foreground ml-2">{pct}%</span>
                </div>
                <Progress value={pct} className="h-1.5" />
              </div>
            );
          })}
          {poll.options.length > 3 && (
            <p className="text-xs text-muted-foreground">+{poll.options.length - 3} opciones más</p>
          )}
        </div>

        <Separator />

        {/* Stats row */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            {totalVotes} {totalVotes === 1 ? 'voto' : 'votos'}
          </span>
          {topOption && (
            <span className="flex items-center gap-1 text-primary font-medium truncate max-w-[55%]">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{topOption.label}</span>
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onViewResults(poll)}
          >
            <BarChart2 className="h-3.5 w-3.5 mr-1.5" />
            Ver resultados
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={() => onDelete(poll)}
            title="Eliminar encuesta"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Delete Confirm Dialog ───────────────────────────────────────────────────

interface DeletePollDialogProps {
  poll: Poll | null;
  open: boolean;
  onClose: () => void;
  onDeleted: () => void;
}

function DeletePollDialog({ poll, open, onClose, onDeleted }: DeletePollDialogProps) {
  const [removePolls, { loading }] = useMutation<{ removePolls: PollResponse }>(REMOVE_POLLS, {
    onCompleted: (data) => {
      if (data.removePolls.success) {
        toast.success('Encuesta eliminada');
        onDeleted();
        onClose();
      } else {
        toast.error(data.removePolls.message || 'Error al eliminar');
      }
    },
    onError: (err) => toast.error(err.message),
  });

  if (!poll) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <XCircle className="h-5 w-5" />
            Eliminar encuesta
          </DialogTitle>
          <DialogDescription>
            ¿Estás seguro de que quieres eliminar la encuesta <strong>"{poll.title}"</strong>?
            Se eliminarán también todos los votos asociados. Esta acción no se puede deshacer.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancelar</Button>
          <Button
            variant="destructive"
            onClick={() => removePolls({ variables: { ids: [poll.id] } })}
            disabled={loading}
          >
            {loading ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function Polls() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'closed'>('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [resultsDialog, setResultsDialog] = useState<Poll | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<Poll | null>(null);

  const { data, loading, error, refetch } = useQuery<{ getAdminPolls: PollResponse }>(
    GET_ADMIN_POLLS,
    { fetchPolicy: 'cache-and-network' }
  );

  const polls: Poll[] = data?.getAdminPolls?.polls ?? [];

  const filtered = useMemo(() => {
    return polls.filter(p => {
      const matchSearch = !search || p.title.toLowerCase().includes(search.toLowerCase());
      const active = isPollActive(p);
      const matchFilter =
        filter === 'all' ||
        (filter === 'active' && active) ||
        (filter === 'closed' && !active);
      return matchSearch && matchFilter;
    });
  }, [polls, search, filter]);

  const stats = useMemo(() => ({
    total: polls.length,
    active: polls.filter(isPollActive).length,
    closed: polls.filter(p => !isPollActive(p)).length,
    totalVotes: polls.reduce((sum, p) => sum + getTotalVotes(p), 0),
  }), [polls]);

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Encuestas</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Crea y gestiona encuestas para los usuarios de la empresa activa.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva encuesta
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: stats.total, icon: Vote, color: 'text-primary' },
          { label: 'Activas', value: stats.active, icon: CheckCircle2, color: 'text-green-500' },
          { label: 'Cerradas', value: stats.closed, icon: XCircle, color: 'text-muted-foreground' },
          { label: 'Votos totales', value: stats.totalVotes, icon: Users, color: 'text-blue-500' },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-2xl font-bold mt-0.5">{value}</p>
              </div>
              <Icon className={`h-8 w-8 ${color} opacity-70`} />
            </div>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar encuesta..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'active', 'closed'] as const).map((f) => (
            <Button
              key={f}
              variant={filter === f ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? 'Todas' : f === 'active' ? 'Activas' : 'Cerradas'}
            </Button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="h-64 animate-pulse bg-muted" />
          ))}
        </div>
      )}

      {error && (
        <Card className="p-8 text-center">
          <XCircle className="h-10 w-10 text-destructive mx-auto mb-3" />
          <p className="text-destructive font-medium">Error al cargar encuestas</p>
          <p className="text-sm text-muted-foreground mt-1">{error.message}</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => refetch()}>
            Reintentar
          </Button>
        </Card>
      )}

      {!loading && !error && filtered.length === 0 && (
        <Card className="p-12 text-center">
          <Vote className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-40" />
          <p className="text-lg font-medium text-muted-foreground">
            {polls.length === 0 ? 'No hay encuestas creadas' : 'No hay resultados para tu búsqueda'}
          </p>
          {polls.length === 0 && (
            <Button className="mt-4" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Crear primera encuesta
            </Button>
          )}
        </Card>
      )}

      {!loading && filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(poll => (
            <PollCard
              key={poll.id}
              poll={poll}
              onViewResults={setResultsDialog}
              onDelete={setDeleteDialog}
            />
          ))}
        </div>
      )}

      {/* Dialogs */}
      <CreatePollDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => refetch()}
      />
      <PollResultsDialog
        poll={resultsDialog}
        open={!!resultsDialog}
        onClose={() => setResultsDialog(null)}
        onVoteRemoved={() => refetch()}
      />
      <DeletePollDialog
        poll={deleteDialog}
        open={!!deleteDialog}
        onClose={() => setDeleteDialog(null)}
        onDeleted={() => refetch()}
      />
    </div>
  );
}
