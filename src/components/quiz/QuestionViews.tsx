import React, { useCallback, useRef, useState } from "react";
import type {
  AgreeDisagreeQuestion as AgreeDisagreeQuestionType,
  ImageChoiceQuestion as ImageChoiceQuestionType,
  MultipleChoiceQuestion as MultipleChoiceQuestionType,
  XYAxisQuestion as XYAxisQuestionType,
} from "./lib/types";
import WebPImg from "./lib/WebPImg";

interface MultipleChoiceQuestionViewProps {
  question: MultipleChoiceQuestionType;
  selectedIndex: number | null;
  onSelect: (index: number) => void;
}

export const MultipleChoiceQuestionView: React.FC<
  MultipleChoiceQuestionViewProps
> = ({ question, selectedIndex, onSelect }) => {
  return (
    <div>
      <div className="quiz-retro-question-text">{question.question}</div>
      <div>
        {question.options.map((option, index) => (
          <button
            key={index}
            className={`quiz-retro-option${selectedIndex === index ? " quiz-retro-option--selected" : ""}`}
            onClick={() => onSelect(index)}
            aria-pressed={selectedIndex === index}
          >
            <span aria-hidden="true">
              {selectedIndex === index ? "✅ " : "◻ "}
            </span>
            {option.text}
          </button>
        ))}
      </div>
    </div>
  );
};

interface AgreeDisagreeQuestionViewProps {
  question: AgreeDisagreeQuestionType;
  selectedValue:
    | "stronglyDisagree"
    | "disagree"
    | "neutral"
    | "agree"
    | "stronglyAgree"
    | null;
  onSelect: (
    value:
      | "stronglyDisagree"
      | "disagree"
      | "neutral"
      | "agree"
      | "stronglyAgree",
  ) => void;
}

export const AgreeDisagreeQuestionView: React.FC<
  AgreeDisagreeQuestionViewProps
> = ({ question, selectedValue, onSelect }) => {
  const getNumericValue = (val: string | null) => {
    switch (val) {
      case "stronglyDisagree":
        return 0;
      case "disagree":
        return 25;
      case "neutral":
        return 50;
      case "agree":
        return 75;
      case "stronglyAgree":
        return 100;
      default:
        return 50;
    }
  };

  const getSymbolicValue = (val: number) => {
    if (val <= 20) return "stronglyDisagree";
    if (val <= 40) return "disagree";
    if (val <= 60) return "neutral";
    if (val <= 80) return "agree";
    return "stronglyAgree";
  };

  const sliderValue = getNumericValue(selectedValue);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    onSelect(
      getSymbolicValue(val) as
        | "stronglyDisagree"
        | "disagree"
        | "neutral"
        | "agree"
        | "stronglyAgree",
    );
  };

  return (
    <div>
      <div className="quiz-retro-question-text">{question.question}</div>
      <div className="quiz-retro-slider-wrap">
        <div className="quiz-retro-slider-labels">
          <span>😤 STRONGLY DISAGREE</span>
          <span>🤩 STRONGLY AGREE</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={sliderValue}
          onChange={handleSliderChange}
          className="quiz-retro-slider"
          aria-label="Agree/Disagree scale"
        />
        <div className="quiz-retro-slider-value">
          {sliderValue <= 20 && "😤 STRONGLY DISAGREE!!!"}
          {sliderValue > 20 && sliderValue <= 40 && "🙁 DISAGREE!"}
          {sliderValue > 40 && sliderValue <= 60 && "😐 NEUTRAL..."}
          {sliderValue > 60 && sliderValue <= 80 && "😊 AGREE!"}
          {sliderValue > 80 && "🤩 STRONGLY AGREE!!!"}
        </div>
        <div className="quiz-retro-slider-hint">
          DRAG THE SLIDER TO ANSWER!!!
        </div>
      </div>
    </div>
  );
};

interface ImageChoiceQuestionViewProps {
  question: ImageChoiceQuestionType;
  selectedIndex: number | null;
  onSelect: (index: number) => void;
}

export const ImageChoiceQuestionView: React.FC<
  ImageChoiceQuestionViewProps
> = ({ question, selectedIndex, onSelect }) => {
  return (
    <div>
      <div className="quiz-retro-question-text">{question.question}</div>
      <div
        className="quiz-retro-img-grid"
        style={{
          gridTemplateColumns:
            question.options.length === 2
              ? "repeat(2, 1fr)"
              : "repeat(auto-fit, minmax(160px, 1fr))",
        }}
      >
        {question.options.map((option, index) => (
          <button
            key={index}
            className={`quiz-retro-img-option${selectedIndex === index ? " quiz-retro-img-option--selected" : ""}`}
            onClick={() => onSelect(index)}
            aria-pressed={selectedIndex === index}
            aria-label={option.alt}
          >
            <WebPImg
              src={option.imageUrl}
              alt={option.alt}
              loading="eager"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
              }}
            />
            {selectedIndex === index && (
              <div className="quiz-retro-img-checkmark">✓</div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

interface XYAxisQuestionViewProps {
  question: XYAxisQuestionType;
  selectedPosition: { x: number; y: number } | null;
  onSelect: (position: { x: number; y: number }) => void;
}

export const XYAxisQuestionView: React.FC<XYAxisQuestionViewProps> = ({
  question,
  selectedPosition,
  onSelect,
}) => {
  const gridRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const calculatePosition = useCallback((clientX: number, clientY: number) => {
    if (!gridRef.current) return null;
    const rect = gridRef.current.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 2 - 1;
    const y = 1 - ((clientY - rect.top) / rect.height) * 2;
    return {
      x: Math.max(-1, Math.min(1, x)),
      y: Math.max(-1, Math.min(1, y)),
    };
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    const pos = calculatePosition(e.clientX, e.clientY);
    if (pos) onSelect(pos);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const pos = calculatePosition(e.clientX, e.clientY);
    if (pos) onSelect(pos);
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    const [touch] = Array.from(e.touches);
    if (!touch) return;
    const pos = calculatePosition(touch.clientX, touch.clientY);
    if (pos) onSelect(pos);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const [touch] = Array.from(e.touches);
    if (!touch) return;
    const pos = calculatePosition(touch.clientX, touch.clientY);
    if (pos) onSelect(pos);
  };

  const handleTouchEnd = () => setIsDragging(false);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const step = 0.1;
    const current = selectedPosition || { x: 0, y: 0 };
    const newPos = { ...current };

    switch (e.key) {
      case "ArrowLeft":
        newPos.x = Math.max(-1, current.x - step);
        break;
      case "ArrowRight":
        newPos.x = Math.min(1, current.x + step);
        break;
      case "ArrowUp":
        newPos.y = Math.min(1, current.y + step);
        break;
      case "ArrowDown":
        newPos.y = Math.max(-1, current.y - step);
        break;
      default:
        return;
    }

    e.preventDefault();
    onSelect(newPos);
  };

  const markerLeft = selectedPosition
    ? ((selectedPosition.x + 1) / 2) * 100
    : 50;
  const markerTop = selectedPosition
    ? ((1 - selectedPosition.y) / 2) * 100
    : 50;

  return (
    <div>
      <div className="quiz-retro-question-text">{question.question}</div>
      <div
        style={{ position: "relative", maxWidth: "380px", margin: "0 auto" }}
      >
        <div className="quiz-retro-xy-label" style={{ marginBottom: 4 }}>
          {question.yAxis.topLabel}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div
            className="quiz-retro-xy-label"
            style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
          >
            {question.xAxis.leftLabel}
          </div>
          <div
            ref={gridRef}
            role="button"
            aria-label="XY position selector"
            tabIndex={0}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onKeyDown={handleKeyDown}
            className="quiz-retro-xy-grid"
            style={{ flex: 1, aspectRatio: "1" }}
          >
            <div className="quiz-retro-xy-axis-h" />
            <div className="quiz-retro-xy-axis-v" />
            {selectedPosition && (
              <div
                className="quiz-retro-xy-marker"
                style={{
                  left: `${markerLeft}%`,
                  top: `${markerTop}%`,
                  transition: isDragging ? "none" : "all 0.15s ease-out",
                }}
              />
            )}
          </div>
          <div
            className="quiz-retro-xy-label"
            style={{ writingMode: "vertical-rl" }}
          >
            {question.xAxis.rightLabel}
          </div>
        </div>
        <div className="quiz-retro-xy-label" style={{ marginTop: 4 }}>
          {question.yAxis.bottomLabel}
        </div>
      </div>
      {selectedPosition && (
        <div
          style={{
            textAlign: "center",
            marginTop: 6,
            fontSize: "9px",
            color: "#888888",
            fontFamily: '"Comic Neue", "Comic Sans MS", cursive',
          }}
          role="status"
          aria-live="polite"
        >
          Position: ({selectedPosition.x.toFixed(2)},{" "}
          {selectedPosition.y.toFixed(2)})
        </div>
      )}
    </div>
  );
};
