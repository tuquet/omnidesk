import { useState } from 'react';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Checkbox,
  Toggle,
  ToggleGroup,
  ToggleGroupItem,
  Separator,
} from '@kbm/ui';
import {
  ArrowRight,
  Download,
  Heart,
  Loader2,
  Mail,
  Plus,
  Search,
  Send,
  Settings,
  Share2,
  Trash2,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Star,
  Bookmark,
  Bell,
} from 'lucide-react';

export function ButtonsShowcase() {
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  const simulateLoading = (key: string) => {
    setLoading((prev) => ({ ...prev, [key]: true }));
    setTimeout(() => setLoading((prev) => ({ ...prev, [key]: false })), 2000);
  };

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Buttons &amp; Inputs</h1>
        <p className="text-muted-foreground">
          Interactive form controls, toggles, and input components.
        </p>
      </div>

      <Separator />

      {/* Button Variants */}
      <Card>
        <CardHeader>
          <CardTitle>Button Variants</CardTitle>
          <CardDescription>
            Six distinct button styles for different contexts and visual hierarchy.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="default">Default</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="link">Link</Button>
          </div>
        </CardContent>
      </Card>

      {/* Button Sizes */}
      <Card>
        <CardHeader>
          <CardTitle>Button Sizes</CardTitle>
          <CardDescription>
            Buttons come in multiple sizes to fit any layout context.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col items-center gap-2">
              <Button size="sm">Small</Button>
              <span className="text-xs text-muted-foreground">sm</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Button size="default">Default</Button>
              <span className="text-xs text-muted-foreground">default</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Button size="lg">Large</Button>
              <span className="text-xs text-muted-foreground">lg</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Button size="icon">
                <Plus />
              </Button>
              <span className="text-xs text-muted-foreground">icon</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Button size="icon-sm">
                <Plus />
              </Button>
              <span className="text-xs text-muted-foreground">icon-sm</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Button size="icon-lg">
                <Plus />
              </Button>
              <span className="text-xs text-muted-foreground">icon-lg</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Buttons with Icons */}
      <Card>
        <CardHeader>
          <CardTitle>Buttons with Icons</CardTitle>
          <CardDescription>
            Combine icons with text for clear, actionable buttons.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-3">
            <Button>
              <Mail />
              Login with Email
            </Button>
            <Button variant="secondary">
              <Download />
              Download
            </Button>
            <Button variant="outline">
              <Settings />
              Settings
            </Button>
            <Button variant="destructive">
              <Trash2 />
              Delete
            </Button>
            <Button variant="ghost">
              <Share2 />
              Share
            </Button>
            <Button>
              Next
              <ArrowRight />
            </Button>
            <Button variant="outline">
              <Heart />
              Favorite
            </Button>
            <Button variant="secondary">
              <Send />
              Send Message
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Loading States */}
      <Card>
        <CardHeader>
          <CardTitle>Loading States</CardTitle>
          <CardDescription>
            Click any button to see its loading state with a spinner animation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              disabled={loading['save']}
              onClick={() => simulateLoading('save')}
            >
              {loading['save'] && <Loader2 className="animate-spin" />}
              {loading['save'] ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button
              variant="secondary"
              disabled={loading['upload']}
              onClick={() => simulateLoading('upload')}
            >
              {loading['upload'] && <Loader2 className="animate-spin" />}
              {loading['upload'] ? 'Uploading...' : 'Upload File'}
            </Button>
            <Button
              variant="outline"
              disabled={loading['sync']}
              onClick={() => simulateLoading('sync')}
            >
              {loading['sync'] && <Loader2 className="animate-spin" />}
              {loading['sync'] ? 'Syncing...' : 'Sync Data'}
            </Button>
            <Button
              variant="destructive"
              disabled={loading['delete']}
              onClick={() => simulateLoading('delete')}
            >
              {loading['delete'] && <Loader2 className="animate-spin" />}
              {loading['delete'] ? 'Deleting...' : 'Delete Item'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Input Variants */}
      <Card>
        <CardHeader>
          <CardTitle>Input Variants</CardTitle>
          <CardDescription>
            Text inputs with labels, placeholders, icons, and disabled states.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="default-input">Default Input</Label>
              <Input id="default-input" placeholder="Enter text..." />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="email-input">Email</Label>
              <Input
                id="email-input"
                type="email"
                placeholder="name@example.com"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password-input">Password</Label>
              <Input
                id="password-input"
                type="password"
                placeholder="Enter password"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="disabled-input">Disabled</Label>
              <Input
                id="disabled-input"
                disabled
                placeholder="Cannot edit"
                value="Disabled value"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="search-input">Search with Icon</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="search-input"
                  className="pl-8"
                  placeholder="Search..."
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="file-input">File Upload</Label>
              <Input id="file-input" type="file" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Checkbox Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Checkbox</CardTitle>
          <CardDescription>
            Checkboxes for boolean selections and multi-choice forms.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex items-center gap-2">
              <Checkbox id="terms" />
              <Label htmlFor="terms">Accept terms and conditions</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="newsletter" defaultChecked />
              <Label htmlFor="newsletter">Subscribe to newsletter</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="disabled-check" disabled />
              <Label htmlFor="disabled-check" className="text-muted-foreground">
                Disabled checkbox
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="notifications" />
              <Label htmlFor="notifications">Enable notifications</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="marketing" />
              <Label htmlFor="marketing">Marketing emails</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="analytics" defaultChecked />
              <Label htmlFor="analytics">Usage analytics</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Toggle Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Toggle</CardTitle>
          <CardDescription>
            Toggle buttons for on/off states with default and outline variants.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-6">
            <div>
              <p className="mb-3 text-sm font-medium text-muted-foreground">
                Default Variant
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <Toggle aria-label="Toggle bold">
                  <Bold />
                </Toggle>
                <Toggle aria-label="Toggle italic">
                  <Italic />
                </Toggle>
                <Toggle aria-label="Toggle underline">
                  <Underline />
                </Toggle>
                <Toggle aria-label="Toggle star">
                  <Star />
                </Toggle>
                <Toggle aria-label="Toggle bookmark">
                  <Bookmark />
                </Toggle>
                <Toggle aria-label="Toggle notifications">
                  <Bell />
                </Toggle>
              </div>
            </div>
            <div>
              <p className="mb-3 text-sm font-medium text-muted-foreground">
                Outline Variant
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <Toggle variant="outline" aria-label="Toggle bold">
                  <Bold />
                  Bold
                </Toggle>
                <Toggle variant="outline" aria-label="Toggle italic">
                  <Italic />
                  Italic
                </Toggle>
                <Toggle variant="outline" aria-label="Toggle underline">
                  <Underline />
                  Underline
                </Toggle>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ToggleGroup Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Toggle Group</CardTitle>
          <CardDescription>
            Groups of toggles that allow single or multiple selection.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-6">
            <div>
              <p className="mb-3 text-sm font-medium text-muted-foreground">
                Single Selection — Text Alignment
              </p>
              <ToggleGroup type="single" defaultValue="left">
                <ToggleGroupItem value="left" aria-label="Align left">
                  <AlignLeft />
                </ToggleGroupItem>
                <ToggleGroupItem value="center" aria-label="Align center">
                  <AlignCenter />
                </ToggleGroupItem>
                <ToggleGroupItem value="right" aria-label="Align right">
                  <AlignRight />
                </ToggleGroupItem>
                <ToggleGroupItem value="justify" aria-label="Justify">
                  <AlignJustify />
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
            <div>
              <p className="mb-3 text-sm font-medium text-muted-foreground">
                Multiple Selection — Text Formatting
              </p>
              <ToggleGroup type="multiple">
                <ToggleGroupItem value="bold" aria-label="Toggle bold">
                  <Bold />
                </ToggleGroupItem>
                <ToggleGroupItem value="italic" aria-label="Toggle italic">
                  <Italic />
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="underline"
                  aria-label="Toggle underline"
                >
                  <Underline />
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
            <div>
              <p className="mb-3 text-sm font-medium text-muted-foreground">
                Outline Variant — No Spacing
              </p>
              <ToggleGroup
                type="single"
                variant="outline"
                spacing={0}
                defaultValue="center"
              >
                <ToggleGroupItem value="left" aria-label="Align left">
                  <AlignLeft />
                </ToggleGroupItem>
                <ToggleGroupItem value="center" aria-label="Align center">
                  <AlignCenter />
                </ToggleGroupItem>
                <ToggleGroupItem value="right" aria-label="Align right">
                  <AlignRight />
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
