import React, { useEffect, useState } from 'react';
import * as ReactDOM from 'react-dom';
import * as LucideIcons from 'lucide-react';
import * as OmnideskUI from '@omnidesk/ui';
// Import UI if needed, but we will pass it dynamically
import { Skeleton } from '@omnidesk/ui';
import { Platform } from '@/lib/platform';

interface DynamicAppRendererProps {
  appId: string;
}

// Ensure global React is available for apps that use window.React fallback
if (typeof window !== 'undefined') {
  (window as any).React = React;
  (window as any).ReactDOM = ReactDOM;
  (window as any).LucideReact = LucideIcons;
}

export function DynamicAppRenderer({ appId }: DynamicAppRendererProps) {
  const [Component, setComponent] = useState<React.ComponentType | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadApp() {
      if (!Platform.isDesktop) {
        if (appId === 'dashboard') {
          const FallbackDashboard = () => (
            <div className="flex flex-1 flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
              <div className="mb-6 rounded-full bg-primary/10 p-4 ring-1 ring-primary/20">
                <LucideIcons.LayoutDashboard className="h-12 w-12 text-primary" />
              </div>
              <h2 className="text-3xl font-semibold mb-3 tracking-tight">Welcome to OmniDesk Web</h2>
              <p className="text-muted-foreground max-w-md text-base leading-relaxed">
                You are currently using the web preview. OmniDesk is primarily a desktop application. Please download the desktop app for full dynamic app functionality, or use the sidebar to navigate to web-enabled modules.
              </p>
            </div>
          );
          if (isMounted) setComponent(() => FallbackDashboard);
          return;
        }

        if (isMounted) setError(`App "${appId}" cannot be dynamically loaded in the web browser. Please use the Desktop app.`);
        return;
      }

      try {
        const { convertFileSrc, invoke } = await import('@tauri-apps/api/core');
        const { appDataDir } = await import('@tauri-apps/api/path');

        // Fetch installed apps to check if there is a devPath
        const apps: any[] = await invoke('list_local_apps');
        const appMetadata = apps.find(a => a.id === appId);

        // Get the app data dir path
        const dataDir = await appDataDir();
        const pathSep = navigator.userAgent.includes('Windows') ? '\\' : '/';

        let scriptPath = '';
        if (appMetadata?.devPath) {
          scriptPath = `${appMetadata.devPath}${pathSep}dist${pathSep}index.js`;
        } else {
          // Construct path: InstalledApps/{appId}/dist/index.js
          scriptPath = `${dataDir}InstalledApps${pathSep}${appId}${pathSep}dist${pathSep}index.js`;
        }

        // Convert to asset URL
        const assetUrl = convertFileSrc(scriptPath);

        // Fetch script text
        const response = await fetch(assetUrl);
        if (!response.ok) {
          throw new Error(`Failed to load script: ${response.status} ${response.statusText}`);
        }
        const scriptText = await response.text();

        // Simulate CommonJS environment
        const customModule = { exports: {} as any };
        const customExports = customModule.exports;
        const customRequire = (name: string) => {
          if (name === 'react') return React;
          if (name === 'react-dom') return ReactDOM;
          if (name === 'lucide-react') return LucideIcons;
          if (name === '@omnidesk/ui') return OmnideskUI;
          throw new Error(`Module ${name} not provided by host.`);
        };

        // Wrap the script execution
        const fn = new Function('module', 'exports', 'require', 'React', 'ReactDOM', scriptText);
        
        // Execute the script
        fn(customModule, customExports, customRequire, React, ReactDOM);

        // The default export is usually the component
        const LoadedComponent = customModule.exports.default || customModule.exports;

        if (typeof LoadedComponent !== 'function' && typeof LoadedComponent !== 'object') {
          throw new Error('Script did not export a valid React component');
        }

        if (isMounted) {
          setComponent(() => LoadedComponent);
        }
      } catch (err: any) {
        console.error('Failed to load dynamic app:', err);
        if (isMounted) setError(err.message || String(err));
      }
    }

    loadApp();

    return () => {
      isMounted = false;
    };
  }, [appId]);

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-destructive/10 text-destructive border-destructive/20 rounded-lg border p-4">
          <h3 className="font-semibold tracking-tight">Failed to load App {appId}</h3>
          <p className="mt-2 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!Component) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="flex flex-col items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>
    );
  }

  return <Component />;
}
