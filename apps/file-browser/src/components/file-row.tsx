import { FileObject, getPublicUrl } from '../api/storage-queries';
import { FileIcon, FolderIcon, DownloadIcon, TrashIcon, ShareIcon, Image as ImageIcon, FileTextIcon, FileSpreadsheetIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TableCell, TableRow } from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';
import { toast } from 'sonner';

interface FileRowProps {
  file: FileObject;
  path: string;
  onDelete: (fileName: string) => void;
}

export function FileRow({ file, path, onDelete }: FileRowProps) {
  const isFolder = !file.id;

  const getIcon = () => {
    if (isFolder) return <FolderIcon className="w-5 h-5 text-blue-500" />;
    const ext = file.name.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
        return <ImageIcon className="w-5 h-5 text-green-500" />;
      case 'pdf':
      case 'doc':
      case 'docx':
        return <FileTextIcon className="w-5 h-5 text-red-500" />;
      case 'xls':
      case 'xlsx':
      case 'csv':
        return <FileSpreadsheetIcon className="w-5 h-5 text-green-600" />;
      default:
        return <FileIcon className="w-5 h-5 text-gray-500" />;
    }
  };

  const formatSize = (bytes?: number) => {
    if (isFolder || !bytes) return '--';
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const metadata = file.metadata as { size?: number } | undefined;
  const size = metadata?.size;

  const handleShare = () => {
    const url = getPublicUrl(file.name, path);
    navigator.clipboard.writeText(url);
    toast.success('Đã copy link chia sẻ vào Clipboard!');
  };

  const handleDownload = () => {
    const url = getPublicUrl(file.name, path);
    window.open(url, '_blank');
  };

  return (
    <TableRow>
      <TableCell className="font-medium flex items-center gap-3">
        {getIcon()}
        <span>{file.name}</span>
      </TableCell>
      <TableCell>{isFolder ? 'Thư mục' : 'Tập tin'}</TableCell>
      <TableCell>{formatSize(size)}</TableCell>
      <TableCell>{file.updated_at ? new Date(file.updated_at).toLocaleDateString('vi-VN') : '--'}</TableCell>
      <TableCell className="text-right">
        {!isFolder && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleShare}>
                <ShareIcon className="w-4 h-4 mr-2" />
                Lấy Link Chia sẻ
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDownload}>
                <DownloadIcon className="w-4 h-4 mr-2" />
                Tải xuống
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-red-600"
                onClick={() => onDelete(file.name)}
              >
                <TrashIcon className="w-4 h-4 mr-2" />
                Xoá
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </TableCell>
    </TableRow>
  );
}
