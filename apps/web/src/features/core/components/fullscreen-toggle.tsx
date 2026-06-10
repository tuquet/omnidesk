import { useState } from 'react';
import { Maximize, Minimize } from 'lucide-react';
import { Button } from '@kbm/ui';

export function FullscreenToggle() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  async function toggleFullscreen() {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.error('Fullscreen error:', err);
    }
  }

  return (
    <Button variant="outline" size="icon" onClick={toggleFullscreen}>
      {isFullscreen ? (
        <Minimize className="h-[1.2rem] w-[1.2rem]" />
      ) : (
        <Maximize className="h-[1.2rem] w-[1.2rem]" />
      )}
      <span className="sr-only">Toggle fullscreen</span>
    </Button>
  );
}
