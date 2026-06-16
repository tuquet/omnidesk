import { createLazyFileRoute } from '@tanstack/react-router';
import { DynamicAppRenderer } from '@omnidesk/app-core';
import { ErrorBoundary } from '@/components/error-boundary';

export const Route = createLazyFileRoute('/_authenticated/app/$appId')({
  component: DynamicAppContainer,
});

function DynamicAppContainer() {
  const { appId } = Route.useParams();

  return (
    <div className="flex flex-1 flex-col h-full w-full">
      <ErrorBoundary>
        <DynamicAppRenderer appId={appId} />
      </ErrorBoundary>
    </div>
  );
}
