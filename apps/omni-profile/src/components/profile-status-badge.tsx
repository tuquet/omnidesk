import { Badge } from '@omnidesk/ui';;

interface ProfileStatusBadgeProps {
  status: string | null;
}

export function ProfileStatusBadge({ status }: ProfileStatusBadgeProps) {
  const normalized = (status || 'IDLE').toUpperCase();

  switch (normalized) {
    case 'RUNNING':
      return (
        <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          Running
        </Badge>
      );
    case 'LAUNCHING':
      return (
        <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 animate-pulse">
          Launching…
        </Badge>
      );
    case 'ERROR':
      return (
        <Badge variant="destructive" className="bg-red-500/10 text-red-500 border-red-500/20">
          Error
        </Badge>
      );
    default: // IDLE
      return (
        <Badge variant="secondary" className="bg-muted text-muted-foreground">
          Ready
        </Badge>
      );
  }
}
