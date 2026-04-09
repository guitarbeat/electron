import re

file_path = "src/app/buildMinigameModals.tsx"
with open(file_path, "r") as f:
    content = f.read()

content = content.replace("export function buildFeatureModals", "// eslint-disable-next-line react-refresh/only-export-components\nexport function buildFeatureModals")
content = content.replace("const buildMinigameModals =", "// eslint-disable-next-line react-refresh/only-export-components\nconst buildMinigameModals =")

with open(file_path, "w") as f:
    f.write(content)
