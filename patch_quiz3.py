with open("apps/web/src/components/quiz/index.tsx", "r") as f:
    content = f.read()

start_idx = content.find('  return (\n    <div className="quiz-retro-wrapper">')
end_idx = content.find('  );\n};\n\n/* -------------------------------------------------------------------------- */', start_idx)
print(f"end_idx: {end_idx}")
