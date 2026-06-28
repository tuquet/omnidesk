import { useTheme } from 'next-themes';
import { Button } from '@omnidesk/ui';

export function ThemeToggle({ triggerNode }: { triggerNode?: React.ReactNode }) {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <>
      {triggerNode ? (
        <div onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}>{triggerNode}</div>
      ) : (
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9"
          onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
          >
            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
            <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
            <path d="M12 3l0 18" />
            <path d="M12 9l4.65 -4.65" />
            <path d="M12 14.3l7.37 -7.37" />
            <path d="M12 19.6l8.85 -8.85" />
          </svg>
          <span className="sr-only">Toggle theme</span>
        </Button>
      )}
    </>
  );
}
