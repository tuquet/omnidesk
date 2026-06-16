import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@omnidesk/app-auth';
import { NOTIFICATION_TABLE, NOTIFICATIONS_LIMIT } from '../config/constants';
import type { AppNotification } from '../config/constants';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// This abstracts the Supabase realtime logic into a clean hook
export function useNotifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = ['notifications', user?.id];

  const { data: notifications = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from(NOTIFICATION_TABLE)
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(NOTIFICATIONS_LIMIT);

      if (error) throw error;
      return data as AppNotification[];
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('realtime_notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: NOTIFICATION_TABLE,
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          queryClient.setQueryData<AppNotification[]>(queryKey, (prev = []) => {
            return [payload.new as AppNotification, ...prev];
          });
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: NOTIFICATION_TABLE,
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          queryClient.setQueryData<AppNotification[]>(queryKey, (prev = []) => {
            return prev.map((n) =>
              n.id === payload.new.id ? (payload.new as AppNotification) : n
            );
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]); // eslint-disable-line react-hooks/exhaustive-deps

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase
        .from(NOTIFICATION_TABLE)
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);
      if (error) throw error;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey });
      const previousNotifications = queryClient.getQueryData<AppNotification[]>(queryKey);
      if (previousNotifications) {
        queryClient.setQueryData<AppNotification[]>(
          queryKey,
          previousNotifications.map((n) => ({ ...n, is_read: true }))
        );
      }
      return { previousNotifications };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousNotifications) {
        queryClient.setQueryData(queryKey, context.previousNotifications);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from(NOTIFICATION_TABLE)
        .update({ is_read: true })
        .eq('id', id);
      if (error) throw error;
    },
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey });
      const previousNotifications = queryClient.getQueryData<AppNotification[]>(queryKey);
      if (previousNotifications) {
        queryClient.setQueryData<AppNotification[]>(
          queryKey,
          previousNotifications.map((n) => (n.id === id ? { ...n, is_read: true } : n))
        );
      }
      return { previousNotifications };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousNotifications) {
        queryClient.setQueryData(queryKey, context.previousNotifications);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    notifications,
    isLoading,
    markAllAsRead: () => markAllAsReadMutation.mutate(),
    markAsRead: (id: string) => markAsReadMutation.mutateAsync(id),
  };
}

// Separate hook for insertions (used by app-store, etc)
export function useInsertNotification() {
  const { user } = useAuth();

  const insertMutation = useMutation({
    mutationFn: async (notification: Omit<AppNotification, 'id' | 'created_at' | 'is_read'>) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase.from(NOTIFICATION_TABLE).insert({
        user_id: user.id,
        ...notification,
      });
      if (error) throw error;
      return data;
    },
  });

  return {
    insert: (notification: Omit<AppNotification, 'id' | 'created_at' | 'is_read'>) =>
      insertMutation.mutateAsync(notification),
  };
}
