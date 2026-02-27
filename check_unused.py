import os
import re

print("Scanning for unused useEffect...")
for root, dirs, files in os.walk("."):
    for file in files:
        if file.endswith(".tsx") or file.endswith(".ts"):
            path = os.path.join(root, file)
            if "node_modules" in path:
                continue

            try:
                with open(path, "r") as f:
                    content = f.read()

                # Check import
                if re.search(r"import\s+.*?\buseEffect\b.*?from\s+['\"]react['\"]", content):
                    # Check usage in body (simple check)
                    # We remove the import line to avoid counting it
                    lines = content.split('\n')
                    usage_count = 0
                    for line in lines:
                        if "import" not in line and "useEffect" in line:
                            usage_count += 1

                    if usage_count == 0:
                        print(f"UNUSED useEffect in: {path}")
            except Exception as e:
                pass
