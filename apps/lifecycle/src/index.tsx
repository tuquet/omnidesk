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

import { type Task, backlogTasks, inProgressTasks, reviewTasks, doneTasks, priorityVariant } from './api/mock-tasks';



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
