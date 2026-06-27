import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { DEFAULT_AUTHENTICATED_ROUTE } from '@/config/route-config';

export const Route = createFileRoute('/auth/callback')({
  component: AuthCallbackPage,
});

function AuthCallbackPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const hasToasted = useRef(false);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Supabase handles the code exchange automatically when
        // the URL contains the auth parameters (code, access_token, etc.)
        const { data: { session }, error: authError } = await supabase.auth.getSession();
        
        if (authError) {
          throw authError;
        }

        if (session) {
          if (!hasToasted.current) {
            hasToasted.current = true;
            toast.success('Đăng nhập thành công!');
          }
          navigate({ to: DEFAULT_AUTHENTICATED_ROUTE });
        } else {
          // If no session yet, Supabase may still be processing
          // Listen for the auth state change
          const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' && session) {
              if (!hasToasted.current) {
                hasToasted.current = true;
                toast.success('Đăng nhập thành công!');
              }
              navigate({ to: DEFAULT_AUTHENTICATED_ROUTE });
              subscription.unsubscribe();
            }
          });

          // Timeout after 10 seconds
          const timeoutId = setTimeout(() => {
            subscription.unsubscribe();
            setError('Xác thực hết thời gian. Vui lòng thử lại.');
          }, 10000);

          // Cleanup on unmount
          return () => {
            clearTimeout(timeoutId);
            subscription.unsubscribe();
          };
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Lỗi xác thực không xác định';
        setError(message);
        toast.error(message);
      }
    };

    handleCallback();
  }, [navigate]);

  if (error) {
    return (
      <div className="flex flex-1 w-full items-center justify-center p-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/20">
            <svg className="h-8 w-8 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">Xác thực thất bại</h1>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
          <button
            onClick={() => navigate({ to: '/login' })}
            className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
          >
            Quay lại Đăng nhập
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 w-full items-center justify-center p-6">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-muted-foreground text-sm font-medium">Đang xử lý đăng nhập...</p>
      </div>
    </div>
  );
}
