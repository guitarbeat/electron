import re

with open('src/components/movies/MovieCard.tsx', 'r') as f:
    content = f.read()
content = re.sub(r"import \{ MediaCardInfo, MediaCardOverlay \} from '\./MediaCard';\n", "", content)
content = re.sub(r"import \{ MediaCardSuccessBadge \} from '\./MediaCardSuccessBadge';\n", "", content)
content = re.sub(r"import \{ Button \} from '\.\./ui/Button';\n", "", content)
content = re.sub(r"import \{ colors \} from '\.\./\.\./styles/theme';\n", "", content)
content = re.sub(r"import \{ MediaCardMetadata \} from '\./MediaCardMetadata';\n", "", content)
content = re.sub(r"    const featuredMemory = useMemo\(\(\) => movieMemories\[0\] \|\| null, \[movieMemories\]\);\n", "", content)
with open('src/components/movies/MovieCard.tsx', 'w') as f:
    f.write(content)

with open('src/components/movies/MoviesTopControls.tsx', 'r') as f:
    content = f.read()
content = re.sub(r"  selectedAutocompleteResult,\n", "", content)
with open('src/components/movies/MoviesTopControls.tsx', 'w') as f:
    f.write(content)

with open('src/components/places/PlaceCard.tsx', 'r') as f:
    content = f.read()
content = re.sub(r"import \{ Button \} from '@/ui/Button';\n", "", content)
with open('src/components/places/PlaceCard.tsx', 'w') as f:
    f.write(content)

with open('src/components/places/PlacesList.tsx', 'r') as f:
    content = f.read()
content = re.sub(r"const \{ radius \} = useTheme\(\);\n", "", content)
content = re.sub(r"aren't", "aren&apos;t", content)
with open('src/components/places/PlacesList.tsx', 'w') as f:
    f.write(content)

with open('src/components/ui/CinematicLandingHero.tsx', 'r') as f:
    content = f.read()
content = re.sub(r"import React, \{", "import {", content)
content = re.sub(r"that's", "that&apos;s", content)
content = re.sub(r"it's", "it&apos;s", content)
with open('src/components/ui/CinematicLandingHero.tsx', 'w') as f:
    f.write(content)

with open('src/components/ui/Skeleton.tsx', 'r') as f:
    content = f.read()
content = re.sub(r"import \{ colors, spacing, shadows \} from '\.\./\.\./styles/theme';\n", "", content)
with open('src/components/ui/Skeleton.tsx', 'w') as f:
    f.write(content)
