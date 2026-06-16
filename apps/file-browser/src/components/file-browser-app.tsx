import * as React from 'react';
import { useState, useRef } from 'react';
import { useListFiles, useUploadFile, useDeleteFile } from '../api/storage-queries';
import { FileRow } from './file-row';
import { Button } from '@omnidesk/ui';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@omnidesk/ui';
import { Input } from '@omnidesk/ui';
import { CloudUpload, Search, FolderPlus, RefreshCw } from 'lucide-react';

export function FileBrowserApp() {
  const [currentPath, setCurrentPath] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  const { data: files, isLoading, refetch, isFetching } = useListFiles(currentPath);
  const uploadMutation = useUploadFile(currentPath);
  const deleteMutation = useDeleteFile(currentPath);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    
    const file = fileList[0];
    if (!file) return;
    await uploadMutation.mutateAsync({ file, fileName: file.name });
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (fileName: string) => {
    if (confirm(`Bạn có chắc chắn muốn xoá file ${fileName}?`)) {
      await deleteMutation.mutateAsync(fileName);
    }
  };

  const filteredFiles = files?.filter(f => 
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-background rounded-lg border shadow-sm">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm file..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="secondary">
            <FolderPlus className="mr-2 h-4 w-4" />
            Thư mục mới
          </Button>
          <Button onClick={handleUploadClick} disabled={uploadMutation.isPending}>
            <CloudUpload className="mr-2 h-4 w-4" />
            {uploadMutation.isPending ? 'Đang tải lên...' : 'Tải lên'}
          </Button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
          />
        </div>
      </div>

      {/* Breadcrumb / Path */}
      <div className="px-4 py-2 bg-muted/50 border-b text-sm text-muted-foreground flex items-center gap-2">
        <span 
          className="cursor-pointer hover:text-foreground transition-colors"
          onClick={() => setCurrentPath('')}
        >
          Omnidesk Drive
        </span>
        {currentPath && (
          <>
            <span>/</span>
            <span className="text-foreground">{currentPath}</span>
          </>
        )}
      </div>

      {/* File List */}
      <div className="flex-1 overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tên</TableHead>
              <TableHead>Loại</TableHead>
              <TableHead>Kích thước</TableHead>
              <TableHead>Chỉnh sửa lần cuối</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Đang tải dữ liệu...
                </TableCell>
              </TableRow>
            ) : filteredFiles && filteredFiles.length > 0 ? (
              filteredFiles.map((file) => (
                <FileRow 
                  key={file.id || file.name} 
                  file={file} 
                  path={currentPath}
                  onDelete={handleDelete}
                />
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground flex flex-col items-center justify-center">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                    <CloudUpload className="h-8 w-8 text-muted-foreground" />
                  </div>
                  Thư mục trống. Kéo thả file hoặc nhấn "Tải lên" để thêm file.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
