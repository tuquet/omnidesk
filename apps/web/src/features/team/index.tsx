import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Avatar,
  AvatarFallback,
  Separator,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Input,
} from '@omnidesk/ui';
import { UserPlusIcon, SearchIcon, UsersIcon, ActivityIcon, BuildingIcon } from 'lucide-react';

const stats = [
  {
    title: 'Total Members',
    value: '24',
    icon: UsersIcon,
    detail: null,
  },
  {
    title: 'Active Now',
    value: '18',
    icon: ActivityIcon,
    detail: 'online',
  },
  {
    title: 'Departments',
    value: '6',
    icon: BuildingIcon,
    detail: null,
  },
];

type TeamMemberStatus = 'Online' | 'Offline' | 'Away';

interface TeamMember {
  name: string;
  email: string;
  initials: string;
  role: string;
  roleVariant: 'default' | 'destructive' | 'secondary' | 'outline';
  department: string;
  status: TeamMemberStatus;
  lastActive: string;
}

const teamMembers: TeamMember[] = [
  {
    name: 'Sarah Chen',
    email: 'sarah.chen@company.com',
    initials: 'SC',
    role: 'Admin',
    roleVariant: 'destructive',
    department: 'Engineering',
    status: 'Online',
    lastActive: 'Just now',
  },
  {
    name: 'James Wilson',
    email: 'james.wilson@company.com',
    initials: 'JW',
    role: 'Developer',
    roleVariant: 'default',
    department: 'Engineering',
    status: 'Online',
    lastActive: 'Just now',
  },
  {
    name: 'Maria Garcia',
    email: 'maria.garcia@company.com',
    initials: 'MG',
    role: 'Designer',
    roleVariant: 'secondary',
    department: 'Design',
    status: 'Away',
    lastActive: '5 min ago',
  },
  {
    name: 'David Kim',
    email: 'david.kim@company.com',
    initials: 'DK',
    role: 'DevOps',
    roleVariant: 'default',
    department: 'DevOps',
    status: 'Online',
    lastActive: 'Just now',
  },
  {
    name: 'Emma Thompson',
    email: 'emma.thompson@company.com',
    initials: 'ET',
    role: 'PM',
    roleVariant: 'outline',
    department: 'Product',
    status: 'Offline',
    lastActive: '2 hours ago',
  },
  {
    name: 'Alex Rivera',
    email: 'alex.rivera@company.com',
    initials: 'AR',
    role: 'Developer',
    roleVariant: 'default',
    department: 'Engineering',
    status: 'Online',
    lastActive: 'Just now',
  },
  {
    name: 'Priya Patel',
    email: 'priya.patel@company.com',
    initials: 'PP',
    role: 'Designer',
    roleVariant: 'secondary',
    department: 'Design',
    status: 'Away',
    lastActive: '15 min ago',
  },
  {
    name: 'Lucas Anderson',
    email: 'lucas.anderson@company.com',
    initials: 'LA',
    role: 'Developer',
    roleVariant: 'default',
    department: 'Marketing',
    status: 'Offline',
    lastActive: 'Yesterday',
  },
];

function StatusDot({ status }: { status: TeamMemberStatus }) {
  const color =
    status === 'Online' ? 'bg-green-500' : status === 'Away' ? 'bg-yellow-500' : 'bg-gray-400';

  return (
    <span className="flex items-center gap-2">
      <span className={`inline-block h-2 w-2 rounded-full ${color}`} />
      {status}
    </span>
  );
}

export function TeamPage() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Team</h1>
          <p className="text-muted-foreground">Manage team members, roles, and permissions.</p>
        </div>
        <Button>
          <UserPlusIcon className="mr-2 h-4 w-4" />
          Invite Member
        </Button>
      </div>

      <Separator />

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">{stat.value}</span>
                {stat.detail === 'online' && (
                  <span className="inline-block h-2.5 w-2.5 rounded-full bg-green-500" />
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search + Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Members</CardTitle>
            <div className="relative w-64">
              <SearchIcon className="text-muted-foreground absolute left-2.5 top-2.5 h-4 w-4" />
              <Input placeholder="Search members..." className="pl-9" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Last Active</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teamMembers.map((member) => (
                <TableRow key={member.email}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">{member.initials}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium leading-none">{member.name}</p>
                        <p className="text-muted-foreground text-xs">{member.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={member.roleVariant}>{member.role}</Badge>
                  </TableCell>
                  <TableCell className="text-sm">{member.department}</TableCell>
                  <TableCell className="text-sm">
                    <StatusDot status={member.status} />
                  </TableCell>
                  <TableCell className="text-muted-foreground text-right text-sm">
                    {member.lastActive}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
