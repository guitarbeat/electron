with open("apps/web/src/components/quiz/index.tsx", "r") as f:
    content = f.read()

# Replace the old return statement in QuizFlow starting with <div className="quiz-retro-wrapper">
start_idx = content.find('  return (\n    <div className="quiz-retro-wrapper">', 1100)
end_idx = content.find('  );\n};\n\n/* -------------------------------------------------------------------------- */', start_idx)

if start_idx != -1 and end_idx != -1:
    new_return = """  const bookWidth = Math.min(viewportWidth - 32, isMobile ? 350 : 500);
  const bookHeight = Math.min(isMobile ? 550 : 600, 800);
  
  return (
    <div className="quiz-retro-wrapper" style={{ minHeight: "100%", display: "flex", flexDirection: "column" }}>
      <div className="quiz-retro-main" style={{ flex: 1, display: "flex", flexDirection: "column", maxWidth: isMobile ? bookWidth : bookWidth * 2 + 100 }}>
        <div className="quiz-retro-title-banner text-center" style={{ marginBottom: "2rem" }}>
          <span className="quiz-retro-kicker">Movie-night personality</span>
          <h2>Which character are you?</h2>
          <p>Seven quick questions. Go with your first instinct.</p>
        </div>

        <div className="flex-1 flex items-center justify-center relative w-full mb-8">
           <PageFlip
              pages={pages}
              pageWidth={bookWidth}
              pageHeight={bookHeight}
              spineShift={isMobile ? 0 : bookWidth / 2}
              pageRadius={16}
              turnAngle={180}
              shadow={0.35}
              interactive={false}
              turnedCount={currentQuestionIndex}
              onPageChange={(c) => setCurrentQuestionIndex(c)}
           />
        </div>

        <div className="quiz-retro-nav-row mt-auto">
          <button
            className="quiz-retro-btn quiz-retro-btn--secondary"
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
            aria-label="Previous question"
          >
            Back
          </button>
          <div className="flex-1 mx-4">
            <div className="quiz-retro-progress-track" style={{ height: 6, borderRadius: 3 }}>
              <div
                className="quiz-retro-progress-fill"
                style={{ transform: `scaleX(${progress / 100})`, borderRadius: 3 }}
              />
            </div>
            <div className="text-center mt-2 text-xs text-white/50 font-medium tracking-widest uppercase">
               {currentQuestionIndex + 1} of {totalQuestions}
            </div>
          </div>
          <button
            className="quiz-retro-btn"
            onClick={handleNext}
            disabled={!isAnswered}
            aria-label={
              currentQuestionIndex === totalQuestions - 1
                ? "See results"
                : "Next question"
            }
          >
            {currentQuestionIndex === totalQuestions - 1 ? "See results" : "Next"}
          </button>
        </div>
      </div>
    </div>"""

    content = content[:start_idx] + new_return + content[end_idx:]

with open("apps/web/src/components/quiz/index.tsx", "w") as f:
    f.write(content)

