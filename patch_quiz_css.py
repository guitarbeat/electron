with open("apps/web/src/app/styles/quiz.css", "r") as f:
    content = f.read()

content = content.replace(
    '  background:\n    radial-gradient(circle at 8% 4%, rgba(142, 214, 197, 0.08), transparent 28rem),\n    var(--color-surface-0);',
    '  background: transparent;'
)

with open("apps/web/src/app/styles/quiz.css", "w") as f:
    f.write(content)
