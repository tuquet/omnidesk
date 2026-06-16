import type { TeamMemberStatus } from '../config/constants';

export function StatusDot({ status }: { status: TeamMemberStatus }) {
  const color =
    status === 'Online' ? 'bg-green-500' : status === 'Away' ? 'bg-yellow-500' : 'bg-gray-400';

  return (
    <span className="flex items-center gap-2">
      <span className={`inline-block h-2 w-2 rounded-full ${color}`} />
      {status}
    </span>
  );
}
