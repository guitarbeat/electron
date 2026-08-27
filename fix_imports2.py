import os

DIR = "apps/web/src/components/movies"

with open(os.path.join(DIR, "MoviesTopControls.tsx"), "r") as f:
    content = f.read()
if "MoviesTopControlsProps" not in content[:2000]:
    content = content.replace('import {', 'import { MoviesTopControlsProps, ', 1)
if "MovieRecommendationComposer" not in content[:2000]:
    content = 'import { MovieRecommendationComposer } from "./MovieRecommendationComposer";\n' + content
with open(os.path.join(DIR, "MoviesTopControls.tsx"), "w") as f:
    f.write(content)

with open(os.path.join(DIR, "MoviesView.tsx"), "r") as f:
    content = f.read()
if "MoviesWorkspaceViewProps" not in content[:2000]:
    content = content.replace('import {', 'import { MoviesWorkspaceViewProps, ', 1)
with open(os.path.join(DIR, "MoviesView.tsx"), "w") as f:
    f.write(content)

