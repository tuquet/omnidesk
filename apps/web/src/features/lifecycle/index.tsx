import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Badge,
  Avatar,
  AvatarFallback,
  Separator,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@omnidesk/ui';
import { ProgressBar } from '@/components/progress-bar';
import { CalendarIcon, ClockIcon, CheckCircle2Icon, AlertCircleIcon, PlusIcon } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  priority: 'Low' | 'Medium' | 'High';
  assignee: string;
  initials: string;
  dueDate: string;
  progress: number;
}

const backlogTasks: Task[] = [
  {
    id: 'BL-101',
    title: 'Implement user authentication',
    priority: 'High',
    assignee: 'Sarah Chen',
    initials: 'SC',
    dueDate: 'Jun 20, 2026',
    progress: 0,
  },
  {
    id: 'BL-102',
    title: 'Design onboarding flow',
    priority: 'Medium',
    assignee: 'Marcus Lee',
    initials: 'ML',
    dueDate: 'Jun 25, 2026',
    progress: 5,
  },
  {
    id: 'BL-103',
    title: 'Set up CI/CD pipeline',
    priority: 'Low',
    assignee: 'Olivia Park',
    initials: 'OP',
    dueDate: 'Jul 1, 2026',
    progress: 0,
  },
  {
    id: 'BL-104',
    title: 'Create API rate limiter',
    priority: 'Medium',
    assignee: 'James Wu',
    initials: 'JW',
    dueDate: 'Jul 5, 2026',
    progress: 0,
  },
];

const inProgressTasks: Task[] = [
  {
    id: 'IP-201',
    title: 'Refactor API layer',
    priority: 'High',
    assignee: 'David Kim',
    initials: 'DK',
    dueDate: 'Jun 15, 2026',
    progress: 65,
  },
  {
    id: 'IP-202',
    title: 'Build notification system',
    priority: 'Medium',
    assignee: 'Emily Ross',
    initials: 'ER',
    dueDate: 'Jun 18, 2026',
    progress: 40,
  },
  {
    id: 'IP-203',
    title: 'Migrate database schema',
    priority: 'High',
    assignee: 'Sarah Chen',
    initials: 'SC',
    dueDate: 'Jun 14, 2026',
    progress: 80,
  },
];

const reviewTasks: Task[] = [
  {
    id: 'RV-301',
    title: 'Add export to CSV feature',
    priority: 'Low',
    assignee: 'Marcus Lee',
    initials: 'ML',
    dueDate: 'Jun 12, 2026',
    progress: 90,
  },
  {
    id: 'RV-302',
    title: 'Implement dark mode toggle',
    priority: 'Medium',
    assignee: 'Olivia Park',
    initials: 'OP',
    dueDate: 'Jun 13, 2026',
    progress: 95,
  },
  {
    id: 'RV-303',
    title: 'Update user profile page',
    priority: 'Low',
    assignee: 'James Wu',
    initials: 'JW',
    dueDate: 'Jun 11, 2026',
    progress: 85,
  },
];

const doneTasks: Task[] = [
  {
    id: 'DN-401',
    title: 'Set up project scaffolding',
    priority: 'High',
    assignee: 'David Kim',
    initials: 'DK',
    dueDate: 'Jun 5, 2026',
    progress: 100,
  },
  {
    id: 'DN-402',
    title: 'Configure linting and formatting',
    priority: 'Low',
    assignee: 'Emily Ross',
    initials: 'ER',
    dueDate: 'Jun 6, 2026',
    progress: 100,
  },
  {
    id: 'DN-403',
    title: 'Create shared component library',
    priority: 'Medium',
    assignee: 'Sarah Chen',
    initials: 'SC',
    dueDate: 'Jun 8, 2026',
    progress: 100,
  },
  {
    id: 'DN-404',
    title: 'Integrate analytics SDK',
    priority: 'Medium',
    assignee: 'Marcus Lee',
    initials: 'ML',
    dueDate: 'Jun 9, 2026',
    progress: 100,
  },
];

const priorityVariant = {
  Low: 'outline' as const,
  Medium: 'secondary' as const,
  High: 'destructive' as const,
};

function TaskCard({ task }: { task: Task }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-sm font-medium leading-tight">{task.title}</CardTitle>
            <CardDescription className="text-xs">{task.id}</CardDescription>
          </div>
          <Badge variant={priorityVariant[task.priority]}>{task.priority}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-[10px]">{task.initials}</AvatarFallback>
            </Avatar>
            <span className="text-muted-foreground text-xs">{task.assignee}</span>
          </div>
          <div className="text-muted-foreground flex items-center gap-1 text-xs">
            <CalendarIcon className="h-3 w-3" />
            {task.dueDate}
          </div>
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-xs">Progress</span>
            <span className="text-xs font-medium">{task.progress}%</span>
          </div>
          <ProgressBar value={task.progress} className="h-1.5" />
        </div>
      </CardContent>
    </Card>
  );
}

function TaskColumn({ tasks }: { tasks: Task[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {tasks.map((task) => (
        <TaskCard key={task.id} task={task} />
      ))}
    </div>
  );
}

export function LifecyclePage() {
  const totalTasks =
    backlogTasks.length + inProgressTasks.length + reviewTasks.length + doneTasks.length;

  const stats = [
    {
      title: 'Total Tasks',
      value: totalTasks,
      icon: PlusIcon,
      description: 'Across all stages',
    },
    {
      title: 'In Progress',
      value: inProgressTasks.length,
      icon: ClockIcon,
      description: 'Currently active',
    },
    {
      title: 'Completed',
      value: doneTasks.length,
      icon: CheckCircle2Icon,
      description: 'Successfully done',
    },
    {
      title: 'Overdue',
      value: 2,
      icon: AlertCircleIcon,
      description: 'Need attention',
    },
  ];

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Lifecycle</h1>
        <p className="text-muted-foreground">Track items through their lifecycle stages.</p>
      </div>

      <Separator />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-muted-foreground text-xs">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="backlog">
        <TabsList>
          <TabsTrigger value="backlog">Backlog ({backlogTasks.length})</TabsTrigger>
          <TabsTrigger value="in-progress">In Progress ({inProgressTasks.length})</TabsTrigger>
          <TabsTrigger value="review">Review ({reviewTasks.length})</TabsTrigger>
          <TabsTrigger value="done">Done ({doneTasks.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="backlog" className="mt-4">
          <TaskColumn tasks={backlogTasks} />
        </TabsContent>
        <TabsContent value="in-progress" className="mt-4">
          <TaskColumn tasks={inProgressTasks} />
        </TabsContent>
        <TabsContent value="review" className="mt-4">
          <TaskColumn tasks={reviewTasks} />
        </TabsContent>
        <TabsContent value="done" className="mt-4">
          <TaskColumn tasks={doneTasks} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
