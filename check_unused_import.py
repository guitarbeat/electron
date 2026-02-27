import os
import re

def check_file(filepath):
    try:
        with open(filepath, 'r') as f:
            content = f.read()
    except:
        return

    # Find imports from react
    match = re.search(r"import\s+.*\{([^}]+)\}.*from\s+['\"]react['\"]", content)
    if match:
        imported_items = [item.strip() for item in match.group(1).split(',')]

        # Check usage for each imported item
        for item in imported_items:
            # We want to check usage in the file, excluding the import line itself.
            usage_count = 0
            for line in content.split('\n'):
                if not line.strip().startswith('import') and re.search(r'\b' + re.escape(item) + r'\b', line):
                    usage_count += 1

            if usage_count == 0:
                print(f"Unused import '{item}' in {filepath}")

for root, dirs, files in os.walk('.'):
    if 'node_modules' in dirs:
        dirs.remove('node_modules')
    if '.git' in dirs:
        dirs.remove('.git')

    for file in files:
        if file.endswith('.tsx') or file.endswith('.ts'):
            check_file(os.path.join(root, file))
