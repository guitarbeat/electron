import os
def fix(fpath):
    with open(fpath, "r") as f:
        content = f.read()
    content = content.replace('MovieSectionIds\n  MoviesTopControlsProps,', 'MovieSectionIds,\n  MoviesTopControlsProps,')
    content = content.replace('MovieSectionIds\n  MoviesWorkspaceViewProps,', 'MovieSectionIds,\n  MoviesWorkspaceViewProps,')
    with open(fpath, "w") as f:
        f.write(content)

fix("apps/web/src/components/movies/MoviesTopControls.tsx")
fix("apps/web/src/components/movies/MoviesView.tsx")
