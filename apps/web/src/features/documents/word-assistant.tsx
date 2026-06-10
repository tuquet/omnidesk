import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Separator,
} from '@kbm/ui';
import {
  FileTextIcon,
  FilePlusIcon,
  LayoutTemplateIcon,
  UploadIcon,
  SparklesIcon,
  ClockIcon,
  FileIcon,
} from 'lucide-react';

const recentDocuments = [
  {
    name: 'Q2 Strategy Brief',
    lastEdited: '2 hours ago',
    type: 'Document',
  },
  {
    name: 'API Integration Guide',
    lastEdited: '5 hours ago',
    type: 'Technical',
  },
  {
    name: 'Team Standup Notes — Jun 9',
    lastEdited: 'Yesterday',
    type: 'Notes',
  },
  {
    name: 'Product Roadmap 2026',
    lastEdited: '2 days ago',
    type: 'Planning',
  },
  {
    name: 'Customer Onboarding Flow',
    lastEdited: '3 days ago',
    type: 'Process',
  },
];

const quickActions = [
  {
    title: 'New Document',
    description: 'Start with a blank document',
    icon: FilePlusIcon,
    color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  },
  {
    title: 'From Template',
    description: 'Choose from pre-built templates',
    icon: LayoutTemplateIcon,
    color: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
  },
  {
    title: 'Import',
    description: 'Import .docx, .pdf, or .md files',
    icon: UploadIcon,
    color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  },
  {
    title: 'AI Generate',
    description: 'Generate content with AI assistance',
    icon: SparklesIcon,
    color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  },
];

const templates = [
  {
    title: 'Project Proposal',
    description:
      'A structured proposal template with sections for objectives, timeline, budget, and deliverables.',
    badge: 'Popular',
  },
  {
    title: 'Meeting Notes',
    description:
      'Capture agendas, action items, and decisions with a clean meeting notes format.',
    badge: 'New',
  },
  {
    title: 'Technical Spec',
    description:
      'RFC-style technical specification with problem statement, proposed solution, and trade-offs.',
    badge: null,
  },
  {
    title: 'Release Notes',
    description:
      'Changelog-style template for documenting features, fixes, and breaking changes per release.',
    badge: null,
  },
];

export function WordAssistantPage() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Word Assistant</h1>
        <p className="text-muted-foreground">
          AI-powered writing tools and document templates.
        </p>
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
                      <p className="truncate text-sm font-medium">
                        {doc.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {doc.lastEdited}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className="shrink-0 text-[10px] font-normal"
                    >
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
            <h2 className="mb-3 text-lg font-semibold tracking-tight">
              Quick Actions
            </h2>
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
                      <p className="text-xs text-muted-foreground">
                        {action.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Templates */}
          <div>
            <h2 className="mb-3 text-lg font-semibold tracking-tight">
              Templates
            </h2>
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
                    <CardDescription className="text-xs">
                      {template.description}
                    </CardDescription>
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
