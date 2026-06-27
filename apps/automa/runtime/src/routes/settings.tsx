import { createFileRoute } from '@tanstack/react-router';
import { PageContainer, PageHeader, PageTitle, PageDescription } from '@omnidesk/ui';

export const Route = createFileRoute('/settings')({
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <PageContainer>
      <PageHeader>
        <PageTitle>Engine Settings</PageTitle>
        <PageDescription>Configure concurrency, memory limits, and proxies.</PageDescription>
      </PageHeader>
    </PageContainer>
  );
}
