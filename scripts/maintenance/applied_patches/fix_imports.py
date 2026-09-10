import os
import re

DIR = "apps/web/src/components/movies"

def has_import(content: str, name: str) -> bool:
    """Check if an import statement for `name` exists in the file content."""
    import_blocks = re.findall(r"^\s*import\b[\s\S]*?(?:from\s*[\x27\x22][^\x27\x22]+[\x27\x22]|;)", content, re.MULTILINE)
    pattern = r"\b" + re.escape(name) + r"\b"
    return any(re.search(pattern, block) for block in import_blocks)

# MovieCard needs MovieEditModal and MovieDetailsModal
with open(os.path.join(DIR, "MovieCard.tsx"), "r") as f:
    content = f.read()
if not has_import(content, "MovieEditModal"):
    content = 'import { MovieEditModal } from "./MovieEditModal";\n' + content
if not has_import(content, "MovieDetailsModal"):
    content = 'import { MovieDetailsModal } from "./MovieDetailsModal";\n' + content
with open(os.path.join(DIR, "MovieCard.tsx"), "w") as f:
    f.write(content)

# MovieSectionBody needs MovieCard, SuggestionCard, and missing types
with open(os.path.join(DIR, "MovieSectionBody.tsx"), "r") as f:
    content = f.read()
if not has_import(content, "MovieCard"):
    content = 'import { MovieCard } from "./MovieCard";\n' + content
if not has_import(content, "SuggestionCard"):
    content = 'import { SuggestionCard } from "./SuggestionCard";\n' + content

# Fix implicit any for MovieSectionBody handle events:
content = re.sub(r'handleMovieUpdate = \(updates\) =>', 'handleMovieUpdate = (updates: Partial<Movie>) =>', content)
content = re.sub(r'handleNoteAdded = \(note\) =>', 'handleNoteAdded = (note: string) =>', content)
content = re.sub(r'handleNoteEdited = \(memoryId, note\) =>', 'handleNoteEdited = (memoryId: string, note: string) =>', content)
content = re.sub(r'handleNoteDeleted = \(memoryId\) =>', 'handleNoteDeleted = (memoryId: string) =>', content)
content = re.sub(r'handleReactionToggled = \(memoryId\) =>', 'handleReactionToggled = (memoryId: string) =>', content)

with open(os.path.join(DIR, "MovieSectionBody.tsx"), "w") as f:
    f.write(content)

# MoviesTopControls needs MoviesTopControlsProps
# wait, what was MoviesTopControlsProps? It probably wasn't an interface, but a type or just an inline type?
# Let's check shared.tsx for it.
