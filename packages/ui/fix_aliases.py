import glob
import re
import os

files = glob.glob('./src/**/*.ts', recursive=True) + glob.glob('./src/**/*.tsx', recursive=True)

src_dir = os.path.abspath('./src')

for f in files:
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    
    file_dir = os.path.dirname(os.path.abspath(f))
    rel_path = os.path.relpath(src_dir, file_dir).replace('\\', '/')
    
    if rel_path == '.':
        rel_path = './'
    else:
        rel_path = rel_path + '/'
        
    def replace_alias(match):
        quote = match.group(1)
        path = match.group(2)
        return f'{quote}{rel_path}{path}{quote}'
        
    content = re.sub(r'([\'"])@/(.*?)\1', replace_alias, content)
    
    with open(f, 'w', encoding='utf-8') as file:
        file.write(content)

print(f"Fixed {len(files)} files")
