import { Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Switch, Input } from '@omnidesk/ui';;
import { ShieldIcon } from 'lucide-react';

export interface ProxyData {
  enabled: boolean;
  type: 'HTTP' | 'SOCKS5' | 'DIRECT' | 'AUTO';
  host: string;
  port: string;
  username: string;
  password: string;
  country?: string;
}

interface ProxyConfigProps {
  proxy: ProxyData;
  onChange: (proxy: ProxyData) => void;
}

export function ProxyConfig({ proxy, onChange }: ProxyConfigProps) {
  const update = (partial: Partial<ProxyData>) => {
    onChange({ ...proxy, ...partial });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldIcon className="h-4 w-4 text-muted-foreground" />
          <Label className="text-sm font-medium">Use Custom Proxy</Label>
        </div>
        <Switch
          checked={proxy.enabled}
          onCheckedChange={(checked) => update({ enabled: checked })}
        />
      </div>

      {proxy.enabled && (
        <div className="space-y-4 rounded-lg border p-4 bg-muted/30 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-1 space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Protocol
              </Label>
              <Select
                value={proxy.type && proxy.type !== 'AUTO' ? proxy.type : 'HTTP'}
                onValueChange={(v: 'HTTP' | 'SOCKS5') => update({ type: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="HTTP / SOCKS5" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HTTP">HTTP(s)</SelectItem>
                  <SelectItem value="SOCKS5">SOCKS5</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-1 space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Host / IP
              </Label>
              <Input
                placeholder="192.168.1.1"
                value={proxy.host || ''}
                onChange={(e) => update({ host: e.target.value })}
              />
            </div>
            <div className="col-span-1 space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Port
              </Label>
              <Input
                placeholder="8080"
                value={proxy.port || ''}
                onChange={(e) => update({ port: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Username (Optional)
              </Label>
              <Input
                placeholder="Username"
                value={proxy.username || ''}
                onChange={(e) => update({ username: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Password (Optional)
              </Label>
              <Input
                type="password"
                placeholder="Password"
                value={proxy.password || ''}
                onChange={(e) => update({ password: e.target.value })}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
