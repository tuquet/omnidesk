import {
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Separator,
} from '@omnidesk/ui';
import { ShieldIcon } from 'lucide-react';

export interface ProxyData {
  enabled: boolean;
  type: 'HTTP' | 'SOCKS5' | 'DIRECT';
  host: string;
  port: string;
  username: string;
  password: string;
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
          <Label className="text-sm font-medium">Proxy</Label>
        </div>
        <Switch
          checked={proxy.enabled}
          onCheckedChange={(checked) => update({ enabled: checked })}
        />
      </div>

      {proxy.enabled && (
        <div className="space-y-4 rounded-lg border p-4 bg-muted/30 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Type
            </Label>
            <Select
              value={proxy.type}
              onValueChange={(v) => update({ type: v as ProxyData['type'] })}
            >
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="HTTP">HTTP / HTTPS</SelectItem>
                <SelectItem value="SOCKS5">SOCKS5</SelectItem>
                <SelectItem value="DIRECT">Direct (No Proxy)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {proxy.type !== 'DIRECT' && (
            <>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 space-y-2">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Host
                  </Label>
                  <Input
                    className="h-8"
                    placeholder="proxy.example.com"
                    value={proxy.host}
                    onChange={(e) => update({ host: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Port
                  </Label>
                  <Input
                    className="h-8"
                    placeholder="8080"
                    value={proxy.port}
                    onChange={(e) => update({ port: e.target.value })}
                  />
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Username
                  </Label>
                  <Input
                    className="h-8"
                    placeholder="Optional"
                    value={proxy.username}
                    onChange={(e) => update({ username: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Password
                  </Label>
                  <Input
                    className="h-8"
                    type="password"
                    placeholder="Optional"
                    value={proxy.password}
                    onChange={(e) => update({ password: e.target.value })}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
