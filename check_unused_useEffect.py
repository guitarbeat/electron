import os
import re

def check_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # Check if useEffect is imported
    import_match = re.search(r'import\s+.*useEffect.*from\s+[\'"]react[\'"]', content)
    if import_match:
        # Check usage
        # Remove import lines to avoid false positives
        lines = content.split('\n')
        non_import_content = '\n'.join([line for line in lines if not line.strip().startswith('import')])

        # Simple usage check
        if 'useEffect' not in non_import_content:
            print(f"Unused useEffect in {filepath}")

for root, dirs, files in os.walk('.'):
    if 'node_modules' in dirs:
        dirs.remove('node_modules')
    if '.git' in dirs:
        dirs.remove('.git')

    for file in files:
        if file.endswith('.tsx') or file.endswith('.ts'):
            check_file(os.path.join(root, file))
