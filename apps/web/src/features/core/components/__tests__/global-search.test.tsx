import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock @omnidesk/ui BEFORE importing GlobalSearch — cmdk's CommandDialog needs
// ResizeObserver which jsdom doesn't provide, so we mock the UI components.
vi.mock('@omnidesk/ui', () => ({
  Button: ({ children, onClick, className }: any) => (
    <button onClick={onClick} className={className}>
      {children}
    </button>
  ),
  Command: ({ children }: any) => <div>{children}</div>,
  CommandDialog: ({ children, open }: any) => (open ? <div role="dialog">{children}</div> : null),
  CommandEmpty: ({ children }: any) => <div>{children}</div>,
  CommandGroup: ({ children, heading }: any) => (
    <div>
      <div>{heading}</div>
      {children}
    </div>
  ),
  CommandInput: ({ placeholder }: any) => <input placeholder={placeholder} />,
  CommandItem: ({ children, onSelect }: any) => (
    <div role="option" onClick={onSelect}>
      {children}
    </div>
  ),
  CommandList: ({ children }: any) => <div>{children}</div>,
  CommandSeparator: () => <hr />,
}));

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => vi.fn(),
}));

vi.mock('@/stores/use-dev-store', () => ({
  useDevStore: () => ({ isDevMode: true }),
}));

vi.mock('@/hooks/use-rbac', () => ({
  useRBAC: () => ({
    can: () => true,
    filterNav: (items: any[]) => items,
  }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, fallback: string) => fallback,
  }),
}));

// Import AFTER all vi.mock calls
import { GlobalSearch } from '../global-search';

describe('GlobalSearch Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the search trigger button', () => {
    render(<GlobalSearch />);
    expect(screen.getByText('Search everywhere...')).toBeInTheDocument();
    // ⌘ and K are in separate elements: <span>⌘</span>K
    expect(screen.getByText('⌘')).toBeInTheDocument();
  });

  it('opens dialog when button is clicked', () => {
    render(<GlobalSearch />);

    // Dialog shouldn't be open initially
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    // Click the trigger button
    fireEvent.click(screen.getByText('Search everywhere...'));

    // Now the dialog should be visible
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Type a command or search...')).toBeInTheDocument();
  });

  it('opens dialog when Cmd+K is pressed', () => {
    render(<GlobalSearch />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    // Simulate Cmd+K
    fireEvent.keyDown(document, { key: 'k', metaKey: true });

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
