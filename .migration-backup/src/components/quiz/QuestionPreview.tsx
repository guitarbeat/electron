/**
 * QuestionPreview Component
 *
 * Live preview of how a question will appear to quiz takers.
 * This intentionally reuses the actual quiz presentation layer so the editor
 * preview stays visually in sync with the live experience.
 */

import React from "react";
import type {
  AgreeDisagreeQuestion,
  ImageChoiceQuestion,
  MultipleChoiceQuestion,
  QuizQuestion,
  XYAxisQuestion,
} from "./lib/types";
import {
  AgreeDisagreeQuestionView,
  ImageChoiceQuestionView,
  MultipleChoiceQuestionView,
  XYAxisQuestionView,
} from "./QuestionViews";
import "./retro-ad.css";

interface QuestionPreviewProps {
  question: QuizQuestion;
  previewMode?: "desktop" | "mobile";
}

const QuestionPreview: React.FC<QuestionPreviewProps> = ({
  question,
  previewMode = "desktop",
}) => {
  const isMobile = previewMode === "mobile";
  const scale = isMobile ? 0.84 : 0.74;

  const renderQuestion = () => {
    switch (question.type) {
      case "multiple-choice":
        return (
          <MultipleChoiceQuestionView
            question={question as MultipleChoiceQuestion}
            selectedIndex={null}
            onSelect={() => {}}
          />
        );
      case "agree-disagree":
        return (
          <AgreeDisagreeQuestionView
            question={question as AgreeDisagreeQuestion}
            selectedValue="neutral"
            onSelect={() => {}}
          />
        );
      case "image-choice":
        return (
          <ImageChoiceQuestionView
            question={question as ImageChoiceQuestion}
            selectedIndex={null}
            onSelect={() => {}}
          />
        );
      case "xy-axis":
        return (
          <XYAxisQuestionView
            question={question as XYAxisQuestion}
            selectedPosition={null}
            onSelect={() => {}}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="quiz-editor-preview">
      <div className="quiz-editor-preview__frame">
        <div className="quiz-editor-preview__header">
          <p className="quiz-editor-preview__title">Actual Quiz Preview</p>
          <div className="quiz-editor__preview-badge">
            {isMobile ? "Mobile viewport" : "Desktop viewport"}
          </div>
        </div>

        <div className="quiz-editor-preview__canvas">
          <div
            className="quiz-editor-preview__scale"
            style={{
              transform: `scale(${scale})`,
              maxWidth: isMobile ? "320px" : "420px",
              margin: "0 auto",
            }}
          >
            <div
              className="quiz-editor-preview__interaction-lock"
              aria-hidden="true"
            >
              <div className="quiz-retro-wrapper quiz-editor-preview__retro-shell">
                <div className="quiz-retro-marquee-bar">
                  <span className="quiz-retro-marquee-inner">
                    ★★★ LIVE PLAYER VIEW!!! THIS IS HOW THE QUESTION ACTUALLY
                    LOOKS!!! ★★★
                  </span>
                </div>

                <div className="quiz-retro-rainbow-border">
                  <div className="quiz-retro-header-bar">
                    <span>★ PREVIEWING THE REAL QUIZ SURFACE ★</span>
                  </div>
                </div>

                <div className="quiz-retro-main quiz-editor-preview__main">
                  <div className="quiz-retro-progress-wrap">
                    <div className="quiz-retro-progress-label">
                      ⚡ QUESTION PREVIEW LOADED SUCCESSFULLY!!! ⚡
                    </div>
                    <div className="quiz-retro-progress-track">
                      <div
                        className="quiz-retro-progress-fill"
                        style={{ width: "48%" }}
                      />
                      <div className="quiz-retro-progress-text">
                        48% COMPLETE
                      </div>
                    </div>
                    <div className="quiz-retro-progress-sub">
                      ⚡ SAME FONTS, COLORS, AND CONTROLS AS THE LIVE QUIZ!!! ⚡
                    </div>
                  </div>

                  <div className="quiz-retro-question-card">
                    <div className="quiz-retro-question-title-bar">
                      ▶ PLAYER-FACING QUESTION PREVIEW: ANSWER CAREFULLY!!!
                    </div>
                    {renderQuestion()}
                  </div>

                  <div className="quiz-retro-nav-row">
                    <button
                      type="button"
                      className="quiz-retro-btn quiz-retro-btn--secondary"
                      aria-label="Previous question"
                    >
                      {"<< BACK"}
                    </button>
                    <button
                      type="button"
                      className="quiz-retro-btn"
                      aria-label="Next question"
                    >
                      {"NEXT QUESTION >>>"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionPreview;
