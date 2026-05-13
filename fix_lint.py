import re

def process_file(filepath, replacements):
    with open(filepath, 'r') as f:
        content = f.read()
    for old, new in replacements:
        content = re.sub(old, new, content)
    with open(filepath, 'w') as f:
        f.write(content)

process_file('src/components/movies/MovieCard.tsx', [
    (r"import Button from '@/ui/Button';\n", ""),
    (r"  const featuredMemory = React.useMemo\(\n    \(\) => movieMemories\[0\] \|\| null,\n    \[movieMemories\]\n  \);\n", "")
])

process_file('src/components/places/PlacesList.tsx', [
    (r"import \{ radius \} from '\.\./\.\./theme/tokens\.ts';\n", "")
])

with open('src/components/places/PlacesList.tsx', 'r') as f:
    lines = f.readlines()
lines[369] = lines[369].replace("aren't", "aren&apos;t")
with open('src/components/places/PlacesList.tsx', 'w') as f:
    f.writelines(lines)


with open('src/components/ui/CinematicLandingHero.tsx', 'r') as f:
    lines = f.readlines()
lines[1020] = lines[1020].replace("'", "&apos;")
lines[1038] = lines[1038].replace("'", "&apos;")
with open('src/components/ui/CinematicLandingHero.tsx', 'w') as f:
    f.writelines(lines)

process_file('src/components/ui/Skeleton.tsx', [
    (r"import \{ colors, radius, spacing, shadows \} from '@/theme/tokens';\n", "import { radius } from '@/theme/tokens';\n")
])
