import { Badge } from '@/components/ui/badge';

type Variant = 'default' | 'secondary' | 'destructive' | 'outline';

const statusColors: Record<string, { variant: Variant; className: string }> = {
  active: { variant: 'default', className: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200' },
  available: { variant: 'default', className: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200' },
  succeeded: { variant: 'default', className: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200' },
  inactive: { variant: 'secondary', className: 'bg-slate-100 text-slate-600 hover:bg-slate-100 border-slate-200' },
  pending: { variant: 'secondary', className: 'bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200' },
  trialing: { variant: 'secondary', className: 'bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200' },
  cancelled: { variant: 'destructive', className: 'bg-red-100 text-red-700 hover:bg-red-100 border-red-200' },
  canceled: { variant: 'destructive', className: 'bg-red-100 text-red-700 hover:bg-red-100 border-red-200' },
  failed: { variant: 'destructive', className: 'bg-red-100 text-red-700 hover:bg-red-100 border-red-200' },
  full: { variant: 'secondary', className: 'bg-violet-100 text-violet-700 hover:bg-violet-100 border-violet-200' },
  paused: { variant: 'secondary', className: 'bg-orange-100 text-orange-700 hover:bg-orange-100 border-orange-200' },
  past_due: { variant: 'destructive', className: 'bg-red-100 text-red-700 hover:bg-red-100 border-red-200' },
  unpaid: { variant: 'destructive', className: 'bg-red-100 text-red-700 hover:bg-red-100 border-red-200' },
  archived: { variant: 'secondary', className: 'bg-slate-100 text-slate-500 hover:bg-slate-100 border-slate-200' },
  expired: { variant: 'secondary', className: 'bg-slate-100 text-slate-500 hover:bg-slate-100 border-slate-200' },
  refunded: { variant: 'secondary', className: 'bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200' },
  boss: { variant: 'default', className: 'bg-indigo-100 text-indigo-700 hover:bg-indigo-100 border-indigo-200' },
  coach: { variant: 'default', className: 'bg-teal-100 text-teal-700 hover:bg-teal-100 border-teal-200' },
  premium: { variant: 'default', className: 'bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200' },
  standard: { variant: 'secondary', className: 'bg-slate-100 text-slate-600 hover:bg-slate-100 border-slate-200' },
};

interface StatusBadgeProps {
  status: string | null | undefined;
  className?: string;
}

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  if (!status) return null;
  const config = statusColors[status.toLowerCase()] || {
    variant: 'outline' as Variant,
    className: '',
  };

  return (
    <Badge variant={config.variant} className={`${config.className} font-medium text-xs ${className}`}>
      {status.replace(/_/g, ' ')}
    </Badge>
  );
}
