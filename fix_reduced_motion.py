import re
with open("apps/web/src/app/component-styles.css", "r") as f:
    css = f.read()

# Remove the media query for reduced motion that contains the invalid selector
css = re.sub(r'@media\s+\(prefers-reduced-motion:\s*reduce\)\s*{[^}]*}', '', css, flags=re.DOTALL)

with open("apps/web/src/app/component-styles.css", "w") as f:
    f.write(css)
