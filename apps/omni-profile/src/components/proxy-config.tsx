import {
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
} from '@omnidesk/ui';
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

const COUNTRIES = [
  { code: 'VN', name: 'Vietnam 🇻🇳' },
  { code: 'US', name: 'United States 🇺🇸' },
  { code: 'UK', name: 'United Kingdom 🇬🇧' },
  { code: 'SG', name: 'Singapore 🇸🇬' },
  { code: 'JP', name: 'Japan 🇯🇵' },
  { code: 'KR', name: 'South Korea 🇰🇷' },
  { code: 'AU', name: 'Australia 🇦🇺' },
];

export function ProxyConfig({ proxy, onChange }: ProxyConfigProps) {
  const update = (partial: Partial<ProxyData>) => {
    onChange({ ...proxy, ...partial });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldIcon className="h-4 w-4 text-muted-foreground" />
          <Label className="text-sm font-medium">Smart Proxy</Label>
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
              Select Region
            </Label>
            <Select
              value={proxy.country || 'VN'}
              onValueChange={(v) => update({ country: v, type: 'AUTO' })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Country" />
              </SelectTrigger>
              <SelectContent>
                {COUNTRIES.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    {c.name}
                  </SelectItem>
                ))}
                <SelectItem value="RANDOM">Random Region 🌍</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground pt-1">
              IP Address will be automatically assigned from{' '}
              {proxy.country === 'RANDOM' ? 'a random region' : 'this region'} when launching.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
