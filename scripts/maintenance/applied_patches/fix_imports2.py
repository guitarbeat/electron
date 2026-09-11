import os
import re

DIR = "apps/web/src/components/movies"


def strip_comments(code: str) -> str:
    """Remove single-line and multi-line comments from code before checking imports."""
    code = re.sub(r'/\*[\s\S]*?\*/', '', code)
    code = re.sub(r'//.*', '', code)
    return code


def has_import(content: str, name: str) -> bool:
    """Check if an import statement for `name` exists in the file content robustly."""
    clean_code = strip_comments(content)
    import_blocks = re.findall(
        r"\bimport\b[\s\S]*?(?:from\s*[\x27\x22][^\x27\x22]+[\x27\x22]|[\x27\x22][^\x27\x22]+[\x27\x22]|;)",
        clean_code,
    )
    pattern = r"\b" + re.escape(name) + r"\b"
    return any(re.search(pattern, block) for block in import_blocks)


with open(os.path.join(DIR, "MoviesTopControls.tsx"), "r") as f:
    content = f.read()
if not has_import(content, "MoviesTopControlsProps"):
    content = content.replace('import {', 'import { MoviesTopControlsProps, ', 1)
if not has_import(content, "MovieRecommendationComposer"):
    content = 'import { MovieRecommendationComposer } from "./MovieRecommendationComposer";\n' + content
with open(os.path.join(DIR, "MoviesTopControls.tsx"), "w") as f:
    f.write(content)

with open(os.path.join(DIR, "MoviesView.tsx"), "r") as f:
    content = f.read()
if not has_import(content, "MoviesWorkspaceViewProps"):
    content = content.replace('import {', 'import { MoviesWorkspaceViewProps, ', 1)
with open(os.path.join(DIR, "MoviesView.tsx"), "w") as f:
    f.write(content)
