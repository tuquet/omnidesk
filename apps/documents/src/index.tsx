import { useState } from 'react';
import { DataLibraryPage } from './data-library';
import { ReportsPage } from './reports';
import { WordAssistantPage } from './word-assistant';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@omnidesk/ui';

export default function DocumentsApp() {
  return (
    <div className="flex-1 w-full max-w-[1400px] mx-auto p-4 lg:p-8">
      <Tabs defaultValue="data-library" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="data-library">Data Library</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="word-assistant">Word Assistant</TabsTrigger>
        </TabsList>
        <TabsContent value="data-library"><DataLibraryPage /></TabsContent>
        <TabsContent value="reports"><ReportsPage /></TabsContent>
        <TabsContent value="word-assistant"><WordAssistantPage /></TabsContent>
      </Tabs>
    </div>
  );
}
