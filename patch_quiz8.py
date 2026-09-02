with open("apps/web/src/components/quiz/index.tsx", "r") as f:
    content = f.read()

start_idx = content.find('  const bookWidth = Math.min(viewportWidth - 32, isMobile ? 350 : 500);')
end_idx = content.find('  );\n};\n\ninterface ResultsScreenProps', start_idx)

if start_idx != -1 and end_idx != -1:
    new_return = """  // Match the exact dimensions of the Movie Booklet
  const bookWidth = isMobile ? 280 : 380; // slightly wider than movie poster for quiz questions
  const bookHeight = isMobile ? 420 : 560;
  
  return (
    <div className="quiz-retro-wrapper" style={{ minHeight: "100%", display: "flex", flexDirection: "column" }}>
      <div className="quiz-retro-main" style={{ flex: 1, display: "flex", flexDirection: "column", maxWidth: isMobile ? bookWidth : bookWidth * 2 + 100 }}>
        
        {/* We removed the outside title banner, bringing it inside the booklet cover! */}
        <div className="flex-1 flex items-center justify-center relative w-full mb-8 mt-4 sm:mt-12">
           <PageFlip
              pages={pages}
              pageWidth={bookWidth}
              pageHeight={bookHeight}
              spineShift={isMobile ? 85 : 130}
              pageRadius={isMobile ? 6 : 8}
              turnAngle={180}
              shadow={0.45}
              interactive={true}
              turnedCount={isQuizStarted ? currentQuestionIndex + 1 : 0}
              onPageChange={(c) => {
                 if (c === 0) {
                     setIsQuizStarted(false);
                 } else {
                     setIsQuizStarted(true);
                     setCurrentQuestionIndex(Math.max(0, c - 1));
                 }
              }}
           />
        </div>

        {!isQuizStarted ? (
          <div className="flex justify-center mt-auto">
             <button
               className="quiz-retro-btn"
               onClick={() => setIsQuizStarted(true)}
               aria-label="Start Quiz"
             >
               Start Quiz
             </button>
          </div>
        ) : (
          <div className="quiz-retro-nav-row mt-auto">
            <button
              className="quiz-retro-btn quiz-retro-btn--secondary"
              onClick={handlePrevious}
              aria-label={currentQuestionIndex === 0 ? "Back to cover" : "Previous question"}
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
                  ? "See my result"
                  : "Next question"
              }
            >
              {currentQuestionIndex === totalQuestions - 1 ? "See my result" : "Next"}
            </button>
          </div>
        )}
      </div>
    </div>"""

    content = content[:start_idx] + new_return + content[end_idx:]

with open("apps/web/src/components/quiz/index.tsx", "w") as f:
    f.write(content)
