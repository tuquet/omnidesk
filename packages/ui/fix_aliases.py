import glob
import re
import os

files = glob.glob('./src/**/*.tsx', recursive=True)

for f in files:
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    
    # Replace @/lib/utils with ../../lib/utils
    # But wait, if the file is in ui/components/ui/button.tsx, it's 2 levels deep
    # If the file is ui/components/ui/input-group.tsx, it's 2 levels deep
    # If it's ui/hooks/use-toast.ts it's 1 level deep. Let's just do all *.tsx in src/components/ui
    content = re.sub(r'from [\'"]@/lib/utils[\'"]', 'from "../../lib/utils"', content)
    content = re.sub(r'from [\'"]@/components/ui/([^C\'"]+)[\'"]', r'from "./\1"', content)
    
    with open(f, 'w', encoding='utf-8') as file:
        file.write(content)
print(f"Fixed {len(files)} files")
