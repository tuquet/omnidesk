import { createFileRoute } from '@tanstack/react-router';
import { PageContainer, PageHeader, PageTitle } from '@omnidesk/ui';

export const Route = createFileRoute('/tags')({
  component: TagsPage,
});

function TagsPage() {
  return (
    <PageContainer>
      <PageHeader>
        <PageTitle>Tags & Folders</PageTitle>
              </PageHeader>
    </PageContainer>
  );
}
