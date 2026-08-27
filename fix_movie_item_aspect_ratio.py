import re

with open("apps/web/src/app/component-styles.css", "r") as f:
    content = f.read()

content = content.replace('.movie-item-container {\n  position: relative;\n  width: 100%;\n  height: 100%;\n  aspect-ratio: 2 / 3;', '.movie-item-container {\n  position: relative;\n  width: 100%;\n  height: 100%;\n  /* aspect-ratio: 2 / 3; removed to allow variable height */')

with open("apps/web/src/app/component-styles.css", "w") as f:
    f.write(content)

