import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SmartBreadcrumb } from '../smart-breadcrumb';
import { useRouterState } from '@tanstack/react-router';

const mockToggleDevMode = vi.fn();

vi.mock('@tanstack/react-router', () => ({
  useRouterState: vi.fn(),
  Link: ({ children, to }: any) => <a href={to}>{children}</a>,
}));

vi.mock('@/stores/use-dev-store', () => ({
  useDevStore: () => ({
    toggleDevMode: mockToggleDevMode,
  }),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
  },
}));

vi.mock('@/config', () => ({
  BREADCRUMB_MAP: {
    '/dashboard': [{ label: 'Dashboard', url: '/dashboard' }],
    '/documents/reports': [
      { label: 'Dashboard', url: '/dashboard' },
      { label: 'Documents', url: '/documents' },
      { label: 'Reports', url: '/documents/reports' },
    ],
  },
}));

// Mock UI components simply
vi.mock('@omnidesk/ui', () => ({
  Breadcrumb: ({ children, onClick }: any) => (
    <nav onClick={onClick} aria-label="breadcrumb">
      {children}
    </nav>
  ),
  BreadcrumbList: ({ children }: any) => <ol>{children}</ol>,
  BreadcrumbItem: ({ children }: any) => <li>{children}</li>,
  BreadcrumbLink: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  BreadcrumbPage: ({ children }: any) => <span aria-current="page">{children}</span>,
  BreadcrumbSeparator: () => <span>/</span>,
  DropdownMenu: ({ children }: any) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }: any) => <button>{children}</button>,
  DropdownMenuContent: ({ children }: any) => <div>{children}</div>,
  DropdownMenuItem: ({ children }: any) => <div>{children}</div>,
}));

describe('SmartBreadcrumb Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders generic breadcrumbs based on pathname if not in map', () => {
    (useRouterState as any).mockReturnValue('/unknown/path');
    render(<SmartBreadcrumb />);

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Unknown')).toBeInTheDocument();
    expect(screen.getByText('Path')).toBeInTheDocument();
  });

  it('renders exact breadcrumbs from config map', () => {
    (useRouterState as any).mockReturnValue('/documents/reports');
    render(<SmartBreadcrumb />);

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Documents')).toBeInTheDocument();
    expect(screen.getByText('Reports')).toBeInTheDocument();
  });

  it('triggers dev mode after 10 rapid clicks', () => {
    (useRouterState as any).mockReturnValue('/dashboard');
    render(<SmartBreadcrumb />);

    const breadcrumb = screen.getByRole('navigation');

    for (let i = 0; i < 10; i++) {
      fireEvent.click(breadcrumb);
    }

    expect(mockToggleDevMode).toHaveBeenCalledTimes(1);
  });
});
