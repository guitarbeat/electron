import sys

with open('services/quizService.ts', 'r') as f:
    lines = f.readlines()

new_lines = []
for line in lines:
    if ('console.warn' in line or 'console.error' in line) and '//' not in line.lstrip()[:2]:
        # Check if previous line already has disable
        if new_lines and 'eslint-disable-next-line no-console' in new_lines[-1]:
            new_lines.append(line)
        else:
            # Add indentation
            indent = line[:len(line) - len(line.lstrip())]
            new_lines.append(f'{indent}// eslint-disable-next-line no-console\n')
            new_lines.append(line)
    else:
        new_lines.append(line)

with open('services/quizService.ts', 'w') as f:
    f.writelines(new_lines)
