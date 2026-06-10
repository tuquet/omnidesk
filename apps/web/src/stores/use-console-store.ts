import { Store } from '@tanstack/store';
import { useStore } from '@tanstack/react-store';

export type LogLevel = 'log' | 'info' | 'warn' | 'error';

export interface LogEntry {
  id: string;
  level: LogLevel;
  message: string;
  timestamp: number;
}

export interface ConsoleState {
  logs: LogEntry[];
  unreadCount: number;
}

const formatArgs = (args: any[]) => {
  return args
    .map((arg) => {
      if (typeof arg === 'object') {
        try {
          if (arg instanceof Error) {
            return arg.stack || arg.message;
          }
          return JSON.stringify(arg, null, 2);
        } catch {
          return String(arg);
        }
      }
      return String(arg);
    })
    .join(' ');
};

export const consoleStore = new Store<ConsoleState>({
  logs: [],
  unreadCount: 0,
});

export const consoleActions = {
  addLog: (level: LogLevel, args: any[]) => {
    const message = formatArgs(args);
    const newLog: LogEntry = {
      id: Math.random().toString(36).substring(2, 9),
      level,
      message,
      timestamp: Date.now(),
    };

    consoleStore.setState((state) => ({
      ...state,
      logs: [newLog, ...state.logs].slice(0, 100), // Keep last 100 logs
      unreadCount: state.unreadCount + 1,
    }));
  },
  clearLogs: () => {
    consoleStore.setState(() => ({ logs: [], unreadCount: 0 }));
  },
  markAsRead: () => {
    consoleStore.setState((state) => ({ ...state, unreadCount: 0 }));
  },
};

export function useConsoleStore() {
  const state = useStore(consoleStore);
  return {
    ...state,
    ...consoleActions,
  };
}

// Initialize console hijacker
let initialized = false;
export const initConsoleHijacker = () => {
  if (initialized) return;
  initialized = true;

  const originalConsole = {
    log: console.log,
    info: console.info,
    warn: console.warn,
    error: console.error,
  };

  console.log = (...args) => {
    originalConsole.log(...args);
    consoleActions.addLog('log', args);
  };
  
  console.info = (...args) => {
    originalConsole.info(...args);
    consoleActions.addLog('info', args);
  };

  console.warn = (...args) => {
    originalConsole.warn(...args);
    consoleActions.addLog('warn', args);
  };

  console.error = (...args) => {
    originalConsole.error(...args);
    consoleActions.addLog('error', args);
  };

  window.addEventListener('error', (event) => {
    consoleActions.addLog('error', [event.error || event.message]);
  });

  window.addEventListener('unhandledrejection', (event) => {
    consoleActions.addLog('error', ['Unhandled Promise Rejection:', event.reason]);
  });
};

