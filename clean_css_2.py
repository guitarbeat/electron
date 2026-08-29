import re
with open("apps/web/src/app/component-styles.css", "r") as f:
    css = f.read()

css = re.sub(r'@[kK]eyframes\s+(overlayIn|panelIn|pinShake|dotPop)[^{]*{[^{}]*({[^{}]*}[^{}]*)*[^}]*}', '', css, flags=re.DOTALL)
css = re.sub(r'@[kK]eyframes\s+(overlayIn|panelIn|pinShake|dotPop)[^{]*{[^{}]*({[^{}]*}[^{}]*)*}', '', css, flags=re.DOTALL)

with open("apps/web/src/app/component-styles.css", "w") as f:
    f.write(css)
