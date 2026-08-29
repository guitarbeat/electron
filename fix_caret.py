import re

with open("apps/web/src/app/component-styles.css", "r") as f:
    css = f.read()

css = css.replace(".curved-library-search \n\n@keyframes curvedInputCaret", "@keyframes curvedInputCaret")
css = css.replace(".curved-library-search \n@keyframes curvedInputCaret", "@keyframes curvedInputCaret")

# Let's just use regex to remove that orphaned selector:
css = re.sub(r'\.curved-library-search\s*@keyframes curvedInputCaret', '@keyframes curvedInputCaret', css)

with open("apps/web/src/app/component-styles.css", "w") as f:
    f.write(css)
