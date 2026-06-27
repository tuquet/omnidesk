import { createFileRoute } from '@tanstack/react-router';
import { PageContainer, PageHeader, PageTitle, PageDescription } from '@omnidesk/ui';

export const Route = createFileRoute('/tags')({
  component: TagsPage,
});

function TagsPage() {
  return (
    <PageContainer>
      <PageHeader>
        <PageTitle>Tags & Folders</PageTitle>
        <PageDescription>Organize your browser profiles.</PageDescription>
      </PageHeader>
    </PageContainer>
  );
}
