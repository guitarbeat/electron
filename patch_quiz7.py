with open("apps/web/src/components/quiz/index.tsx", "r") as f:
    content = f.read()

# 1. Add isQuizStarted state
old_state = "  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);"
new_state = """  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [isQuizStarted, setIsQuizStarted] = useState(() => initialState.currentQuestionIndex > 0 || initialState.answers.length > 0);"""
content = content.replace(old_state, new_state)

# 2. Update page change handlers
# Wait, handleNext and handlePrevious need to work correctly with isQuizStarted.
old_handle_previous = """  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };"""
new_handle_previous = """  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    } else if (currentQuestionIndex === 0) {
      setIsQuizStarted(false);
    }
  };"""
content = content.replace(old_handle_previous, new_handle_previous)

# handleNext doesn't need to change, but if they click "Start" it should just set isQuizStarted.
# Wait, the Next button text is "Next". If it's on the cover, it should say "Start".
# But wait, there is no "Next" button if they are on the cover!
# Ah, the bottom nav row is rendered. 
# We should probably hide the nav row if they are on the cover, or change it to a "Start Quiz" button.

# 3. Modify the return block to adjust sizing and handle the cover interactions.
old_return = """  const bookWidth = Math.min(viewportWidth - 32, isMobile ? 350 : 500);
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
                ? "See my result"
                : "Next question"
            }
          >
            {currentQuestionIndex === totalQuestions - 1 ? "See my result" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );"""

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
    </div>
  );"""

content = content.replace(old_return, new_return)

with open("apps/web/src/components/quiz/index.tsx", "w") as f:
    f.write(content)
