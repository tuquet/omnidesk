import { UsersIcon, ActivityIcon, BuildingIcon } from 'lucide-react';

export const stats = [
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

export type TeamMemberStatus = 'Online' | 'Offline' | 'Away';

export interface TeamMember {
  name: string;
  email: string;
  initials: string;
  role: string;
  roleVariant: 'default' | 'destructive' | 'secondary' | 'outline';
  department: string;
  status: TeamMemberStatus;
  lastActive: string;
}

export const teamMembers: TeamMember[] = [
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
