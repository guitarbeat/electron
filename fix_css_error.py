with open("apps/web/src/app/component-styles.css", "r") as f:
    css = f.read()
css = css.replace("}", "}\n") # Just ensure it's not messed up. Wait, what is missing opening {?
