with open("apps/web/src/components/quiz/index.tsx", "r") as f:
    content = f.read()

# Make the wrapper transparent
old_line = '<div className="quiz-retro-main" style={{ flex: 1, display: "flex", flexDirection: "column", maxWidth: isMobile ? bookWidth : bookWidth * 2 + 100 }}>'
new_line = '<div className="w-full flex-1 flex flex-col mx-auto" style={{ maxWidth: isMobile ? bookWidth : bookWidth * 2 + 100 }}>'
content = content.replace(old_line, new_line)

with open("apps/web/src/components/quiz/index.tsx", "w") as f:
    f.write(content)
