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
        <PageDescription>Manage recurring execution rules.</PageDescription>
      </PageHeader>
      <div className="p-6">
        <p className="text-muted-foreground">Schedule management moved to Command Center.</p>
      </div>
    </PageContainer>
  );
}
