import { ThemeProvider } from 'next-themes';

export function EnvSetupWarning() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground p-3 font-sans">
        <div className="max-w-md w-full bg-card border border-border rounded-xl p-8 shadow-2xl space-y-6">
          <div className="flex items-center space-x-3 text-amber-500">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-alert-triangle"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            <h1 className="text-xl font-semibold tracking-tight">Environment Setup Required</h1>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed font-sans">
            Ứng dụng yêu cầu cấu hình các tham số kết nối đám mây để khởi chạy các dịch vụ dữ liệu và xác thực.
          </p>
          <div className="bg-zinc-950 border border-zinc-800/80 rounded-lg p-2 font-mono text-xs text-zinc-300 space-y-2">
            <p className="text-zinc-500 font-semibold mb-1"># Vui lòng cấu hình file .env ở gốc dự án:</p>
            <div>VITE_SUPABASE_URL=<span className="text-zinc-500">https://your-project.supabase.co</span></div>
            <div>VITE_SUPABASE_ANON_KEY=<span className="text-zinc-500">your-anon-key</span></div>
          </div>
          <p className="text-xs text-muted-foreground font-sans">
            Sau khi định cấu hình file <code className="text-zinc-300 font-mono bg-zinc-950 px-1 py-0.5 rounded">.env</code>, bạn cần **khởi động lại dev server** để các thay đổi có hiệu lực.
          </p>
        </div>
      </div>
    </ThemeProvider>
  );
}
