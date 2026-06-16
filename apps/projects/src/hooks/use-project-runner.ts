import { useState, useRef, useEffect } from 'react';

export type RunState = 'idle' | 'running' | 'success' | 'error';

export function useProjectRunner(projectId: string) {
  const [logs, setLogs] = useState<string[]>([]);
  const [runState, setRunState] = useState<RunState>('idle');
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  const runScript = (scriptName: string) => {
    if (runState === 'running') return;

    setRunState('running');
    setLogs([]);

    const url = `http://localhost:1421/api/projects/${projectId}/run-script/${scriptName}`;
    const source = new EventSource(url);
    eventSourceRef.current = source;

    source.onmessage = (event: MessageEvent) => {
      const data = event.data as string;
      setLogs((prev) => [...prev, data]);

      if (data.includes('[System] Command finished successfully.')) {
        setRunState('success');
        source.close();
      } else if (
        data.includes('[System] Command exited with status:') ||
        data.includes('[System] Error waiting for process:')
      ) {
        setRunState('error');
        source.close();
      }
    };

    source.onerror = () => {
      setLogs((prev) => [...prev, '[System Error] Connection lost or server side script failed.']);
      setRunState('error');
      source.close();
    };
  };

  const clearConsole = () => {
    setLogs([]);
  };

  const stopScript = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      setLogs((prev) => [...prev, '[System] Connection terminated by user.']);
      setRunState('idle');
    }
  };

  return {
    logs,
    runState,
    runScript,
    stopScript,
    clearConsole,
  };
}
