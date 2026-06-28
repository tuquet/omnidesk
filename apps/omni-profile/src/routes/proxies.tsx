import { createFileRoute } from '@tanstack/react-router';
import { PageContainer, PageHeader, PageTitle, PageDescription } from '@omnidesk/ui';

export const Route = createFileRoute('/proxies')({
  component: ProxiesPage,
});

function ProxiesPage() {
  return (
    <PageContainer>
      <PageHeader>
        <PageTitle>Proxies</PageTitle>
        <PageDescription>Manage proxy configurations.</PageDescription>
      </PageHeader>
    </PageContainer>
  );
}
