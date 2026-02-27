import os
import re

for root, dirs, files in os.walk("."):
    for file in files:
        if file.endswith(".tsx") or file.endswith(".ts"):
            path = os.path.join(root, file)
            if "node_modules" in path:
                continue
            with open(path, "r") as f:
                content = f.read()
                # Check if useEffect is imported
                if re.search(r"import.*useEffect.*from 'react'", content):
                    # check if used in body
                    # naive check: count occurrences
                    count = content.count("useEffect")
                    if count == 1:
                        print(f"Unused useEffect in {path}")
