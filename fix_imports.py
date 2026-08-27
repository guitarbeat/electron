import os
import re

DIR = "apps/web/src/components/movies"

# MovieCard needs MovieEditModal and MovieDetailsModal
with open(os.path.join(DIR, "MovieCard.tsx"), "r") as f:
    content = f.read()
if "MovieEditModal" not in content[:1000]: # just a hacky way to check imports
    content = 'import { MovieEditModal } from "./MovieEditModal";\n' + content
if "MovieDetailsModal" not in content[:1000]:
    content = 'import { MovieDetailsModal } from "./MovieDetailsModal";\n' + content
with open(os.path.join(DIR, "MovieCard.tsx"), "w") as f:
    f.write(content)

# MovieSectionBody needs MovieCard, SuggestionCard, and missing types
with open(os.path.join(DIR, "MovieSectionBody.tsx"), "r") as f:
    content = f.read()
if "MovieCard" not in content[:1000]:
    content = 'import { MovieCard } from "./MovieCard";\n' + content
if "SuggestionCard" not in content[:1000]:
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
