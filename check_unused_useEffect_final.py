import os
import re

def check_file(filepath):
    try:
        with open(filepath, 'r') as f:
            content = f.read()
    except:
        return

    # Check if useEffect is imported
    # This regex is a bit more flexible to handle multi-line imports, but for simplicity
    # we'll assume it's on one line or at least 'useEffect' and 'from "react"' are detectable
    if 'useEffect' in content and ('from \'react\'' in content or 'from "react"' in content):
        # Remove comments to avoid false positives in comments
        content_no_comments = re.sub(r'//.*', '', content)
        content_no_comments = re.sub(r'/\*.*?\*/', '', content_no_comments, flags=re.DOTALL)

        lines = content_no_comments.split('\n')
        usage_count = 0
        import_line_count = 0

        for line in lines:
             stripped = line.strip()
             if stripped.startswith('import') and 'useEffect' in stripped and ('from \'react\'' in stripped or 'from "react"' in stripped):
                 import_line_count += 1
                 continue

             if 'useEffect' in line:
                 usage_count += 1

        # If imported but not used (usage_count == 0)
        # Note: This is a heuristic. It might miss some edge cases.
        if import_line_count > 0 and usage_count == 0:
            print(f"Possible unused useEffect in {filepath}")

for root, dirs, files in os.walk('.'):
    if 'node_modules' in dirs:
        dirs.remove('node_modules')
    if '.git' in dirs:
        dirs.remove('.git')
    if 'dist' in dirs:
        dirs.remove('dist')

    for file in files:
        if file.endswith('.tsx') or file.endswith('.ts'):
            check_file(os.path.join(root, file))
