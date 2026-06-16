import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Separator,
  Skeleton,
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@omnidesk/ui';
import {
  ArrowUpRight,
  CircleCheck,
  Clock,
  CreditCard,
  HelpCircle,
  Info,
  Settings,
  TrendingUp,
  Users,
} from 'lucide-react';
import { teamMembers, statusBadgeVariant } from './api/mock-cards';

export function CardsShowcase() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Cards &amp; Data Display</h1>
        <p className="text-muted-foreground">
          Cards, badges, avatars, tables, and more for presenting data beautifully.
        </p>
      </div>

      <Separator />

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription>Total Revenue</CardDescription>
            <CreditCard className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$45,231.89</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-muted-foreground">+20.1%</span> from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription>Subscriptions</CardDescription>
            <Users className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+2,350</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-muted-foreground">+180.1%</span> from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription>Active Users</CardDescription>
            <TrendingUp className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+12,234</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-muted-foreground">+19%</span> from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription>Uptime</CardDescription>
            <CircleCheck className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">99.98%</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-muted-foreground">+0.02%</span> from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Card with Form */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Card with Form</CardTitle>
            <CardDescription>Cards can contain forms for inline data entry.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="project-name">Project Name</Label>
                <Input id="project-name" placeholder="My awesome project" />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="description">Description</Label>
                <Input id="description" placeholder="A brief description..." />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between border-t px-6 py-4">
            <Button variant="ghost">Cancel</Button>
            <Button>Save</Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>A card showing a list of recent events.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              {[
                {
                  action: 'Deployed to production',
                  time: '2 minutes ago',
                  icon: ArrowUpRight,
                },
                {
                  action: 'Updated user permissions',
                  time: '1 hour ago',
                  icon: Settings,
                },
                {
                  action: 'New team member added',
                  time: '3 hours ago',
                  icon: Users,
                },
                {
                  action: 'Database backup completed',
                  time: '5 hours ago',
                  icon: CircleCheck,
                },
              ].map((item) => (
                <div key={item.action} className="flex items-center gap-3">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-muted">
                    <item.icon className="size-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{item.action}</p>
                    <p className="text-xs text-muted-foreground">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Badge Variants */}
      <Card>
        <CardHeader>
          <CardTitle>Badge Variants</CardTitle>
          <CardDescription>Badges for statuses, labels, and categorization.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-6">
            <div>
              <p className="mb-3 text-sm font-medium text-muted-foreground">Variants</p>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="default">Default</Badge>
                <Badge variant="secondary">Secondary</Badge>
                <Badge variant="destructive">Destructive</Badge>
                <Badge variant="outline">Outline</Badge>
              </div>
            </div>
            <div>
              <p className="mb-3 text-sm font-medium text-muted-foreground">Use Cases</p>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="default">
                  <CircleCheck className="size-3" />
                  Active
                </Badge>
                <Badge variant="secondary">
                  <Clock className="size-3" />
                  Pending
                </Badge>
                <Badge variant="destructive">
                  <Info className="size-3" />
                  Error
                </Badge>
                <Badge variant="outline">v2.1.0</Badge>
                <Badge variant="default">New</Badge>
                <Badge variant="secondary">Beta</Badge>
                <Badge variant="outline">Pro</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Avatar Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Avatars</CardTitle>
          <CardDescription>
            User avatars with image sources, fallback initials, and various sizes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-6">
            <div>
              <p className="mb-3 text-sm font-medium text-muted-foreground">
                With Fallback Initials
              </p>
              <div className="flex items-center gap-3">
                <Avatar className="size-8">
                  <AvatarFallback>OM</AvatarFallback>
                </Avatar>
                <Avatar className="size-10">
                  <AvatarFallback>JL</AvatarFallback>
                </Avatar>
                <Avatar className="size-12">
                  <AvatarFallback>IN</AvatarFallback>
                </Avatar>
                <Avatar className="size-14">
                  <AvatarFallback>WK</AvatarFallback>
                </Avatar>
                <Avatar className="size-16">
                  <AvatarFallback>SD</AvatarFallback>
                </Avatar>
              </div>
            </div>
            <div>
              <p className="mb-3 text-sm font-medium text-muted-foreground">With Images</p>
              <div className="flex items-center gap-3">
                <Avatar className="size-10">
                  <AvatarImage
                    src="https://api.dicebear.com/9.x/initials/svg?seed=OM"
                    alt="Olivia"
                  />
                  <AvatarFallback>OM</AvatarFallback>
                </Avatar>
                <Avatar className="size-10">
                  <AvatarImage
                    src="https://api.dicebear.com/9.x/initials/svg?seed=JL"
                    alt="Jackson"
                  />
                  <AvatarFallback>JL</AvatarFallback>
                </Avatar>
                <Avatar className="size-10">
                  <AvatarImage
                    src="https://api.dicebear.com/9.x/initials/svg?seed=IN"
                    alt="Isabella"
                  />
                  <AvatarFallback>IN</AvatarFallback>
                </Avatar>
                <Avatar className="size-10">
                  <AvatarImage
                    src="https://api.dicebear.com/9.x/initials/svg?seed=WK"
                    alt="William"
                  />
                  <AvatarFallback>WK</AvatarFallback>
                </Avatar>
              </div>
            </div>
            <div>
              <p className="mb-3 text-sm font-medium text-muted-foreground">Stacked Avatars</p>
              <div className="flex -space-x-3">
                {['OM', 'JL', 'IN', 'WK', 'SD'].map((initials) => (
                  <Avatar key={initials} className="size-10 border-2 border-background">
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                ))}
                <div className="flex size-10 items-center justify-center rounded-full border-2 border-background bg-muted text-xs font-medium">
                  +3
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Skeleton Loading */}
      <Card>
        <CardHeader>
          <CardTitle>Skeleton Loading</CardTitle>
          <CardDescription>Placeholder shimmer effects for loading states.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="flex flex-col gap-4">
              <p className="text-sm font-medium text-muted-foreground">Card Skeleton</p>
              <div className="flex flex-col gap-3">
                <Skeleton className="h-32 w-full rounded-lg" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
            <div className="flex flex-col gap-4">
              <p className="text-sm font-medium text-muted-foreground">User List Skeleton</p>
              <div className="flex flex-col gap-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="size-10 rounded-full" />
                    <div className="flex flex-1 flex-col gap-1.5">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tooltip Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Tooltips</CardTitle>
          <CardDescription>Hover over elements to reveal additional context.</CardDescription>
        </CardHeader>
        <CardContent>
          <TooltipProvider>
            <div className="flex flex-wrap items-center gap-3">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline">
                    <Settings />
                    Settings
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Manage your account settings</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon">
                    <HelpCircle />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Need help? Click for docs</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Info />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>Tooltip on the bottom</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="secondary" className="cursor-default">
                    Hover me
                  </Badge>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Tooltips work on any element</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Data Table</CardTitle>
          <CardDescription>A structured table displaying team member information.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableCaption>A list of team members and their roles.</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60px]">Avatar</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teamMembers.map((member) => (
                <TableRow key={member.email}>
                  <TableCell>
                    <Avatar className="size-8">
                      <AvatarFallback className="text-xs">{member.avatar}</AvatarFallback>
                    </Avatar>
                  </TableCell>
                  <TableCell className="font-medium">{member.name}</TableCell>
                  <TableCell className="text-muted-foreground">{member.email}</TableCell>
                  <TableCell>{member.role}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant={statusBadgeVariant(member.status)}>{member.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Separator Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Separators</CardTitle>
          <CardDescription>Visual dividers for grouping content sections.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-sm font-medium">Horizontal Separator</p>
              <p className="text-sm text-muted-foreground">Content above the line.</p>
            </div>
            <Separator />
            <div>
              <p className="text-sm font-medium">Section Two</p>
              <p className="text-sm text-muted-foreground">Content below the first separator.</p>
            </div>
            <Separator />
            <div>
              <p className="mb-3 text-sm font-medium">Vertical Separators</p>
              <div className="flex h-6 items-center gap-4">
                <span className="text-sm">Home</span>
                <Separator orientation="vertical" />
                <span className="text-sm">Blog</span>
                <Separator orientation="vertical" />
                <span className="text-sm">Docs</span>
                <Separator orientation="vertical" />
                <span className="text-sm">Contact</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
