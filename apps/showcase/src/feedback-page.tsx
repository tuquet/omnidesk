import { useState } from 'react';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
  Input,
  Label,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
  Separator,
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@omnidesk/ui';
import { toast } from 'sonner';
import {
  AlertCircle,
  Bell,
  CheckCircle,
  Cloud,
  CreditCard,
  Info,
  Keyboard,
  LifeBuoy,
  LogOut,
  Mail,
  MessageSquare,
  Minus,
  PanelRight,
  Plus,
  PlusCircle,
  Settings,
  User,
  UserPlus,
  Users,
} from 'lucide-react';

export function FeedbackShowcase() {
  const [goal, setGoal] = useState(5);

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Feedback &amp; Overlays</h1>
        <p className="text-muted-foreground">
          Toasts, menus, sheets, drawers, selects, and tabs for user interaction.
        </p>
      </div>

      <Separator />

      {/* Toast Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Toast Notifications</CardTitle>
          <CardDescription>
            Click any button to trigger a toast notification with different styles.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={() =>
                toast.success('Changes saved successfully!', {
                  description: 'Your profile has been updated.',
                })
              }
            >
              <CheckCircle />
              Success Toast
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                toast.error('Something went wrong', {
                  description: 'Please try again later.',
                })
              }
            >
              <AlertCircle />
              Error Toast
            </Button>
            <Button
              variant="secondary"
              onClick={() =>
                toast.warning('Storage almost full', {
                  description: 'You have used 90% of your storage.',
                })
              }
            >
              <AlertCircle />
              Warning Toast
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                toast.info('New feature available', {
                  description: 'Check out the new dashboard widgets.',
                })
              }
            >
              <Info />
              Info Toast
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                const promise = new Promise((resolve) => setTimeout(resolve, 2000));
                toast.promise(promise, {
                  loading: 'Uploading file...',
                  success: 'File uploaded successfully!',
                  error: 'Upload failed.',
                });
              }}
            >
              <Cloud />
              Promise Toast
            </Button>
            <Button
              variant="ghost"
              onClick={() =>
                toast('Event has been created', {
                  description: 'Monday, January 3rd at 6:00 PM',
                  action: {
                    label: 'Undo',
                    onClick: () => toast('Event undone'),
                  },
                })
              }
            >
              <Bell />
              Toast with Action
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* DropdownMenu */}
      <Card>
        <CardHeader>
          <CardTitle>Dropdown Menus</CardTitle>
          <CardDescription>
            Contextual menus with icons, groups, separators, and keyboard shortcuts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <User />
                  My Account
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem>
                    <User />
                    Profile
                    <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <CreditCard />
                    Billing
                    <DropdownMenuShortcut>⌘B</DropdownMenuShortcut>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings />
                    Settings
                    <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Keyboard />
                    Keyboard shortcuts
                    <DropdownMenuShortcut>⌘K</DropdownMenuShortcut>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem>
                    <Users />
                    Team
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <UserPlus />
                    Invite users
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <PlusCircle />
                    New Team
                    <DropdownMenuShortcut>⌘+T</DropdownMenuShortcut>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <LifeBuoy />
                  Support
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Cloud />
                  API
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <LogOut />
                  Log out
                  <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Settings />
                  Quick Actions
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48">
                <DropdownMenuItem>
                  <Mail />
                  Compose Email
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <MessageSquare />
                  New Message
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <PlusCircle />
                  Create Project
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Settings />
                  Preferences
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      {/* Sheet (Slide-in Panel) */}
      <Card>
        <CardHeader>
          <CardTitle>Sheet (Slide-in Panel)</CardTitle>
          <CardDescription>
            Panels that slide in from the edge of the screen for secondary content.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-3">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline">
                  <PanelRight />
                  Open from Right
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <SheetHeader>
                  <SheetTitle>Edit Profile</SheetTitle>
                  <SheetDescription>
                    Make changes to your profile here. Click save when you&apos;re done.
                  </SheetDescription>
                </SheetHeader>
                <div className="flex flex-col gap-4 px-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="sheet-name">Name</Label>
                    <Input id="sheet-name" placeholder="John Doe" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="sheet-email">Email</Label>
                    <Input id="sheet-email" placeholder="john@example.com" type="email" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="sheet-bio">Bio</Label>
                    <Input id="sheet-bio" placeholder="Tell us about yourself" />
                  </div>
                </div>
                <SheetFooter>
                  <SheetClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </SheetClose>
                  <Button>Save Changes</Button>
                </SheetFooter>
              </SheetContent>
            </Sheet>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline">Open from Left</Button>
              </SheetTrigger>
              <SheetContent side="left">
                <SheetHeader>
                  <SheetTitle>Navigation</SheetTitle>
                  <SheetDescription>A slide-in panel from the left side.</SheetDescription>
                </SheetHeader>
                <div className="flex flex-col gap-2 px-4">
                  {['Dashboard', 'Projects', 'Team', 'Settings'].map((item) => (
                    <Button key={item} variant="ghost" className="justify-start">
                      {item}
                    </Button>
                  ))}
                </div>
              </SheetContent>
            </Sheet>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline">Open from Top</Button>
              </SheetTrigger>
              <SheetContent side="top">
                <SheetHeader>
                  <SheetTitle>Announcement</SheetTitle>
                  <SheetDescription>
                    This sheet slides in from the top of the screen.
                  </SheetDescription>
                </SheetHeader>
              </SheetContent>
            </Sheet>
          </div>
        </CardContent>
      </Card>

      {/* Drawer */}
      <Card>
        <CardHeader>
          <CardTitle>Drawer</CardTitle>
          <CardDescription>
            A mobile-friendly bottom sheet drawer with drag-to-close interaction.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-3">
            <Drawer>
              <DrawerTrigger asChild>
                <Button variant="outline">Open Drawer</Button>
              </DrawerTrigger>
              <DrawerContent>
                <div className="mx-auto w-full max-w-sm">
                  <DrawerHeader>
                    <DrawerTitle>Move Goal</DrawerTitle>
                    <DrawerDescription>Set your daily activity goal.</DrawerDescription>
                  </DrawerHeader>
                  <div className="flex items-center justify-center gap-4 p-4">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setGoal(Math.max(1, goal - 1))}
                    >
                      <Minus />
                    </Button>
                    <div className="text-center">
                      <div className="text-5xl font-bold tracking-tighter">{goal}</div>
                      <div className="text-sm text-muted-foreground">Goals/day</div>
                    </div>
                    <Button variant="outline" size="icon" onClick={() => setGoal(goal + 1)}>
                      <Plus />
                    </Button>
                  </div>
                  <DrawerFooter>
                    <Button>Submit</Button>
                    <DrawerClose asChild>
                      <Button variant="outline">Cancel</Button>
                    </DrawerClose>
                  </DrawerFooter>
                </div>
              </DrawerContent>
            </Drawer>
          </div>
        </CardContent>
      </Card>

      {/* Select */}
      <Card>
        <CardHeader>
          <CardTitle>Select Dropdowns</CardTitle>
          <CardDescription>Dropdown selects for choosing from a list of options.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex flex-col gap-2">
              <Label>Framework</Label>
              <Select>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a framework" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Frameworks</SelectLabel>
                    <SelectItem value="react">React</SelectItem>
                    <SelectItem value="vue">Vue</SelectItem>
                    <SelectItem value="angular">Angular</SelectItem>
                    <SelectItem value="svelte">Svelte</SelectItem>
                    <SelectItem value="solid">SolidJS</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Timezone</Label>
              <Select>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>North America</SelectLabel>
                    <SelectItem value="est">Eastern Time (EST)</SelectItem>
                    <SelectItem value="cst">Central Time (CST)</SelectItem>
                    <SelectItem value="pst">Pacific Time (PST)</SelectItem>
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel>Europe</SelectLabel>
                    <SelectItem value="gmt">GMT (London)</SelectItem>
                    <SelectItem value="cet">CET (Berlin)</SelectItem>
                    <SelectItem value="eet">EET (Helsinki)</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Priority</Label>
              <Select defaultValue="medium">
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">🟢 Low</SelectItem>
                  <SelectItem value="medium">🟡 Medium</SelectItem>
                  <SelectItem value="high">🟠 High</SelectItem>
                  <SelectItem value="critical">🔴 Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Tabs</CardTitle>
          <CardDescription>Organize content into switchable tabbed sections.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-8">
            <div>
              <p className="mb-3 text-sm font-medium text-muted-foreground">Default Tabs</p>
              <Tabs defaultValue="overview">
                <TabsList>
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="analytics">Analytics</TabsTrigger>
                  <TabsTrigger value="reports">Reports</TabsTrigger>
                  <TabsTrigger value="notifications">Notifications</TabsTrigger>
                </TabsList>
                <TabsContent value="overview" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Overview</CardTitle>
                      <CardDescription>
                        A high-level summary of your project metrics and recent activity.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Your project is on track. 12 tasks completed this week, 3 pending review.
                      </p>
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="analytics" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Analytics</CardTitle>
                      <CardDescription>
                        Performance metrics and user engagement data.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Page views increased by 23% this week. Bounce rate decreased to 34%.
                      </p>
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="reports" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Reports</CardTitle>
                      <CardDescription>Generated reports and exportable data.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        3 reports generated this month. Last export: 2 days ago.
                      </p>
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="notifications" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Notifications</CardTitle>
                      <CardDescription>Manage your notification preferences.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        You have 5 unread notifications. Email alerts are enabled.
                      </p>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
