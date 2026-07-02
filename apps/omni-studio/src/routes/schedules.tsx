import { createFileRoute } from '@tanstack/react-router';
import { PageContainer, PageHeader, PageTitle, Button, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, useConfirmDialog, Badge, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Switch } from '@omnidesk/ui';
import { CalendarClockIcon, PlusIcon, TrashIcon, PencilIcon } from 'lucide-react';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { client } from '@/lib/api-client';
import { listSchedules, createSchedule, updateSchedule, deleteSchedule, toggleSchedule, listWorkflows } from '@omnidesk/types/client';
import type { Schedule, Workflow } from '@omnidesk/types/client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@omnidesk/ui';
import { PROFILE_API_URL } from '@omnidesk/core';

export const Route = createFileRoute('/schedules')({
  component: SchedulesPage,
});

function SchedulesPage() {
  const queryClient = useQueryClient();
  const { confirm } = useConfirmDialog();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    workflow_id: '',
    profile_id: '',
    cron_expr: '*/5 * * * *',
  });

  // Data fetching
  const { data: schedules = [], isLoading } = useQuery<Schedule[]>({
    queryKey: ['schedules'],
    queryFn: async () => {
      const { data, error } = await listSchedules({ client });
      if (error) throw error;
      return (data as Schedule[]) || [];
    },
  });

  const { data: workflows = [] } = useQuery<Workflow[]>({
    queryKey: ['workflows-lookup'],
    queryFn: async () => {
      const { data, error } = await listWorkflows({ client });
      if (error) throw error;
      return (data as Workflow[]) || [];
    },
  });

  // Fallback to fetch if listProfiles SDK fails (since profile api is on different port)
  const { data: profiles = [] } = useQuery<any[]>({
    queryKey: ['profiles-lookup'],
    queryFn: async () => {
      try {
        const res = await fetch(`${PROFILE_API_URL}/api/browser-profiles`);
        if (!res.ok) throw new Error('Failed to fetch profiles');
        return await res.json() as any[];
      } catch (err) {
        console.error(err);
        return [];
      }
    },
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (payload: Omit<Schedule, 'id' | 'created_at' | 'updated_at' | 'next_run_at' | 'last_run_at' | 'run_count'>) => {
      const { error } = await createSchedule({
        client,
        body: payload as any,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Schedule created successfully');
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      setIsModalOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string, payload: any }) => {
      const { error } = await updateSchedule({
        client,
        path: { id },
        body: payload,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Schedule updated successfully');
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      setIsModalOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await deleteSchedule({
        client,
        path: { id },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Schedule deleted');
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await toggleSchedule({
        client,
        path: { id },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
    },
  });

  const openCreate = () => {
    setEditingSchedule(null);
    setFormData({
      name: '',
      workflow_id: workflows[0]?.id || '',
      profile_id: profiles[0]?.id || '',
      cron_expr: '*/5 * * * *',
    });
    setIsModalOpen(true);
  };

  const openEdit = (schedule: Schedule) => {
    setEditingSchedule(schedule);
    setFormData({
      name: schedule.name,
      workflow_id: schedule.workflow_id,
      profile_id: schedule.profile_id,
      cron_expr: schedule.cron_expr,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (schedule: Schedule) => {
    const confirmed = await confirm({
      title: 'Delete Schedule',
      description: `Are you sure you want to delete "${schedule.name}"?`,
      destructive: true,
    });
    if (confirmed) {
      deleteMutation.mutate(schedule.id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.workflow_id || !formData.profile_id || !formData.cron_expr) {
      toast.error('Please fill all required fields');
      return;
    }

    if (editingSchedule) {
      updateMutation.mutate({
        id: editingSchedule.id,
        payload: formData,
      });
    } else {
      createMutation.mutate({
        ...formData,
        is_enabled: 1,
      } as any);
    }
  };

  return (
    <PageContainer>
      <PageHeader>
        <PageTitle className="flex items-center gap-2">
          <CalendarClockIcon className="w-5 h-5 text-primary" />
          Schedules
        </PageTitle>
        <Button onClick={openCreate} size="sm" className="h-8 text-sm">
          <PlusIcon className="w-4 h-4 mr-2" />
          New Schedule
        </Button>
      </PageHeader>

      <div className="bg-card rounded-md border shadow-sm flex-1 overflow-hidden flex flex-col">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Workflow</TableHead>
              <TableHead>Profile</TableHead>
              <TableHead>Cron</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                  Loading schedules...
                </TableCell>
              </TableRow>
            ) : schedules.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                  No schedules found. Create one to automate workflows.
                </TableCell>
              </TableRow>
            ) : (
              schedules.map((schedule) => {
                const wfName = workflows.find((w) => w.id === schedule.workflow_id)?.name || schedule.workflow_id;
                const pfName = profiles.find((p) => p.id === schedule.profile_id)?.name || schedule.profile_id;
                
                return (
                  <TableRow key={schedule.id}>
                    <TableCell className="font-medium">{schedule.name}</TableCell>
                    <TableCell>{wfName}</TableCell>
                    <TableCell>{pfName}</TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-1.5 py-0.5 rounded text-muted-foreground border">
                        {schedule.cron_expr}
                      </code>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch 
                          checked={schedule.is_enabled === 1}
                          onCheckedChange={() => toggleMutation.mutate(schedule.id)}
                          disabled={toggleMutation.isPending}
                        />
                        <Badge variant={schedule.is_enabled === 1 ? 'default' : 'secondary'} className="w-20 justify-center">
                          {schedule.is_enabled === 1 ? 'Active' : 'Disabled'}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(schedule)}>
                        <PencilIcon className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(schedule)}>
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSchedule ? 'Edit Schedule' : 'Create Schedule'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3 py-2">
            <div className="space-y-2">
              <Label>Schedule Name</Label>
              <Input 
                placeholder="e.g. Daily Data Scraper"
                value={formData.name}
                className="h-8 text-sm"
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Workflow</Label>
              <Select
                value={formData.workflow_id}
                onValueChange={(val) => setFormData({ ...formData, workflow_id: val })}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Select a workflow" />
                </SelectTrigger>
                <SelectContent>
                  {workflows.map((wf) => (
                    <SelectItem key={wf.id} value={wf.id}>{wf.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Browser Profile</Label>
              <Select
                value={formData.profile_id}
                onValueChange={(val) => setFormData({ ...formData, profile_id: val })}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Select a profile" />
                </SelectTrigger>
                <SelectContent>
                  {profiles.map((pf) => (
                    <SelectItem key={pf.id} value={pf.id}>{pf.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Cron Expression</Label>
              <Input 
                placeholder="*/5 * * * *"
                value={formData.cron_expr}
                className="h-8 text-sm"
                onChange={(e) => setFormData({ ...formData, cron_expr: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Format: minute, hour, day of month, month, day of week. Example: <code>0 12 * * *</code> (every day at 12:00)
              </p>
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {editingSchedule ? 'Save Changes' : 'Create Schedule'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
