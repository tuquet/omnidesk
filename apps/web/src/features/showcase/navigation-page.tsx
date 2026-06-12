import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
  Separator,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Checkbox,
  Button,
  Badge,
} from '@omnidesk/ui';
import {
  ChevronRight,
  Code,
  FileText,
  Folder,
  Home,
  Layers,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  User,
} from 'lucide-react';

export function NavigationShowcase() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Navigation &amp; Layout</h1>
        <p className="text-muted-foreground">
          Breadcrumbs, tabs, menubars, and labels for navigation and layout structure.
        </p>
      </div>

      <Separator />

      {/* Breadcrumb Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Breadcrumbs</CardTitle>
          <CardDescription>
            Hierarchical navigation trails showing the user&apos;s current location.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-6">
            <div>
              <p className="mb-3 text-sm font-medium text-muted-foreground">Simple Breadcrumb</p>
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink href="#">Home</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbLink href="#">Projects</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Current Project</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>

            <div>
              <p className="mb-3 text-sm font-medium text-muted-foreground">With Icons</p>
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink href="#" className="flex items-center gap-1">
                      <Home className="size-3.5" />
                      Home
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator>
                    <ChevronRight className="size-3.5" />
                  </BreadcrumbSeparator>
                  <BreadcrumbItem>
                    <BreadcrumbLink href="#" className="flex items-center gap-1">
                      <Folder className="size-3.5" />
                      Documents
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator>
                    <ChevronRight className="size-3.5" />
                  </BreadcrumbSeparator>
                  <BreadcrumbItem>
                    <BreadcrumbLink href="#" className="flex items-center gap-1">
                      <Layers className="size-3.5" />
                      Projects
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator>
                    <ChevronRight className="size-3.5" />
                  </BreadcrumbSeparator>
                  <BreadcrumbItem>
                    <BreadcrumbPage className="flex items-center gap-1">
                      <FileText className="size-3.5" />
                      README.md
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>

            <div>
              <p className="mb-3 text-sm font-medium text-muted-foreground">Deep Navigation</p>
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink href="#">Dashboard</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbLink href="#">Settings</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbLink href="#">Security</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbLink href="#">Two-Factor Auth</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Setup</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs in Different Styles */}
      <Card>
        <CardHeader>
          <CardTitle>Tabs — Account Settings</CardTitle>
          <CardDescription>
            A realistic tabbed interface for managing account settings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="general">
            <TabsList>
              <TabsTrigger value="general" className="gap-1.5">
                <User className="size-3.5" />
                General
              </TabsTrigger>
              <TabsTrigger value="security" className="gap-1.5">
                <ShieldCheck className="size-3.5" />
                Security
              </TabsTrigger>
              <TabsTrigger value="integrations" className="gap-1.5">
                <Code className="size-3.5" />
                Integrations
              </TabsTrigger>
              <TabsTrigger value="advanced" className="gap-1.5">
                <Settings className="size-3.5" />
                Advanced
              </TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="mt-4">
              <div className="flex flex-col gap-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="tab-name">Display Name</Label>
                    <Input id="tab-name" defaultValue="John Doe" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="tab-email">Email</Label>
                    <Input id="tab-email" defaultValue="john@example.com" type="email" />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="tab-bio">Bio</Label>
                  <Input id="tab-bio" defaultValue="Full-stack developer passionate about UX." />
                </div>
                <div className="flex justify-end">
                  <Button>Save Changes</Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="security" className="mt-4">
              <div className="flex flex-col gap-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="tab-password">Current Password</Label>
                    <Input id="tab-password" type="password" placeholder="••••••••" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="tab-new-password">New Password</Label>
                    <Input id="tab-new-password" type="password" placeholder="••••••••" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox id="tab-2fa" />
                  <Label htmlFor="tab-2fa">Enable two-factor authentication</Label>
                </div>
                <div className="flex justify-end">
                  <Button>Update Security</Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="integrations" className="mt-4">
              <div className="flex flex-col gap-3">
                {[
                  {
                    name: 'GitHub',
                    status: 'Connected',
                    connected: true,
                  },
                  {
                    name: 'Slack',
                    status: 'Not connected',
                    connected: false,
                  },
                  {
                    name: 'Vercel',
                    status: 'Connected',
                    connected: true,
                  },
                  {
                    name: 'Linear',
                    status: 'Not connected',
                    connected: false,
                  },
                ].map((integration) => (
                  <div
                    key={integration.name}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex size-8 items-center justify-center rounded-md bg-muted text-sm font-bold">
                        {integration.name[0]}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{integration.name}</p>
                        <p className="text-xs text-muted-foreground">{integration.status}</p>
                      </div>
                    </div>
                    <Badge variant={integration.connected ? 'default' : 'outline'}>
                      {integration.connected ? 'Connected' : 'Connect'}
                    </Badge>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="advanced" className="mt-4">
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <Checkbox id="tab-debug" />
                  <Label htmlFor="tab-debug">Enable debug mode</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox id="tab-beta" defaultChecked />
                  <Label htmlFor="tab-beta">Opt in to beta features</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox id="tab-telemetry" defaultChecked />
                  <Label htmlFor="tab-telemetry">Send anonymous usage data</Label>
                </div>
                <Separator />
                <div>
                  <p className="text-sm font-medium text-destructive">Danger Zone</p>
                  <p className="mb-3 text-xs text-muted-foreground">
                    Irreversible actions that affect your account.
                  </p>
                  <Button variant="destructive">Delete Account</Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Menubar */}
      <Card>
        <CardHeader>
          <CardTitle>Menubar</CardTitle>
          <CardDescription>
            A horizontal menu bar with dropdown menus, submenus, and keyboard shortcuts — like a
            native app.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Menubar>
            <MenubarMenu>
              <MenubarTrigger>File</MenubarTrigger>
              <MenubarContent>
                <MenubarItem>
                  New Tab
                  <MenubarShortcut>⌘T</MenubarShortcut>
                </MenubarItem>
                <MenubarItem>
                  New Window
                  <MenubarShortcut>⌘N</MenubarShortcut>
                </MenubarItem>
                <MenubarItem disabled>New Incognito Window</MenubarItem>
                <MenubarSeparator />
                <MenubarSub>
                  <MenubarSubTrigger>Share</MenubarSubTrigger>
                  <MenubarSubContent>
                    <MenubarItem>Email link</MenubarItem>
                    <MenubarItem>Messages</MenubarItem>
                    <MenubarItem>Notes</MenubarItem>
                  </MenubarSubContent>
                </MenubarSub>
                <MenubarSeparator />
                <MenubarItem>
                  Print...
                  <MenubarShortcut>⌘P</MenubarShortcut>
                </MenubarItem>
              </MenubarContent>
            </MenubarMenu>
            <MenubarMenu>
              <MenubarTrigger>Edit</MenubarTrigger>
              <MenubarContent>
                <MenubarItem>
                  Undo
                  <MenubarShortcut>⌘Z</MenubarShortcut>
                </MenubarItem>
                <MenubarItem>
                  Redo
                  <MenubarShortcut>⇧⌘Z</MenubarShortcut>
                </MenubarItem>
                <MenubarSeparator />
                <MenubarItem>
                  Cut
                  <MenubarShortcut>⌘X</MenubarShortcut>
                </MenubarItem>
                <MenubarItem>
                  Copy
                  <MenubarShortcut>⌘C</MenubarShortcut>
                </MenubarItem>
                <MenubarItem>
                  Paste
                  <MenubarShortcut>⌘V</MenubarShortcut>
                </MenubarItem>
                <MenubarSeparator />
                <MenubarItem>
                  Select All
                  <MenubarShortcut>⌘A</MenubarShortcut>
                </MenubarItem>
              </MenubarContent>
            </MenubarMenu>
            <MenubarMenu>
              <MenubarTrigger>View</MenubarTrigger>
              <MenubarContent>
                <MenubarItem>
                  Zoom In
                  <MenubarShortcut>⌘+</MenubarShortcut>
                </MenubarItem>
                <MenubarItem>
                  Zoom Out
                  <MenubarShortcut>⌘-</MenubarShortcut>
                </MenubarItem>
                <MenubarSeparator />
                <MenubarItem>Toggle Fullscreen</MenubarItem>
                <MenubarItem>Toggle Sidebar</MenubarItem>
              </MenubarContent>
            </MenubarMenu>
            <MenubarMenu>
              <MenubarTrigger>Help</MenubarTrigger>
              <MenubarContent>
                <MenubarItem>Documentation</MenubarItem>
                <MenubarItem>Release Notes</MenubarItem>
                <MenubarSeparator />
                <MenubarItem>About</MenubarItem>
              </MenubarContent>
            </MenubarMenu>
          </Menubar>
        </CardContent>
      </Card>

      {/* Another Tabs Style - Dashboard Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Tabs — Dashboard View</CardTitle>
          <CardDescription>
            Tabs with icons used as a dashboard-style view switcher.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview" className="gap-1.5">
                <LayoutDashboard className="size-3.5" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="projects" className="gap-1.5">
                <Folder className="size-3.5" />
                Projects
              </TabsTrigger>
              <TabsTrigger value="docs" className="gap-1.5">
                <FileText className="size-3.5" />
                Docs
              </TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="mt-4">
              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  { label: 'Total Projects', value: '24' },
                  { label: 'Active', value: '18' },
                  { label: 'Completed', value: '6' },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-lg border p-4 text-center">
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                ))}
              </div>
            </TabsContent>
            <TabsContent value="projects" className="mt-4">
              <div className="flex flex-col gap-2">
                {['Project Alpha', 'Project Beta', 'Project Gamma'].map((name) => (
                  <div
                    key={name}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <span className="text-sm font-medium">{name}</span>
                    <Badge variant="secondary">In Progress</Badge>
                  </div>
                ))}
              </div>
            </TabsContent>
            <TabsContent value="docs" className="mt-4">
              <p className="text-sm text-muted-foreground">
                Documentation files will appear here. Start by creating a new document or importing
                from your repository.
              </p>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Label Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Labels</CardTitle>
          <CardDescription>
            Labels provide accessible text descriptions for form controls.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="label-name">Full Name</Label>
              <Input id="label-name" placeholder="John Doe" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="label-email">Email Address</Label>
              <Input id="label-email" type="email" placeholder="john@example.com" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="label-phone">Phone Number</Label>
              <Input id="label-phone" type="tel" placeholder="+1 (555) 000-0000" />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="label-agree" />
              <Label htmlFor="label-agree">I agree to the terms of service</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="label-remember" defaultChecked />
              <Label htmlFor="label-remember">Remember my preferences</Label>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="label-disabled" className="text-muted-foreground">
                Disabled Field
              </Label>
              <Input id="label-disabled" disabled placeholder="Cannot edit" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
