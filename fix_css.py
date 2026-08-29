import re

with open("apps/web/src/app/component-styles.css", "r") as f:
    css = f.read()

css = re.sub(r'}\s*border-radius: 0\.75rem;.*?/\* Curved unified library input \*/', '} /* Curved unified library input */', css, flags=re.DOTALL)

with open("apps/web/src/app/component-styles.css", "w") as f:
    f.write(css)

