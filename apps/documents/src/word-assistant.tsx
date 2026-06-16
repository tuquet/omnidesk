import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Separator,
} from '@omnidesk/ui';
import {
  FileTextIcon,
  ClockIcon,
  FileIcon,
} from 'lucide-react';
import { recentDocuments, quickActions, templates } from './api/mock-word-assistant';

export function WordAssistantPage() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Word Assistant</h1>
        <p className="text-muted-foreground">AI-powered writing tools and document templates.</p>
      </div>

      <Separator />

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Left Sidebar — Recent Documents */}
        <div className="w-full lg:w-1/3">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ClockIcon className="size-4 text-muted-foreground" />
                Recent Documents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-1">
                {recentDocuments.map((doc) => (
                  <button
                    key={doc.name}
                    type="button"
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-muted"
                  >
                    <FileTextIcon className="size-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{doc.name}</p>
                      <p className="text-xs text-muted-foreground">{doc.lastEdited}</p>
                    </div>
                    <Badge variant="outline" className="shrink-0 text-[10px] font-normal">
                      {doc.type}
                    </Badge>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Main Content */}
        <div className="flex flex-1 flex-col gap-6">
          {/* Quick Actions */}
          <div>
            <h2 className="mb-3 text-lg font-semibold tracking-tight">Quick Actions</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {quickActions.map((action) => (
                <Card
                  key={action.title}
                  className="cursor-pointer transition-colors hover:border-primary/30"
                >
                  <CardContent className="flex items-center gap-4 pt-6">
                    <div
                      className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${action.color}`}
                    >
                      <action.icon className="size-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{action.title}</p>
                      <p className="text-xs text-muted-foreground">{action.description}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Templates */}
          <div>
            <h2 className="mb-3 text-lg font-semibold tracking-tight">Templates</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {templates.map((template) => (
                <Card key={template.title}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <FileIcon className="size-4 text-muted-foreground" />
                        {template.title}
                      </CardTitle>
                      {template.badge && (
                        <Badge variant="secondary" className="text-[10px]">
                          {template.badge}
                        </Badge>
                      )}
                    </div>
                    <CardDescription className="text-xs">{template.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" size="sm" className="w-full">
                      Use Template
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
