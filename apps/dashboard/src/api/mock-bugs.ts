import { z } from 'zod';

export const bugSchema = z.object({
  id: z.string(),
  title: z.string(),
  status: z.enum(['Open', 'In Progress', 'Resolved']),
  priority: z.enum(['Low', 'Medium', 'High', 'Critical']),
  createdAt: z.string(),
});

export type Bug = z.infer<typeof bugSchema>;

export const MOCK_BUGS_COUNT = 5000;

export const generateMockBugs = (): Bug[] => {
  const statuses = ['Open', 'In Progress', 'Resolved'] as const;
  const priorities = ['Low', 'Medium', 'High', 'Critical'] as const;

  const rawBugs = Array.from({ length: MOCK_BUGS_COUNT }).map((_, i) => ({
    id: `BUG-${1000 + i}`,
    title: `Lỗi giao diện màn hình thứ ${i + 1}`,
    status: statuses[Math.floor(Math.random() * 3)],
    priority: priorities[Math.floor(Math.random() * 4)],
    createdAt: new Date(Date.now() - Math.random() * 10000000000)
      .toISOString()
      .split('T')[0],
  }));

  return z.array(bugSchema).parse(rawBugs);
};

export const fetchBugs = async () => {
  await new Promise((resolve) => setTimeout(resolve, 800)); // simulate network delay
  return generateMockBugs();
};
