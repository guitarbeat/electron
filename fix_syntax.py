with open("apps/web/src/app/component-styles.css", "r") as f:
    lines = f.readlines()

new_lines = []
skip = False
for line in lines:
    # It looks like I left some floating properties when I deleted the .pin-dialog-overlay selector
    if line.strip() == '/* PinDialog styles */':
        # Let's skip until we see the end of these floating properties
        pass
    if line.strip() == 'position: fixed;' and len(new_lines) > 0 and new_lines[-1].strip() == '/* PinDialog styles */':
        skip = True
    
    if skip and 'padding: 1rem;' in line:
        skip = False
        continue

    if not skip:
        new_lines.append(line)

with open("apps/web/src/app/component-styles.css", "w") as f:
    f.writelines(new_lines)
