import { useState } from 'react';
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
