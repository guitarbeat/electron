with open("apps/web/src/app/buildMinigameModals.tsx", "r") as f:
    content = f.read()

content = content.replace(
    '  contentStyle?: CSSProperties;\n}',
    '  contentStyle?: CSSProperties;\n  isUnstyled?: boolean;\n}'
)

old_quiz = """    {
      key: "quiz-experience",
      isOpen: showQuizExperience,
      onClose: () => setShowQuizExperience(false),
      title: "Quiz · Personality",
      ariaLabel: "Personality quiz",
      maxWidth: 720,
      maxHeight: 900,"""
new_quiz = """    {
      key: "quiz-experience",
      isOpen: showQuizExperience,
      onClose: () => setShowQuizExperience(false),
      title: "",
      ariaLabel: "Personality quiz",
      maxWidth: 900,
      maxHeight: 900,
      isUnstyled: true,"""
content = content.replace(old_quiz, new_quiz)

with open("apps/web/src/app/buildMinigameModals.tsx", "w") as f:
    f.write(content)

with open("apps/web/src/app/App.tsx", "r") as f:
    app_content = f.read()

app_content = app_content.replace(
    '            closeDisabledLabel={modal.closeDisabledLabel}\n          >',
    '            closeDisabledLabel={modal.closeDisabledLabel}\n            isUnstyled={modal.isUnstyled}\n          >'
)

with open("apps/web/src/app/App.tsx", "w") as f:
    f.write(app_content)
