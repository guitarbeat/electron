import os
import re

print("Searching for unused useEffect...")
for root, dirs, files in os.walk("."):
    for file in files:
        if file.endswith(".tsx") or file.endswith(".ts"):
            path = os.path.join(root, file)
            if "node_modules" in path:
                continue

            try:
                with open(path, "r") as f:
                    content = f.read()

                # Check for import
                import_match = re.search(r"import\s+.*?useEffect.*?\s+from\s+['\"]react['\"]", content)
                if import_match:
                    # Remove comments to avoid false positives (naive)
                    content_no_comments = re.sub(r'//.*', '', content)
                    content_no_comments = re.sub(r'/\*[\s\S]*?\*/', '', content_no_comments)

                    # Count occurrences of 'useEffect'
                    # The import statement counts as 1.
                    # We want to see if there are MORE than 1.
                    count = len(re.findall(r'\buseEffect\b', content_no_comments))

                    if count <= 1:
                        print(f"Potential unused useEffect in {path} (count: {count})")
            except Exception as e:
                print(f"Error reading {path}: {e}")
