import re

with open("apps/web/src/components/movies/MovieCard.tsx", "r") as f:
    content = f.read()

content = content.replace(
    '''          onEdit={
            onEditMetadata
              ? () => {
                  setIsDetailsOpen(false);
                  setIsTitleEditorOpen(true);
                }
              : undefined
          }''',
    '''          onEdit={
            onEditMetadata
              ? () => {
                  setIsTitleEditorOpen(true);
                }
              : undefined
          }'''
)

with open("apps/web/src/components/movies/MovieCard.tsx", "w") as f:
    f.write(content)

