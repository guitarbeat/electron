import re
with open("apps/web/src/app/component-styles.css", "r") as f:
    css = f.read()

css = re.sub(r'\.pin-dialog-[a-zA-Z0-9_-]+(\s|\n|:)*{[^}]*}', '', css)
css = re.sub(r'\.workspace-search__[a-zA-Z0-9_-]+(\s|\n|:)*{[^}]*}', '', css)
css = re.sub(r'\.pin-dialog-overlay(\s|\n|:)*{[^}]*}', '', css)

with open("apps/web/src/app/component-styles.css", "w") as f:
    f.write(css)
