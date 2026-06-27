import { createFileRoute } from '@tanstack/react-router';
import { PageContainer, PageHeader, PageTitle, PageDescription } from '@omnidesk/ui';

export const Route = createFileRoute('/executions')({
  component: ExecutionsPage,
});

function ExecutionsPage() {
  return (
    <PageContainer>
      <PageHeader>
        <PageTitle>Executions</PageTitle>
        <PageDescription>History of all workflow runs.</PageDescription>
      </PageHeader>
    </PageContainer>
  );
}
