import { useState, useCallback, useMemo, createContext, useContext, type ReactNode } from 'react';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../index';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ConfirmDialogOptions {
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  /** When true, confirm button uses destructive variant (red). */
  destructive?: boolean;
}

interface ConfirmDialogState extends ConfirmDialogOptions {
  open: boolean;
  resolve: ((confirmed: boolean) => void) | null;
}

interface ConfirmDialogContextValue {
  confirm: (options: ConfirmDialogOptions) => Promise<boolean>;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const ConfirmDialogContext = createContext<ConfirmDialogContextValue | null>(null);

/**
 * Hook for imperative confirmation dialogs.
 *
 * @example
 * ```tsx
 * const { confirm } = useConfirmDialog();
 *
 * const handleDelete = async () => {
 *   const confirmed = await confirm({
 *     title: 'Delete issue?',
 *     description: 'This action cannot be undone.',
 *     destructive: true,
 *   });
 *   if (confirmed) {
 *     // delete the issue
 *   }
 * };
 * ```
 */
export function useConfirmDialog(): ConfirmDialogContextValue {
  const ctx = useContext(ConfirmDialogContext);
  if (!ctx) {
    throw new Error('useConfirmDialog must be used within <ConfirmDialogProvider>');
  }
  return ctx;
}

// ─── Provider ────────────────────────────────────────────────────────────────

const initialState: ConfirmDialogState = {
  open: false,
  title: '',
  resolve: null,
};

export function ConfirmDialogProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ConfirmDialogState>(initialState);

  const confirm = useCallback((options: ConfirmDialogOptions): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      setState({ ...options, open: true, resolve });
    });
  }, []);

  const handleClose = useCallback(
    (confirmed: boolean) => {
      state.resolve?.(confirmed);
      setState(initialState);
    },
    [state.resolve],
  );

  const contextValue = useMemo(() => ({ confirm }), [confirm]);

  return (
    <ConfirmDialogContext.Provider value={contextValue}>
      {children}
      <Dialog open={state.open} onOpenChange={(open) => !open && handleClose(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{state.title}</DialogTitle>
            {state.description && <DialogDescription>{state.description}</DialogDescription>}
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => handleClose(false)}>
              {state.cancelText ?? 'Cancel'}
            </Button>
            <Button
              variant={state.destructive ? 'destructive' : 'default'}
              onClick={() => handleClose(true)}
            >
              {state.confirmText ?? 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ConfirmDialogContext.Provider>
  );
}
