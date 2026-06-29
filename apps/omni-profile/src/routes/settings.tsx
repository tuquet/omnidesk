import { createFileRoute } from '@tanstack/react-router';
import { PageContainer, PageHeader, PageTitle } from '@omnidesk/ui';

export const Route = createFileRoute('/settings')({
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <PageContainer>
      <PageHeader>
        <PageTitle>Settings</PageTitle>
              </PageHeader>
    </PageContainer>
  );
}
