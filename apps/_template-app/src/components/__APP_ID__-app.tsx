import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@omnidesk/ui';
import { use__APP_NAME_PASCAL__Data } from '../api/queries';

export function __APP_NAME_PASCAL__App() {
  const { data, isLoading } = use__APP_NAME_PASCAL__Data();

  return (
    <div className="flex flex-col gap-6 p-6 w-full max-w-7xl mx-auto">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">__APP_NAME__</h1>
        <p className="text-muted-foreground text-lg">
          Welcome to your new app. This template is fully configured with TanStack Query and Zod.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>App Data</CardTitle>
          <CardDescription>Data fetched using TanStack Query</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="animate-pulse h-10 bg-muted rounded-md" />
          ) : (
            <pre className="p-4 bg-muted/50 rounded-md overflow-auto">
              <code>{JSON.stringify(data, null, 2)}</code>
            </pre>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
