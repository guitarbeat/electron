import os

DIR = "apps/web/src/components/movies"

with open(os.path.join(DIR, "MoviesTopControls.tsx"), "r") as f:
    content = f.read()
content = content.replace('import { MoviesTopControlsProps, ', 'import { ')
content = content.replace('} from "./shared";', '  MoviesTopControlsProps,\n} from "./shared";')
with open(os.path.join(DIR, "MoviesTopControls.tsx"), "w") as f:
    f.write(content)

with open(os.path.join(DIR, "MoviesView.tsx"), "r") as f:
    content = f.read()
content = content.replace('import { MoviesWorkspaceViewProps, ', 'import { ')
content = content.replace('} from "./shared";', '  MoviesWorkspaceViewProps,\n} from "./shared";')
with open(os.path.join(DIR, "MoviesView.tsx"), "w") as f:
    f.write(content)

