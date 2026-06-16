import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from './supabase';
import { z } from 'zod';
import { toast } from 'sonner';

export const BUCKET_NAME = 'omnidesk-drive';

// Thêm schema kiểm tra file trả về từ Supabase
export const fileObjectSchema = z.object({
  name: z.string(),
  id: z.string().optional(),
  updated_at: z.string().optional(),
  created_at: z.string().optional(),
  last_accessed_at: z.string().optional(),
  metadata: z.record(z.string(), z.any()).optional().nullable(),
});

export type FileObject = z.infer<typeof fileObjectSchema>;

/**
 * Fetch list of files in a specific folder path
 */
export const useListFiles = (path: string = '') => {
  return useQuery({
    queryKey: ['storage', BUCKET_NAME, path],
    queryFn: async () => {
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .list(path, {
          limit: 100,
          offset: 0,
          sortBy: { column: 'name', order: 'asc' },
        });

      if (error) {
        throw new Error(error.message);
      }

      return z.array(fileObjectSchema).parse(data || []);
    },
  });
};

/**
 * Upload a file to the bucket
 */
export const useUploadFile = (path: string = '') => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ file, fileName }: { file: File; fileName: string }) => {
      const fullPath = path ? `${path}/${fileName}` : fileName;
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(fullPath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      toast.success('File uploaded successfully');
      queryClient.invalidateQueries({ queryKey: ['storage', BUCKET_NAME, path] });
    },
    onError: (error) => {
      toast.error(`Failed to upload file: ${error.message}`);
    },
  });
};

/**
 * Delete a file
 */
export const useDeleteFile = (path: string = '') => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (fileName: string) => {
      const fullPath = path ? `${path}/${fileName}` : fileName;
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([fullPath]);

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      toast.success('File deleted');
      queryClient.invalidateQueries({ queryKey: ['storage', BUCKET_NAME, path] });
    },
    onError: (error) => {
      toast.error(`Failed to delete file: ${error.message}`);
    },
  });
};

/**
 * Get Public URL
 */
export const getPublicUrl = (fileName: string, path: string = '') => {
  const fullPath = path ? `${path}/${fileName}` : fileName;
  const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(fullPath);
  return data.publicUrl;
};
