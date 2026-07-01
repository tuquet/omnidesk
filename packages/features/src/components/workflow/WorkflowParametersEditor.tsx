
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import { Button } from '@omnidesk/ui';
import { Input } from '@omnidesk/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@omnidesk/ui';
import { Checkbox } from '@omnidesk/ui';
import { Textarea } from '@omnidesk/ui';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@omnidesk/ui';
import { Plus, Trash2, GripVertical, ChevronDown } from 'lucide-react';
import type { WorkflowParameter } from '@omnidesk/types';
import { Label } from '@omnidesk/ui';

interface WorkflowParametersEditorProps {
  value: WorkflowParameter[];
  onChange: (value: WorkflowParameter[]) => void;
}

export function WorkflowParametersEditor({ value = [], onChange }: WorkflowParametersEditorProps) {
  const paramTypes = [
    { id: 'string', name: 'Input (string)' },
    { id: 'number', name: 'Input (number)' },
    { id: 'json', name: 'Input (JSON)' },
    { id: 'checkbox', name: 'Checkbox' },
  ];

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    
    const items = Array.from(value);
    const reorderedItem = items.splice(result.source.index, 1)[0];
    if (reorderedItem) {
      items.splice(result.destination.index, 0, reorderedItem);
    }
    
    onChange(items);
  };

  const updateParam = (index: number, updates: Partial<WorkflowParameter>) => {
    const newParams = [...value];
    newParams[index] = { ...newParams[index], ...updates } as WorkflowParameter;
    onChange(newParams);
  };

  const addParameter = () => {
    const newParam: WorkflowParameter = {
      id: Math.random().toString(36).substring(2, 7),
      name: 'param',
      type: 'string',
      description: '',
      defaultValue: '',
      placeholder: 'Text',
      data: { required: false } as any,
    };
    onChange([...value, newParam]);
  };

  const removeParameter = (index: number) => {
    const newParams = [...value];
    newParams.splice(index, 1);
    onChange(newParams);
  };

  return (
    <div className="w-full space-y-4">
      {value.length === 0 ? (
        <div className="text-center text-sm text-muted-foreground py-4 border rounded-md border-dashed">
          No parameters
        </div>
      ) : (
        <div className="border rounded-md">
          <div className="grid grid-cols-12 gap-2 p-3 text-sm font-medium border-b bg-muted/50">
            <div className="col-span-3 pl-8">Name</div>
            <div className="col-span-3">Type</div>
            <div className="col-span-3">Placeholder</div>
            <div className="col-span-3">Default Value</div>
          </div>
          
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="parameters-list">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="divide-y">
                  {value.map((param, index) => {
                    const uniqueId = param.id || param.name || `param-${index}`;
                    return (
                    <Draggable key={uniqueId} draggableId={uniqueId} index={index}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          style={provided.draggableProps.style as React.CSSProperties}
                          className="bg-card"
                        >
                          <Collapsible>
                            <div className="grid grid-cols-12 gap-2 p-3 items-center">
                              <div className="col-span-3 flex items-center gap-2">
                                <div {...provided.dragHandleProps} className="cursor-grab text-muted-foreground hover:text-foreground">
                                  <GripVertical className="h-4 w-4" />
                                </div>
                                <Input
                                  value={param.name}
                                  onChange={(e) => updateParam(index, { name: e.target.value.replace(/\s/g, '_') })}
                                  placeholder="Parameter name"
                                  className="h-8"
                                />
                              </div>
                              
                              <div className="col-span-3">
                                <Select
                                  value={param.type}
                                  onValueChange={(val: any) => {
                                    updateParam(index, { 
                                      type: val,
                                      defaultValue: val === 'checkbox' ? false : '',
                                    });
                                  }}
                                >
                                  <SelectTrigger className="h-8">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {paramTypes.map(t => (
                                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              
                              <div className="col-span-3">
                                <Input
                                  value={param.placeholder || ''}
                                  onChange={(e) => updateParam(index, { placeholder: e.target.value })}
                                  placeholder="A parameter"
                                  className="h-8"
                                />
                              </div>
                              
                              <div className="col-span-3 flex items-center gap-2">
                                {param.type === 'checkbox' ? (
                                  <div className="flex h-8 items-center flex-1 px-2 border rounded-md">
                                    <Checkbox
                                      checked={!!param.defaultValue}
                                      onCheckedChange={(checked) => updateParam(index, { defaultValue: !!checked })}
                                    />
                                  </div>
                                ) : (
                                  <Input
                                    type={param.type === 'number' ? 'number' : 'text'}
                                    value={((param.defaultValue as any) || '') as string}
                                    onChange={(e) => updateParam(index, { defaultValue: e.target.value as any })}
                                    placeholder="NULL"
                                    className="h-8 flex-1"
                                  />
                                )}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                  onClick={() => removeParameter(index)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            
                            <CollapsibleTrigger asChild>
                              <div className="pl-11 pb-2 flex items-center gap-1 text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                                <ChevronDown className="h-3 w-3" />
                                <span>Options</span>
                              </div>
                            </CollapsibleTrigger>
                            <CollapsibleContent className="pl-11 pr-3 pb-4">
                              <div className="flex items-start gap-6 pt-2 border-t">
                                <div className="space-y-1.5 flex-1 max-w-[400px]">
                                  <Label className="text-xs">Description</Label>
                                  <Textarea 
                                    placeholder="Description" 
                                    className="h-16 resize-none"
                                    value={param.description || ''}
                                    onChange={(e) => updateParam(index, { description: e.target.value })}
                                  />
                                </div>
                                
                                {['string', 'number'].includes(param.type) && (
                                  <div className="flex items-center space-x-2 mt-6">
                                    <Checkbox 
                                      id={`required-${param.id}`}
                                      checked={(param.data as any)?.required}
                                      onCheckedChange={(checked) => updateParam(index, { 
                                        data: { ...(param.data as any), required: !!checked }
                                      })}
                                    />
                                    <Label htmlFor={`required-${param.id}`} className="text-sm font-normal">
                                      Parameter required
                                    </Label>
                                  </div>
                                )}
                              </div>
                            </CollapsibleContent>
                          </Collapsible>
                        </div>
                      )}
                    </Draggable>
                  );
                  })}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>
      )}
      
      <Button onClick={addParameter} variant="outline" size="sm" className="gap-2">
        <Plus className="h-4 w-4" />
        Add Parameter
      </Button>
    </div>
  );
}
