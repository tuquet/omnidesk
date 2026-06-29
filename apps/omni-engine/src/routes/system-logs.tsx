import { createFileRoute } from '@tanstack/react-router';
import { PageContainer, PageHeader, PageTitle } from '@omnidesk/ui';

export const Route = createFileRoute('/system-logs')({
  component: SystemLogsPage,
});

function SystemLogsPage() {
  return (
    <PageContainer>
      <PageHeader>
        <PageTitle>System Logs</PageTitle>
              </PageHeader>
    </PageContainer>
  );
}
