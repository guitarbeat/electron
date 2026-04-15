import re

with open('src/components/watchlist/MovieCard.tsx', 'r') as f:
    content = f.read()

content = content.replace("  onDelete: () => void;\n}", "}")
content = content.replace("  onEdit?: () => void;\n  onDelete: () => void;\n}", "  onEdit?: () => void;\n}")
content = content.replace("  onDelete,\n}) => {", "}) => {")

with open('src/components/watchlist/MovieCard.tsx', 'w') as f:
    f.write(content)
