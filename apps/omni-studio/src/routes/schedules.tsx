import { createFileRoute } from '@tanstack/react-router';
import { PageContainer, PageHeader, PageTitle, PageDescription } from '@omnidesk/ui';

export const Route = createFileRoute('/schedules')({
  component: SchedulesPage,
});

function SchedulesPage() {
  return (
    <PageContainer>
      <PageHeader>
        <PageTitle>Schedules</PageTitle>
        <PageDescription>Cron jobs and planned executions.</PageDescription>
      </PageHeader>
    </PageContainer>
  );
}
