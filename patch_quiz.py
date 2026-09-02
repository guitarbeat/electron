import re

with open("apps/web/src/components/quiz/index.tsx", "r") as f:
    content = f.read()

# 1. Add imports
if 'import { PageFlip' not in content:
    content = content.replace(
        'import { WorkspaceFeatureSectionLoading } from "@/components/ui";',
        'import { WorkspaceFeatureSectionLoading, PageFlip, type PageFlipLeaf } from "@/components/ui";\nimport { useViewport } from "@/app/providerContexts";'
    )

# 2. Update QuizFlow
# First, add useViewport hook inside QuizFlow
if 'const { isMobile, viewportWidth } = useViewport();' not in content:
    content = content.replace(
        '  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);',
        '  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);\n  const { isMobile, viewportWidth } = useViewport();'
    )

# Update handleAnswer to take questionId
old_handle_answer = """  const handleAnswer = (
    answerIndex?: number,
    scaleValue?:
      "stronglyDisagree" | "disagree" | "neutral" | "agree" | "stronglyAgree",
    xyPosition?: { x: number; y: number },
  ) => {
    if (!currentQuestion) {
      return;
    }

    const nextAnswer: QuizAnswer = {
      questionId: currentQuestion.id,
      answerIndex,
      scaleValue,
      xyPosition,
    };

    setAnswers((prev) => {
      const filtered = prev.filter(
        (answer) => answer.questionId !== currentQuestion.id,
      );
      return [...filtered, nextAnswer];
    });
  };"""

new_handle_answer = """  const handleAnswer = (
    questionId: string,
    answerIndex?: number,
    scaleValue?:
      "stronglyDisagree" | "disagree" | "neutral" | "agree" | "stronglyAgree",
    xyPosition?: { x: number; y: number },
  ) => {
    const nextAnswer: QuizAnswer = {
      questionId,
      answerIndex,
      scaleValue,
      xyPosition,
    };

    setAnswers((prev) => {
      const filtered = prev.filter(
        (answer) => answer.questionId !== questionId,
      );
      return [...filtered, nextAnswer];
    });
    
    // Auto-advance
    setTimeout(() => {
      const qIndex = questions.findIndex(q => q.id === questionId);
      if (qIndex !== -1 && qIndex < totalQuestions - 1) {
        setCurrentQuestionIndex(qIndex + 1);
      }
    }, 450);
  };"""

content = content.replace(old_handle_answer, new_handle_answer)

# Replace renderCurrentQuestion with renderQuestion
old_render_current_question = """  const renderCurrentQuestion = () => {
    if (!currentQuestion) {
      return null;
    }

    switch (currentQuestion.type) {
      case "multiple-choice":
        return (
          <MultipleChoiceQuestionView
            key={currentQuestion.id}
            question={currentQuestion}
            selectedIndex={currentAnswer?.answerIndex ?? null}
            onSelect={(index) => handleAnswer(index)}
          />
        );
      case "agree-disagree":
        return (
          <AgreeDisagreeQuestionView
            key={currentQuestion.id}
            question={currentQuestion}
            selectedValue={currentAnswer?.scaleValue ?? null}
            onSelect={(value) => handleAnswer(undefined, value)}
          />
        );
      case "image-choice":
        return (
          <ImageChoiceQuestionView
            key={currentQuestion.id}
            question={currentQuestion}
            selectedIndex={currentAnswer?.answerIndex ?? null}
            onSelect={(index) => handleAnswer(index)}
          />
        );
      case "xy-axis":
        return (
          <XYAxisQuestionView
            key={currentQuestion.id}
            question={currentQuestion as XYAxisQuestion}
            selectedPosition={currentAnswer?.xyPosition ?? null}
            onSelect={(position) =>
              handleAnswer(undefined, undefined, position)
            }
          />
        );
      default:
        return null;
    }
  };"""

new_render_question = """  const renderQuestion = (q: QuizQuestion, answer?: QuizAnswer) => {
    switch (q.type) {
      case "multiple-choice":
        return (
          <MultipleChoiceQuestionView
            key={q.id}
            question={q}
            selectedIndex={answer?.answerIndex ?? null}
            onSelect={(index) => handleAnswer(q.id, index)}
          />
        );
      case "agree-disagree":
        return (
          <AgreeDisagreeQuestionView
            key={q.id}
            question={q}
            selectedValue={answer?.scaleValue ?? null}
            onSelect={(value) => handleAnswer(q.id, undefined, value)}
          />
        );
      case "image-choice":
        return (
          <ImageChoiceQuestionView
            key={q.id}
            question={q}
            selectedIndex={answer?.answerIndex ?? null}
            onSelect={(index) => handleAnswer(q.id, index)}
          />
        );
      case "xy-axis":
        return (
          <XYAxisQuestionView
            key={q.id}
            question={q as XYAxisQuestion}
            selectedPosition={answer?.xyPosition ?? null}
            onSelect={(position) =>
              handleAnswer(q.id, undefined, undefined, position)
            }
          />
        );
      default:
        return null;
    }
  };
  
  const pages: PageFlipLeaf[] = useMemo(() => {
    return questions.map((q, i) => {
      const answer = answers.find(a => a.questionId === q.id);
      return {
        id: q.id,
        front: (
          <div className="flex h-full w-full flex-col bg-[#14151a] text-white overflow-hidden" style={{ borderRadius: "inherit" }}>
             <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                 {renderQuestion(q, answer)}
             </div>
          </div>
        ),
        back: (
          <div className="flex h-full w-full flex-col bg-[#0f1115] text-slate-400 items-center justify-center border-l border-white/5" style={{ borderRadius: "inherit" }}>
             <div className="opacity-30">
                <div className="text-4xl font-bold mb-2">Q{i + 1}</div>
                <div className="text-sm tracking-widest uppercase">Completed</div>
             </div>
          </div>
        )
      };
    });
  }, [questions, answers, renderQuestion]);"""

content = content.replace(old_render_current_question, new_render_question)

# Replace the return JSX
old_return = """  return (
    <div className="quiz-retro-wrapper">
      <div className="quiz-retro-main">
        <div className="quiz-retro-title-banner">
          <span className="quiz-retro-kicker">Movie-night personality</span>
          <h2>Which character are you?</h2>
          <p>Seven quick questions. Go with your first instinct.</p>
        </div>

        <div
          className="quiz-retro-progress-wrap"
          role="progressbar"
          aria-valuenow={currentQuestionIndex + 1}
          aria-valuemin={1}
          aria-valuemax={totalQuestions}
          aria-label={`Question ${currentQuestionIndex + 1} of ${totalQuestions}`}
        >
          <div className="quiz-retro-progress-label">
            <span>
              Question {currentQuestionIndex + 1} of {totalQuestions}
            </span>
            <span>{progress}%</span>
          </div>
          <div className="quiz-retro-progress-track">
            <div
              className="quiz-retro-progress-fill"
              style={{ transform: `scaleX(${progress / 100})` }}
            />
            <div className="quiz-retro-progress-text">{progress}% COMPLETE</div>
          </div>
          <div className="quiz-retro-progress-sub">
            {currentQuestionIndex === totalQuestions - 1
              ? "Last one"
              : `${totalQuestions - currentQuestionIndex - 1} left after this`}
          </div>
        </div>

        <div
          key={currentQuestion.id}
          className="quiz-retro-question-card quiz-retro-question-stage"
        >
          {renderCurrentQuestion()}
        </div>

        <div className="quiz-retro-nav-row">
          <button
            className="quiz-retro-btn quiz-retro-btn--secondary"
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
            aria-label="Previous question"
          >
            Back
          </button>
          <button
            className="quiz-retro-btn"
            onClick={handleNext}
            disabled={!isAnswered}
            aria-label={
              currentQuestionIndex === totalQuestions - 1
                ? "Finish quiz"
                : "Next question"
            }
          >
            {currentQuestionIndex === totalQuestions - 1 ? "Finish" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );"""

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
                ? "Finish quiz"
                : "Next question"
            }
          >
            {currentQuestionIndex === totalQuestions - 1 ? "Finish" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );"""

content = content.replace(old_return, new_return)

with open("apps/web/src/components/quiz/index.tsx", "w") as f:
    f.write(content)
