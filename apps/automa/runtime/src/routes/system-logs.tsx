import { createFileRoute } from '@tanstack/react-router';
import { PageContainer, PageHeader, PageTitle, PageDescription } from '@omnidesk/ui';

export const Route = createFileRoute('/system-logs')({
  component: SystemLogsPage,
});

function SystemLogsPage() {
  return (
    <PageContainer>
      <PageHeader>
        <PageTitle>System Logs</PageTitle>
        <PageDescription>Historical execution logs.</PageDescription>
      </PageHeader>
    </PageContainer>
  );
}
