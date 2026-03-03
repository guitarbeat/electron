with open('components/effects/Confetti.tsx', 'r') as f:
    content = f.read()

content = content.replace("<>", "<div>").replace("</>", "</div>")

with open('components/effects/Confetti.tsx', 'w') as f:
    f.write(content)
