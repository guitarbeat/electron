with open("apps/web/src/app/component-styles.css", "r") as f:
    css = f.read()

stack = []
fixed_css = []
for i, c in enumerate(css):
    if c == '{':
        stack.append(i)
        fixed_css.append(c)
    elif c == '}':
        if len(stack) > 0:
            stack.pop()
            fixed_css.append(c)
        else:
            # extra right brace, skip it
            pass
    else:
        fixed_css.append(c)

with open("apps/web/src/app/component-styles.css", "w") as f:
    f.write("".join(fixed_css))
