import { Label } from '@omnidesk/ui';
import { Input } from '@omnidesk/ui';
import { Checkbox, ScrollArea } from '@omnidesk/ui';

import { Button } from '@omnidesk/ui';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@omnidesk/ui';
import { Trash2, ChevronDown, Plus } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@omnidesk/ui';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@omnidesk/ui';

import type { WorkflowTrigger } from '@omnidesk/types';
interface WorkflowTriggersEditorProps {
  value: WorkflowTrigger[];
  onChange: (value: WorkflowTrigger[]) => void;
}

const TRIGGER_TYPES = [
  { id: 'interval', label: 'Interval' },
  { id: 'cron-job', label: 'Cron Job' },
  { id: 'context-menu', label: 'Context Menu' },
  { id: 'date', label: 'Specific Date' },
  { id: 'specific-day', label: 'Specific Day' },
  { id: 'on-startup', label: 'On Startup' },
  { id: 'visit-web', label: 'Visit Web' },
  { id: 'keyboard-shortcut', label: 'Keyboard Shortcut' },
];

export function WorkflowTriggersEditor({ value = [], onChange }: WorkflowTriggersEditorProps) {
  
  const addTrigger = (type: string) => {
    // Only one context-menu or on-startup allowed
    if (['context-menu', 'on-startup'].includes(type)) {
      if (value.some(t => t.type === type)) return;
    }

    const newTrigger: WorkflowTrigger = {
      id: Math.random().toString(36).substring(2, 7),
      type,
      data: getDefaultDataForTrigger(type),
    };
    
    onChange([...value, newTrigger]);
  };

  const removeTrigger = (index: number) => {
    const newTriggers = [...value];
    newTriggers.splice(index, 1);
    onChange(newTriggers);
  };

  const updateTriggerData = (index: number, dataUpdates: any) => {
    const newTriggers = [...value];
    newTriggers[index] = {
      ...newTriggers[index],
      data: { ...(newTriggers[index]?.data as any), ...dataUpdates }
    } as WorkflowTrigger;
    onChange(newTriggers);
  };

  return (
    <div className="w-full flex flex-col gap-4">
      <ScrollArea className="flex flex-col gap-2 max-h-[500px] pr-2">
        {value.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-8 border rounded-md border-dashed">
            No triggers configured. Add one below.
          </div>
        ) : (
          value.map((trigger, index) => {
            const triggerConfig = TRIGGER_TYPES.find(t => t.id === trigger.type);
            return (
              <Collapsible key={trigger.id} className="border rounded-md bg-card">
                <div className="flex items-center justify-between p-3 border-b">
                  <CollapsibleTrigger className="flex-1 flex items-center gap-2 text-sm font-medium hover:text-primary">
                    <ChevronDown className="h-4 w-4" />
                    {triggerConfig?.label || trigger.type}
                  </CollapsibleTrigger>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => removeTrigger(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <CollapsibleContent className="p-3">
                  <TriggerForm 
                    type={trigger.type} 
                    data={trigger.data} 
                    onChange={(data) => updateTriggerData(index, data)} 
                  />
                </CollapsibleContent>
              </Collapsible>
            );
          })
        )}
      </ScrollArea>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full sm:w-auto gap-2">
            <Plus className="h-4 w-4" />
            Add Trigger
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search triggers..." />
            <CommandList>
              <CommandEmpty>No trigger found.</CommandEmpty>
              <CommandGroup>
                {TRIGGER_TYPES.map((type) => (
                  <CommandItem
                    key={type.id}
                    value={type.id}
                    onSelect={() => addTrigger(type.id)}
                  >
                    {type.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}

function getDefaultDataForTrigger(type: string) {
  switch (type) {
    case 'interval': return { interval: 60, delay: 5, fixedDelay: false };
    case 'cron-job': return { expression: '' };
    case 'context-menu': return { contextMenuName: '', contextTypes: [] };
    case 'date': return { date: '' };
    case 'specific-day': return { days: [], time: '00:00' };
    case 'visit-web': return { url: '', isUrlRegex: false, supportSPA: false };
    case 'keyboard-shortcut': return { shortcut: '' };
    case 'on-startup': return null;
    default: return {};
  }
}



// Temporary placeholder for sub-forms
function TriggerForm({ type, data, onChange }: { type: string, data: any, onChange: (data: any) => void }) {
  if (type === 'interval') {
    return (
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-1.5">
            <Label>Interval (minutes)</Label>
            <Input 
              type="number" 
              value={data.interval} 
              onChange={(e) => onChange({ interval: Number(e.target.value) })} 
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Delay (seconds)</Label>
            <Input 
              type="number" 
              value={data.delay} 
              onChange={(e) => onChange({ delay: Number(e.target.value) })} 
            />
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox 
            id={`fixed-delay-${Math.random()}`}
            checked={data.fixedDelay}
            onCheckedChange={(c) => onChange({ fixedDelay: !!c })}
          />
          <Label htmlFor="fixed-delay">Fixed Delay</Label>
        </div>
      </div>
    );
  }
  
  if (type === 'cron-job') {
    return (
      <div className="flex flex-col gap-1.5">
        <Label>Cron Expression</Label>
        <Input 
          value={data.expression} 
          onChange={(e) => onChange({ expression: e.target.value })} 
          placeholder="* * * * *"
        />
        <p className="text-xs text-muted-foreground mt-1">E.g., "0 0 * * *" to run every day at midnight.</p>
      </div>
    );
  }

  if (type === 'context-menu') {
    return (
      <div className="flex flex-col gap-1.5">
        <Label>Context Menu Name</Label>
        <Input 
          value={data.contextMenuName} 
          onChange={(e) => onChange({ contextMenuName: e.target.value })} 
          placeholder="My Custom Action"
        />
      </div>
    );
  }

  if (type === 'date') {
    return (
      <div className="flex flex-col gap-1.5">
        <Label>Specific Date</Label>
        <Input 
          type="datetime-local"
          value={data.date} 
          onChange={(e) => onChange({ date: e.target.value })} 
        />
      </div>
    );
  }

  if (type === 'visit-web') {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label>URL</Label>
          <Input 
            value={data.url} 
            onChange={(e) => onChange({ url: e.target.value })} 
            placeholder="https://example.com/*"
          />
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex items-center space-x-2">
            <Checkbox 
              checked={data.isUrlRegex}
              onCheckedChange={(c) => onChange({ isUrlRegex: !!c })}
            />
            <Label>URL is Regex</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox 
              checked={data.supportSPA}
              onCheckedChange={(c) => onChange({ supportSPA: !!c })}
            />
            <Label>Support SPA (Single Page Application)</Label>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'keyboard-shortcut') {
    return (
      <div className="flex flex-col gap-1.5">
        <Label>Shortcut</Label>
        <Input 
          value={data.shortcut} 
          onChange={(e) => onChange({ shortcut: e.target.value })} 
          placeholder="Ctrl+Shift+A"
        />
      </div>
    );
  }

  if (type === 'on-startup') {
    return (
      <div className="text-sm text-muted-foreground p-2">
        This workflow will run when the extension/app starts.
      </div>
    );
  }

  return (
    <div className="text-sm text-muted-foreground p-3 bg-muted/30 rounded-md border border-dashed">
      Trigger configuration for <strong>{type}</strong> is not fully implemented yet.
      <pre className="mt-2 text-xs">{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
