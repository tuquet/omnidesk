import { useTheme } from 'next-themes';
import { Button } from '@omnidesk/ui';;
import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

export function ThemeToggle({ triggerNode }: { triggerNode?: React.ReactNode }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="h-6 w-6 hover:text-foreground" title="Toggle Theme">
        <span className="sr-only">Toggle theme</span>
      </Button>
    );
  }

  const isDark = resolvedTheme === 'dark';

  return (
    <>
      {triggerNode ? (
        <div onClick={() => setTheme(isDark ? 'light' : 'dark')} className="cursor-pointer">
          {triggerNode}
        </div>
      ) : (
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 hover:text-foreground"
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {isDark ? (
            <Moon className="h-3.5 w-3.5" />
          ) : (
            <Sun className="h-3.5 w-3.5" />
          )}
          <span className="sr-only">Toggle theme</span>
        </Button>
      )}
    </>
  );
}
