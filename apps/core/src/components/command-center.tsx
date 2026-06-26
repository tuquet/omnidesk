import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@omnidesk/ui';
import { PackageOpen, Loader2, StoreIcon, SettingsIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useNavigate } from '@tanstack/react-router';
import { Platform } from '@/lib/platform';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface InstalledApp {
  user_id: string;
  app_id: string;
  marketplace_apps: {
    id: string;
    name: string;
    package_hash: string;
  };
}

interface AppItem {
  id: string;
  name: string;
  isSystem: boolean;
  background: string;
  iconColor: string;
  route: string;
  isAppRoute: boolean;
  icon?: React.ElementType;
}

const SYSTEM_APPS: AppItem[] = [
  { 
    id: 'app-store', 
    name: 'App Store', 
    icon: StoreIcon, 
    route: '/app-store', 
    isAppRoute: false,
    isSystem: true,
    background: 'bg-card',
    iconColor: 'currentColor'
  },
  { 
    id: 'settings', 
    name: 'Settings', 
    icon: SettingsIcon, 
    route: '/settings', 
    isAppRoute: false,
    isSystem: true,
    background: 'bg-card',
    iconColor: 'currentColor'
  },
];

function SortableAppItem({ app, onClick }: { app: AppItem, onClick: () => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: app.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1 : 0,
    width: '20%',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    marginBottom: '60px',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group outline-none relative ${isDragging ? 'opacity-50' : ''}`}
    >
      <button 
        onClick={onClick}
        {...attributes}
        {...listeners}
        className={`relative flex items-center justify-center w-[128px] h-[128px] rounded-[32px] border ${app.background} text-card-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-300 ease-out group-hover:scale-105 group-active:scale-95 cursor-pointer outline-none shadow-sm`}
        style={{ touchAction: 'none' }}
      >
        {app.isSystem && app.icon ? (
          <app.icon className="w-16 h-16" strokeWidth={1.5} style={{ color: app.iconColor }} />
        ) : (
          <PackageOpen className="w-16 h-16" strokeWidth={1.5} style={{ color: app.iconColor }} />
        )}
      </button>
      <span 
        className="group-hover:text-primary transition-colors text-center leading-tight drop-shadow-sm pointer-events-none mt-5 text-[17px] font-medium text-muted-foreground px-2"
      >
        {app.name}
      </span>
    </div>
  );
}

export function CommandCenterDashboard() {
  const [items, setItems] = useState<AppItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Requires 5px movement before dragging starts (avoids accidental drags instead of clicks)
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    async function fetchApps() {
      try {
        let savedOrder: string[] = [];
        let fetchedApps: InstalledApp[] = [];
        let userId = 'local';

        if (Platform.isDesktop) {
          const { invoke } = await import('@tauri-apps/api/core');
          try {
            const localApps = await invoke<any[]>('list_local_apps');
            fetchedApps = localApps.map(a => ({
               user_id: 'local',
               app_id: a.id,
               marketplace_apps: { id: a.id, name: a.name || a.id, package_hash: 'local' }
            }));
            const prefStr = await invoke<string>('get_user_preferences', { userId: 'local' });
            savedOrder = JSON.parse(prefStr || '[]');
          } catch (e) {
             console.error('Tauri fetch error:', e);
          }
        } else {
          const { data: userData } = await supabase.auth.getUser();
          if (userData.user) {
            userId = userData.user.id;
            const { data, error } = await supabase
              .from('user_installed_apps')
              .select('user_id, app_id, marketplace_apps(id, name, package_hash)');
            
            if (!error && data) {
               fetchedApps = data.filter(item => item.marketplace_apps) as InstalledApp[];
            }
            
            const { data: prefData } = await supabase
              .from('user_preferences')
              .select('home_screen_order')
              .eq('user_id', userId)
              .maybeSingle();

            if (prefData && prefData.home_screen_order) {
               savedOrder = prefData.home_screen_order as string[];
            }
          }
        }

        const mappedInstalled: AppItem[] = fetchedApps.map(a => ({
          id: a.marketplace_apps.id,
          name: a.marketplace_apps.name,
          isSystem: false,
          background: 'bg-card',
          iconColor: 'currentColor',
          route: `/app/${a.marketplace_apps.id}`,
          isAppRoute: true,
        }));

        const allApps = [...SYSTEM_APPS, ...mappedInstalled];
        
        // Sort based on saved preferences
        if (savedOrder.length > 0) {
          allApps.sort((a, b) => {
            const idxA = savedOrder.indexOf(a.id);
            const idxB = savedOrder.indexOf(b.id);
            if (idxA !== -1 && idxB !== -1) return idxA - idxB;
            if (idxA !== -1) return -1;
            if (idxB !== -1) return 1;
            return 0;
          });
        }
        
        setItems(allApps);
      } catch (err) {
        console.error('Failed to load apps:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchApps();
  }, []);

  const saveOrder = async (order: string[]) => {
    try {
      if (Platform.isDesktop) {
        const { invoke } = await import('@tauri-apps/api/core');
        await invoke('update_home_screen_order', { 
           userId: 'local', 
           homeScreenOrder: JSON.stringify(order) 
        });
      } else {
        const { data: userData } = await supabase.auth.getUser();
        if (userData.user) {
          await supabase.from('user_preferences').upsert({
            user_id: userData.user.id,
            home_screen_order: order,
            updated_at: new Date().toISOString(),
          });
        }
      }
    } catch (e) {
      console.error("Failed to save order:", e);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id && over) {
      setItems((prevItems) => {
        const oldIndex = prevItems.findIndex((i: AppItem) => i.id === active.id);
        const newIndex = prevItems.findIndex((i: AppItem) => i.id === over.id);
        const newItems = arrayMove(prevItems, oldIndex, newIndex);
        
        // Save new order asynchronously
        const newOrder = newItems.map((i: AppItem) => i.id);
        saveOrder(newOrder);

        return newItems;
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center h-full w-full bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col h-full w-full bg-background/95 overflow-y-auto">
      <div className="flex-1 w-full" style={{ padding: '40px 20px' }}>
        <DndContext 
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
            <SortableContext 
              items={items.map((i: AppItem) => i.id)}
              strategy={rectSortingStrategy}
            >
              {items.map((app) => (
                <SortableAppItem 
                  key={app.id} 
                  app={app} 
                  onClick={() => {
                    if (app.isAppRoute) {
                      navigate({ to: `/app/${app.id}` as any });
                    } else {
                      navigate({ to: app.route as any });
                    }
                  }}
                />
              ))}
            </SortableContext>
          </div>
        </DndContext>
      </div>
    </div>
  );
}
