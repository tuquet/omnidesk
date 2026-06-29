import { createFileRoute } from '@tanstack/react-router';
import { PageContainer, PageHeader, PageTitle } from '@omnidesk/ui';

export const Route = createFileRoute('/proxies')({
  component: ProxiesPage,
});

function ProxiesPage() {
  return (
    <PageContainer>
      <PageHeader>
        <PageTitle>Proxies</PageTitle>
              </PageHeader>
    </PageContainer>
  );
}
