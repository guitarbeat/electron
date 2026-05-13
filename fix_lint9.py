import re
import glob

# The error was: Error [ERR_MODULE_NOT_FOUND]: Cannot find package '@/utils' imported from /home/runner/work/electron/electron/src/components/places/lib/placeSections.ts

# We need to find what imports from '@/utils' inside placeSections.ts/test.ts
# It probably imports from something like '@/utils/workspace.ts' which imports from '@/utils' ?

with open('src/utils/workspace.ts', 'r') as f:
    content = f.read()

# Replace any '@/utils' with '@/utils/index' or correct path
# Let's see what workspace imports
print(content[:200])
