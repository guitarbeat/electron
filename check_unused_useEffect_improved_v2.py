import os
import re

def check_file(filepath):
    try:
        with open(filepath, 'r') as f:
            content = f.read()
    except:
        return

    # Check if useEffect is imported
    if re.search(r'import\s+.*useEffect.*from\s+[\'"]react[\'"]', content):
        # Check usage
        lines = content.split('\n')
        usage_count = 0
        for line in lines:
             # Exclude import lines
             if not line.strip().startswith('import') and 'useEffect' in line:
                 usage_count += 1

        if usage_count == 0:
            print(f"Possible unused useEffect in {filepath}")

for root, dirs, files in os.walk('.'):
    if 'node_modules' in dirs:
        dirs.remove('node_modules')
    if '.git' in dirs:
        dirs.remove('.git')

    for file in files:
        if file.endswith('.tsx') or file.endswith('.ts'):
            check_file(os.path.join(root, file))
