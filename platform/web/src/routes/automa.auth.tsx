import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { authStore } from '@omnidesk/auth';
import { LoginForm } from '@omnidesk/auth';
import { CheckCircle2, Loader2, Puzzle } from 'lucide-react';

export const Route = createFileRoute('/automa/auth')({
  component: AutomaAuthPage,
});

/**
 * Automa Extension Auth Bridge Page
 * 
 * Mục đích: Khi user truy cập trang này và đăng nhập,
 * token Supabase sẽ được lưu vào localStorage với key `supabase.auth.token`
 * để script webService.js của Extension Automa có thể đọc được.
 * 
 * Extension sẽ inject webService.js vào domain này (cấu hình trong manifest.json).
 */
function AutomaAuthPage() {
  const navigate = useNavigate();
  const [synced, setSynced] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function syncTokenForExtension() {
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        // Ghi token vào localStorage theo đúng format mà webService.js của Automa cần đọc
        const tokenPayload = {
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          expires_at: session.expires_at,
          expires_in: session.expires_in,
          token_type: session.token_type,
          user: session.user,
          provider_token: session.provider_token,
          provider_refresh_token: session.provider_refresh_token,
        };
        localStorage.setItem('supabase.auth.token', JSON.stringify(tokenPayload));

        // Bắn event `app-mounted` để webService.js của Extension bắt được
        window.dispatchEvent(new Event('app-mounted'));

        setSynced(true);
      }

      setChecking(false);
    }

    syncTokenForExtension();

    // Lắng nghe thay đổi auth state (sau khi user login xong)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session) {
          const tokenPayload = {
            access_token: session.access_token,
            refresh_token: session.refresh_token,
            expires_at: session.expires_at,
            expires_in: session.expires_in,
            token_type: session.token_type,
            user: session.user,
            provider_token: session.provider_token,
            provider_refresh_token: session.provider_refresh_token,
          };
          localStorage.setItem('supabase.auth.token', JSON.stringify(tokenPayload));
          window.dispatchEvent(new Event('app-mounted'));
          setSynced(true);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Nếu đang kiểm tra session
  if (checking) {
    return (
      <div className="flex flex-1 w-full items-center justify-center p-6">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Đang kiểm tra phiên đăng nhập...</p>
        </div>
      </div>
    );
  }

  // Đã đăng nhập & sync xong
  if (synced) {
    return (
      <div className="flex flex-1 w-full items-center justify-center p-6">
        <div className="flex flex-col items-center gap-6 text-center max-w-md">
          <div className="relative">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-green-500/10 ring-1 ring-green-500/20">
              <CheckCircle2 className="h-10 w-10 text-green-500" />
            </div>
            <div className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-lg">
              <Puzzle className="h-4 w-4" />
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">
              Kết nối Extension thành công!
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Automa Extension đã nhận được phiên đăng nhập của bạn. 
              Bạn có thể đóng tab này và quay lại sử dụng Extension.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-full bg-muted px-4 py-2 text-xs text-muted-foreground">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            Extension đã được đồng bộ
          </div>
        </div>
      </div>
    );
  }

  // Chưa đăng nhập → hiển thị form login
  return (
    <div className="flex flex-1 w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
            <Puzzle className="h-7 w-7 text-primary" />
          </div>
          <div className="space-y-1">
            <h1 className="text-xl font-semibold tracking-tight">
              Kết nối Automa Extension
            </h1>
            <p className="text-sm text-muted-foreground">
              Đăng nhập để đồng bộ phiên làm việc với Extension
            </p>
          </div>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
