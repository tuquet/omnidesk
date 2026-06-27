import { createFileRoute } from '@tanstack/react-router';
import { PageContainer, PageHeader, PageTitle, PageDescription } from '@omnidesk/ui';

export const Route = createFileRoute('/active-jobs')({
  component: ActiveJobsPage,
});

function ActiveJobsPage() {
  return (
    <PageContainer>
      <PageHeader>
        <PageTitle>Active Jobs & Queue</PageTitle>
        <PageDescription>Monitor workflows currently running in the engine.</PageDescription>
      </PageHeader>
    </PageContainer>
  );
}
