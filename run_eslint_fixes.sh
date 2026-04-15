#!/bin/bash

# Fix 1: src/services/metadata/metadataService.ts
sed -i "s|throw new Error(\`Movie autocomplete failed: \${error instanceof Error ? error.message : 'Unknown error'}\`);|throw new Error(\`Movie autocomplete failed: \${error instanceof Error ? error.message : 'Unknown error'}\`, { cause: error });|" src/services/metadata/metadataService.ts
sed -i 's/  AUTOCOMPLETE_REQUEST_TIMEOUT_MS //g' src/services/metadata/metadataService.ts
sed -i 's/AUTOCOMPLETE_REQUEST_TIMEOUT_MS, //g' src/services/metadata/metadataService.ts

# Fix 2: src/services/metadata/config.ts
sed -i '/import { isValidUrl, sanitizeInput } from '\''..\/..\/utils\/shared'\'';/d' src/services/metadata/config.ts

# Fix 3: src/components/watchlist/MovieCard.tsx
sed -i 's/  onDelete: () => void;//' src/components/watchlist/MovieCard.tsx
sed -i 's/  onEdit?: () => void;/  onEdit?: () => void;\n}/' src/components/watchlist/MovieCard.tsx

# Fix 4: src/components/quiz/ResultsScreen.tsx
sed -i 's/const BLINK_COLORS = \[.*\];//' src/components/quiz/ResultsScreen.tsx

# Fix 5: src/components/memories/MemoryList.tsx
cat << 'PYTHON_EOF' > fix-memory-list-6.py
with open('src/components/memories/MemoryList.tsx', 'r') as f:
    content = f.read()

content = content.replace("""  // Validation for memory editing
  const validateMemoryNote = useMemo(
    () => createValidator({
      note: {
        ...CommonRules.messageContent,
        maxLength: 500,
        required: true,
      },
    }),
    []
  );""", "")

with open('src/components/memories/MemoryList.tsx', 'w') as f:
    f.write(content)
PYTHON_EOF
python3 fix-memory-list-6.py

# Fix 6: src/services/metadata/omdb.ts
sed -i 's/METADATA_REQUEST_TIMEOUT_MS, //g' src/services/metadata/omdb.ts
sed -i 's/  METADATA_REQUEST_TIMEOUT_MS //g' src/services/metadata/omdb.ts
sed -i "s|throw new Error('OMDB search request failed');|throw new Error('OMDB search request failed', { cause: error });|" src/services/metadata/omdb.ts
sed -i "s|throw new Error('OMDB details request failed');|throw new Error('OMDB details request failed', { cause: error });|" src/services/metadata/omdb.ts

# Fix 7: src/services/metadata/tvmaze.ts
sed -i "s|throw new Error('TVMaze request failed');|throw new Error('TVMaze request failed', { cause: error });|" src/services/metadata/tvmaze.ts
