import os
import re

apps = ['omni-engine', 'omni-profile', 'omni-studio', 'web-portal']
for app in apps:
    file = f'd:/Repository/omnidesk/apps/{app}/src/config/navigation.ts'
    with open(file, 'r', encoding='utf8') as f:
        content = f.read()

    # Match everything between these two blocks including the headers
    pattern = r'// ─── Types ───────────────────────────────────────────────────────────────────.*?(?=(// ─── Navigation Groups ──────────────────────────────────────────────────────))'
    
    new_content = re.sub(pattern, '', content, flags=re.DOTALL)
    
    # Also replace import type { Permission } from './rbac'; with import type { Permission } from '@omnidesk/types';
    new_content = re.sub(r"import type \{ Permission \} from '\./rbac';", "", new_content)
    
    # Add export type at top
    header = "export type { NavItem, NavGroup, DocumentItem, BreadcrumbEntry, Permission } from '@omnidesk/types';\n"
    
    if "lucide-react" in new_content:
        lines = new_content.split('\n')
        last_lucide = -1
        for i, line in enumerate(lines):
            if 'lucide-react' in line:
                last_lucide = i
        
        lines.insert(last_lucide + 1, header)
        new_content = '\n'.join(lines)
    else:
        new_content = header + new_content
        
    with open(file, 'w', encoding='utf8') as f:
        f.write(new_content)
