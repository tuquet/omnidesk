import fs from 'fs';
import path from 'path';

const appsDir = 'c:\\Users\\pn.tund2\\Documents\\Repository\\kill-bug-machine\\apps';

// Simple apps that just need their export changed to default
const simpleApps = ['analytics', 'dashboard', 'file-browser', 'lifecycle', 'team', 'wordpress-sync'];

for (const app of simpleApps) {
  const indexTsx = path.join(appsDir, app, 'src', 'index.tsx');
  const indexTs = path.join(appsDir, app, 'src', 'index.ts');
  
  if (fs.existsSync(indexTsx)) {
    let content = fs.readFileSync(indexTsx, 'utf8');
    content = content.replace(/export function/g, 'export default function');
    fs.writeFileSync(indexTsx, content);
    console.log(`Updated ${app}/src/index.tsx`);
  } else if (fs.existsSync(indexTs)) {
    // maybe it needs to be created
    console.log(`Warning: ${app} has index.ts instead of tsx`);
  }
}

// For projects, there is a detail view.
const projectsTsx = path.join(appsDir, 'projects', 'src', 'index.tsx');
if (fs.existsSync(projectsTsx)) {
  let content = fs.readFileSync(projectsTsx, 'utf8');
  content = content.replace(/export function/g, 'export default function');
  fs.writeFileSync(projectsTsx, content);
  console.log(`Updated projects/src/index.tsx`);
}

// Let's create an App wrapper for documents
const documentsDir = path.join(appsDir, 'documents', 'src');
const docIndex = path.join(documentsDir, 'index.tsx');
const docAppContent = `import { useState } from 'react';
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
`;
fs.writeFileSync(docIndex, docAppContent);
console.log(`Created documents/src/index.tsx`);

// Let's create an App wrapper for showcase
const showcaseDir = path.join(appsDir, 'showcase', 'src');
const showcaseIndex = path.join(showcaseDir, 'index.tsx');
const showcaseAppContent = `import { useState } from 'react';
import { ButtonsPage } from './buttons-page';
import { CardsPage } from './cards-page';
import { FeedbackPage } from './feedback-page';
import { NavigationPage } from './navigation-page';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@omnidesk/ui';

export default function ShowcaseApp() {
  return (
    <div className="flex-1 w-full max-w-[1400px] mx-auto p-4 lg:p-8">
      <Tabs defaultValue="cards" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="cards">Cards</TabsTrigger>
          <TabsTrigger value="buttons">Buttons</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
          <TabsTrigger value="navigation">Navigation</TabsTrigger>
        </TabsList>
        <TabsContent value="cards"><CardsPage /></TabsContent>
        <TabsContent value="buttons"><ButtonsPage /></TabsContent>
        <TabsContent value="feedback"><FeedbackPage /></TabsContent>
        <TabsContent value="navigation"><NavigationPage /></TabsContent>
      </Tabs>
    </div>
  );
}
`;
fs.writeFileSync(showcaseIndex, showcaseAppContent);
console.log(`Created showcase/src/index.tsx`);
