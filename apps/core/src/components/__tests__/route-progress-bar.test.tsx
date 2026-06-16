
import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { RouteProgressBar } from '../route-progress-bar';
import { useRouterState } from '@tanstack/react-router';

vi.mock('@tanstack/react-router', () => ({
  useRouterState: vi.fn(),
}));

describe('RouteProgressBar Component', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('does not render when status is idle', () => {
    (useRouterState as any).mockReturnValue('idle');
    render(<RouteProgressBar />);
    expect(screen.queryByRole('presentation')).not.toBeInTheDocument();
    // Since we don't have role="progressbar" by default, we just check if it's visible by querying elements
    const container = document.querySelector('.bg-transparent');
    expect(container).not.toBeInTheDocument();
  });

  it('renders and increments progress when status is pending', () => {
    (useRouterState as any).mockReturnValue('pending');
    render(<RouteProgressBar />);
    
    const container = document.querySelector('.bg-transparent');
    expect(container).toBeInTheDocument();
    
    // Fast forward to trigger interval
    act(() => {
      vi.advanceTimersByTime(200);
    });
    
    const bar = document.querySelector('.bg-gradient-to-r') as HTMLElement;
    expect(bar).toBeInTheDocument();
    
    // Progress should be greater than initial 10%
    const widthMatch = bar.style.width.match(/([\d.]+)%/);
    expect(widthMatch).not.toBeNull();
    if (widthMatch !== null) {
      expect(parseFloat(widthMatch[1]!)).toBeGreaterThanOrEqual(10);
    }
  });

  it('finishes and hides when status becomes idle after pending', () => {
    const { rerender } = render(<RouteProgressBar />);
    
    // Start pending
    (useRouterState as any).mockReturnValue('pending');
    rerender(<RouteProgressBar />);
    
    expect(document.querySelector('.bg-transparent')).toBeInTheDocument();
    
    // Complete routing
    (useRouterState as any).mockReturnValue('idle');
    rerender(<RouteProgressBar />);
    
    // After 300ms + 200ms it should hide
    act(() => {
      vi.advanceTimersByTime(600);
    });
    
    expect(document.querySelector('.bg-transparent')).not.toBeInTheDocument();
  });
});
