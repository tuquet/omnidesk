import { Card, CardContent } from '@omnidesk/ui';

export function WordPressSyncAppPage() {
  const iframeUrl = 'http://localhost:1421/apps/wordpress-sync/index.html';

  return (
    <div className="flex flex-1 flex-col h-[calc(100vh-4rem)] p-4 overflow-hidden">
      <div className="flex flex-col gap-1 mb-4">
        <h1 className="text-2xl font-bold tracking-tight">WordPress Sync Workspace</h1>
        <p className="text-muted-foreground text-sm">
          GitOps dashboard for managing Nhà Atelier Tattoo Studio WordPress media and content
          synchronization.
        </p>
      </div>

      <Card className="flex-1 overflow-hidden border border-border bg-background flex flex-col">
        <CardContent className="p-0 flex-1 h-full w-full relative">
          <iframe
            src={iframeUrl}
            title="WordPress GitOps Sync App"
            className="w-full h-full border-0 rounded-md absolute inset-0"
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
          />
        </CardContent>
      </Card>
    </div>
  );
}
