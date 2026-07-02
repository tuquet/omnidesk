import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Input, ScrollArea, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, useConfirmDialog, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@omnidesk/ui';
import { FolderIcon, PlusIcon, MoreVerticalIcon, PencilIcon, TrashIcon } from 'lucide-react';
import { toast } from 'sonner';
import { client } from '@/lib/api-client';
import { listFolders, createFolder, updateFolder, deleteFolder } from '@omnidesk/types/client';
import type { Folder } from '@omnidesk/types/client';
import { useWorkspaceStore } from '@omnidesk/core';

interface FolderPanelProps {
  activeFolderId: string | null;
  onSelectFolder: (id: string | null) => void;
}

export function FolderPanel({ activeFolderId, onSelectFolder }: FolderPanelProps) {
  const { selectedWorkspacePath } = useWorkspaceStore();
  const queryClient = useQueryClient();
  const { confirm } = useConfirmDialog();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
  const [folderName, setFolderName] = useState('');

  const { data: folders = [], isLoading } = useQuery<Folder[]>({
    queryKey: ['folders', selectedWorkspacePath],
    queryFn: async () => {
      if (!selectedWorkspacePath) return [];
      const { data, error } = await listFolders({ client });
      if (error) throw error;
      return (data as Folder[]) || [];
    },
    enabled: !!selectedWorkspacePath,
  });

  const createMutation = useMutation({
    mutationFn: async (name: string) => {
      const id = crypto.randomUUID();
      const { error } = await createFolder({
        client,
        body: { id, name },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders', selectedWorkspacePath] });
      setIsCreateOpen(false);
      setFolderName('');
      toast.success('Folder created');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { error } = await updateFolder({
        client,
        path: { id },
        body: { name },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders', selectedWorkspacePath] });
      setIsEditOpen(false);
      setEditingFolder(null);
      setFolderName('');
      toast.success('Folder updated');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await deleteFolder({
        client,
        path: { id },
      });
      if (error) throw error;
    },
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ['folders', selectedWorkspacePath] });
      if (activeFolderId === deletedId) {
        onSelectFolder(null);
      }
      toast.success('Folder deleted');
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!folderName.trim()) return;
    createMutation.mutate(folderName.trim());
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!folderName.trim() || !editingFolder) return;
    updateMutation.mutate({ id: editingFolder.id, name: folderName.trim() });
  };

  const handleDelete = async (folder: Folder) => {
    const confirmed = await confirm({
      title: 'Delete Folder',
      description: `Are you sure you want to delete "${folder.name}"? Workflows inside will not be deleted, they will just be removed from this folder.`,
      destructive: true,
    });
    if (confirmed) {
      deleteMutation.mutate(folder.id);
    }
  };

  const openEdit = (folder: Folder) => {
    setEditingFolder(folder);
    setFolderName(folder.name);
    setIsEditOpen(true);
  };

  if (!selectedWorkspacePath) return null;

  return (
    <div className="flex flex-col bg-card h-full">
      <div className="p-2 border-b flex items-center justify-between">
        <h3 className="font-semibold text-sm">Folders</h3>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => {
            setFolderName('');
            setIsCreateOpen(true);
          }}
        >
          <PlusIcon className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          <Button
            variant={activeFolderId === null ? 'secondary' : 'ghost'}
            className="w-full justify-start font-normal h-8 text-sm"
            onClick={() => onSelectFolder(null)}
          >
            <FolderIcon className="mr-2 h-4 w-4 text-muted-foreground" />
            All Workflows
          </Button>

          {isLoading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">Loading...</div>
          ) : (
            folders.map((folder) => (
              <div
                key={folder.id}
                className={`group flex items-center justify-between rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors ${
                  activeFolderId === folder.id
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'hover:bg-muted'
                }`}
                onClick={() => onSelectFolder(folder.id)}
              >
                <div className="flex items-center gap-2 truncate">
                  <FolderIcon className={`h-4 w-4 ${activeFolderId === folder.id ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className="truncate">{folder.name}</span>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity -mr-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVerticalIcon className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        openEdit(folder);
                      }}
                    >
                      <PencilIcon className="mr-2 h-4 w-4" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(folder);
                      }}
                    >
                      <TrashIcon className="mr-2 h-4 w-4" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Folder</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate}>
            <div className="py-2">
              <Input
                placeholder="Folder name"
                value={folderName}
                className="h-8 text-sm"
                onChange={(e) => setFolderName(e.target.value)}
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={!folderName.trim() || createMutation.isPending}>
                Create
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Folder</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate}>
            <div className="py-2">
              <Input
                placeholder="Folder name"
                value={folderName}
                className="h-8 text-sm"
                onChange={(e) => setFolderName(e.target.value)}
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={!folderName.trim() || updateMutation.isPending}>
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
