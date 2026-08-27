import re

with open("apps/web/src/app/component-styles.css", "r") as f:
    content = f.read()

# change .drift-wall-loading to position: relative and remove inset: 0
new_css = """.drift-wall-loading {
  position: relative;
  overflow: hidden;
  background: var(--color-surface-0);
  isolation: isolate;
}"""

content = re.sub(r'\.drift-wall-loading \{(.*?)\}', new_css, content, flags=re.DOTALL)

with open("apps/web/src/app/component-styles.css", "w") as f:
    f.write(content)

