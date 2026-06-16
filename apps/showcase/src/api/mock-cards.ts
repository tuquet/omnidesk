import { z } from 'zod';

export const teamMemberSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  role: z.string(),
  status: z.enum(['Active', 'Away', 'Offline']),
  avatar: z.string(),
});

export type TeamMember = z.infer<typeof teamMemberSchema>;

export const teamMembers = z.array(teamMemberSchema).parse([
  {
    name: 'Olivia Martin',
    email: 'olivia@example.com',
    role: 'Admin',
    status: 'Active',
    avatar: 'OM',
  },
  {
    name: 'Jackson Lee',
    email: 'jackson@example.com',
    role: 'Developer',
    status: 'Active',
    avatar: 'JL',
  },
  {
    name: 'Isabella Nguyen',
    email: 'isabella@example.com',
    role: 'Designer',
    status: 'Away',
    avatar: 'IN',
  },
  {
    name: 'William Kim',
    email: 'william@example.com',
    role: 'Developer',
    status: 'Active',
    avatar: 'WK',
  },
  {
    name: 'Sofia Davis',
    email: 'sofia@example.com',
    role: 'Manager',
    status: 'Offline',
    avatar: 'SD',
  },
  {
    name: 'Liam Johnson',
    email: 'liam@example.com',
    role: 'Developer',
    status: 'Active',
    avatar: 'LJ',
  },
]);

export const statusBadgeVariant = (status: string) => {
  switch (status) {
    case 'Active':
      return 'default' as const;
    case 'Away':
      return 'secondary' as const;
    case 'Offline':
      return 'outline' as const;
    default:
      return 'default' as const;
  }
};
