import React, {
  forwardRef,
  useEffect,
  useId,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { WorkspaceComboboxConfig } from "./WorkspaceSearch";

const DEG = 180 / Math.PI;
const round = (value: number) => Math.round(value * 100) / 100;

interface Geometry {
  width: number;
  thickness: number;
  svgHeight: number;
  radius: number;
  direction: number;
  straight: boolean;
  point: (u: number, v: number) => [number, number];
  angleAt: (u: number) => number;
}

const buildGeometry = (
  width: number,
  bend: number,
  thickness: number,
  padding: number,
): Geometry => {
  const sagitta = Math.max(-width * 0.35, Math.min(bend, width * 0.35));
  const arc = Math.abs(sagitta);
  const direction = sagitta >= 0 ? 1 : -1;
  const svgHeight = thickness + arc + padding * 2;

  if (arc < 0.75) {
    const centerY = padding + thickness / 2;
    return {
      width,
      thickness,
      svgHeight,
      radius: 0,
      direction,
      straight: true,
      point: (u, v) => [u, centerY + v],
      angleAt: () => 0,
    };
  }

  const radius = (width * width * 0.25 + arc * arc) / (2 * arc);
  const centerX = width / 2;
  const apexY = padding + thickness / 2 + (direction > 0 ? 0 : arc);
  const centerY = apexY + direction * radius;
  const phi = Math.asin(Math.min(1, width / (2 * radius)));

  return {
    width,
    thickness,
    svgHeight,
    radius,
    direction,
    straight: false,
    point: (u, v) => {
      const theta = ((u - centerX) / centerX) * phi;
      const rho = radius - direction * v;
      return [
        centerX + rho * Math.sin(theta),
        centerY - direction * rho * Math.cos(theta),
      ];
    },
    angleAt: (u) => direction * ((u - centerX) / centerX) * phi * DEG,
  };
};

const formatPoint = (geometry: Geometry, u: number, v: number) => {
  const [x, y] = geometry.point(u, v);
  return `${round(x)} ${round(y)}`;
};

const edgeSegment = (
  geometry: Geometry,
  target: number,
  offset: number,
  leftToRight: boolean,
) => {
  if (geometry.straight) return `L ${formatPoint(geometry, target, offset)}`;
  const radius = round(geometry.radius - geometry.direction * offset);
  const sweep = leftToRight === geometry.direction > 0 ? 1 : 0;
  return `A ${radius} ${radius} 0 0 ${sweep} ${formatPoint(geometry, target, offset)}`;
};

const curvedRect = (
  geometry: Geometry,
  start: number,
  end: number,
  top: number,
  bottom: number,
  radius: number,
) => {
  const corner = Math.max(
    0,
    Math.min(radius, (bottom - top) / 2, (end - start) / 2),
  );
  return [
    `M ${formatPoint(geometry, start + corner, top)}`,
    edgeSegment(geometry, end - corner, top, true),
    `Q ${formatPoint(geometry, end, top)} ${formatPoint(geometry, end, top + corner)}`,
    `L ${formatPoint(geometry, end, bottom - corner)}`,
    `Q ${formatPoint(geometry, end, bottom)} ${formatPoint(geometry, end - corner, bottom)}`,
    edgeSegment(geometry, start + corner, bottom, false),
    `Q ${formatPoint(geometry, start, bottom)} ${formatPoint(geometry, start, bottom - corner)}`,
    `L ${formatPoint(geometry, start, top + corner)}`,
    `Q ${formatPoint(geometry, start, top)} ${formatPoint(geometry, start + corner, top)}`,
    "Z",
  ].join(" ");
};

const curvedLine = (
  geometry: Geometry,
  start: number,
  end: number,
  offset: number,
) =>
  `M ${formatPoint(geometry, start, offset)} ${edgeSegment(geometry, end, offset, true)}`;

export interface CurvedInputProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "value" | "onChange" | "onSubmit"
> {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  buttonText: string;
  secondaryButtonText?: string;
  onSecondarySubmit?: () => void;
  onSecondaryPointerEnter?: () => void;
  onSecondaryFocus?: () => void;
  secondaryButtonDisabled?: boolean;
  spinButtonText?: string;
  onSpinSubmit?: () => void;
  onSpinPointerEnter?: () => void;
  onSpinFocus?: () => void;
  spinButtonDisabled?: boolean;
  bend?: number;
  height?: number;
  isBusy?: boolean;
  buttonDisabled?: boolean;
  combobox?: WorkspaceComboboxConfig | null;
}

export const CurvedInput = forwardRef<HTMLInputElement, CurvedInputProps>(
  (
    {
      value,
      onChange,
      onSubmit,
      buttonText,
      secondaryButtonText,
      onSecondarySubmit,
      onSecondaryPointerEnter,
      onSecondaryFocus,
      secondaryButtonDisabled = false,
      spinButtonText,
      onSpinSubmit,
      onSpinPointerEnter,
      onSpinFocus,
      spinButtonDisabled = false,
      placeholder = "Add a movie, show, or place",
      bend = 24,
      height = 62,
      isBusy = false,
      buttonDisabled = false,
      combobox,
      disabled,
      onFocus,
      onBlur,
      onKeyDown,
      "aria-label": ariaLabel,
      ...inputProps
    },
    forwardedRef,
  ) => {
    const rootRef = useRef<HTMLFormElement | null>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);
    const textRef = useRef<SVGTextElement | null>(null);
    const [width, setWidth] = useState(0);
    const [focused, setFocused] = useState(false);
    const [hovered, setHovered] = useState(false);
    const [caretIndex, setCaretIndex] = useState(value.length);
    const [caretLength, setCaretLength] = useState(0);
    const uid = useId().replace(/:/g, "");
    const textPathId = `curved-input-text-${uid}`;
    const buttonPathId = `curved-input-button-${uid}`;
    const secondaryPathId = `curved-input-sec-button-${uid}`;
    const spinPathId = `curved-input-spin-button-${uid}`;
    const clipId = `curved-input-clip-${uid}`;

    useImperativeHandle(
      forwardedRef,
      () => inputRef.current as HTMLInputElement,
      [],
    );

    useEffect(() => {
      const element = rootRef.current;
      if (!element) return;
      const observer = new ResizeObserver(([entry]) => {
        setWidth(Math.round(entry?.contentRect.width ?? element.clientWidth));
      });
      observer.observe(element);
      return () => observer.disconnect();
    }, []);

    useLayoutEffect(() => {
      if (!textRef.current || !value) {
        setCaretLength(0);
        return;
      }
      try {
        setCaretLength(
          textRef.current.getSubStringLength(
            0,
            Math.min(caretIndex, value.length),
          ),
        );
      } catch {
        setCaretLength(0);
      }
    }, [caretIndex, value, width]);

    const targetBend = hovered ? -bend : bend;
    const [animatedBend, setAnimatedBend] = useState(targetBend);
    const animatedBendRef = useRef(animatedBend);

    useEffect(() => {
      animatedBendRef.current = animatedBend;
    });

    useEffect(() => {
      let active = true;
      const startTime = performance.now();
      const startBend = animatedBendRef.current;
      const duration = 280; // Smooth 280ms duration

      const step = (now: number) => {
        if (!active) return;
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Easing: easeInOutCubic
        const ease =
          progress < 0.5
            ? 4 * progress * progress * progress
            : 1 - Math.pow(-2 * progress + 2, 3) / 2;

        const current = startBend + (targetBend - startBend) * ease;
        setAnimatedBend(current);

        if (progress < 1) {
          requestAnimationFrame(step);
        }
      };

      requestAnimationFrame(step);
      return () => {
        active = false;
      };
    }, [targetBend]);

    const geometry = useMemo(
      () => (width > 2 ? buildGeometry(width, animatedBend, height, 8) : null),
      [animatedBend, height, width],
    );

    const layout = useMemo(() => {
      if (!geometry) return null;
      const inset = 6;
      const iconCenter = 35;
      const textStart = 66;

      const hasSpin = Boolean(spinButtonText);
      const hasSecondary = Boolean(secondaryButtonText);
      const gap = 5;

      const spinWidth = hasSpin
        ? Math.min(90, Math.max(62, (spinButtonText?.length ?? 4) * 7.2 + 24))
        : 0;
      const secondaryWidth = hasSecondary
        ? Math.min(
            90,
            Math.max(62, (secondaryButtonText?.length ?? 4) * 7.2 + 24),
          )
        : 0;
      const buttonWidth = Math.min(
        130,
        Math.max(76, buttonText.length * 7.2 + 26),
      );

      const spinEnd = geometry.width - inset;
      const spinStart = hasSpin ? spinEnd - spinWidth : spinEnd;

      const secondaryEnd = hasSpin ? spinStart - gap : geometry.width - inset;
      const secondaryStart = hasSecondary
        ? secondaryEnd - secondaryWidth
        : secondaryEnd;

      const buttonEnd = hasSecondary
        ? secondaryStart - gap
        : hasSpin
          ? spinStart - gap
          : geometry.width - inset;
      const buttonStart = buttonEnd - buttonWidth;

      return {
        inset,
        iconCenter,
        textStart,
        textEnd: Math.max(textStart + 24, buttonStart - 12),
        buttonStart,
        buttonEnd,
        secondaryStart,
        secondaryEnd,
        hasSecondary,
        spinStart,
        spinEnd,
        hasSpin,
      };
    }, [buttonText.length, secondaryButtonText, spinButtonText, geometry]);

    if (!geometry || !layout) {
      return <form ref={rootRef} className="curved-input" />;
    }

    const bandPath = curvedRect(
      geometry,
      0,
      width,
      -height / 2,
      height / 2,
      17,
    );
    const textBaseline = 5.5;
    const textPath = curvedLine(
      geometry,
      layout.textStart,
      layout.textEnd,
      textBaseline,
    );
    const buttonPath = curvedRect(
      geometry,
      layout.buttonStart,
      layout.buttonEnd,
      -height / 2 + layout.inset,
      height / 2 - layout.inset,
      13,
    );
    const buttonTextPath = curvedLine(
      geometry,
      layout.buttonStart,
      layout.buttonEnd,
      textBaseline,
    );

    const secondaryPath = layout.hasSecondary
      ? curvedRect(
          geometry,
          layout.secondaryStart,
          layout.secondaryEnd,
          -height / 2 + layout.inset,
          height / 2 - layout.inset,
          13,
        )
      : "";
    const secondaryTextPath = layout.hasSecondary
      ? curvedLine(
          geometry,
          layout.secondaryStart,
          layout.secondaryEnd,
          textBaseline,
        )
      : "";

    const spinPath = layout.hasSpin
      ? curvedRect(
          geometry,
          layout.spinStart,
          layout.spinEnd,
          -height / 2 + layout.inset,
          height / 2 - layout.inset,
          13,
        )
      : "";
    const spinTextPath = layout.hasSpin
      ? curvedLine(geometry, layout.spinStart, layout.spinEnd, textBaseline)
      : "";

    const clipPath = curvedRect(
      geometry,
      layout.textStart - 5,
      layout.textEnd + 5,
      -height / 2,
      height / 2,
      0,
    );
    const [iconX, iconY] = geometry.point(layout.iconCenter, 0);
    const iconAngle = geometry.angleAt(layout.iconCenter);

    const caretU = Math.min(layout.textEnd, layout.textStart + caretLength);
    const [caretX, caretY] = geometry.point(caretU, 0);
    const caretAngle = geometry.angleAt(caretU);

    const focusInput = () => {
      inputRef.current?.focus();
      window.requestAnimationFrame(() => {
        const index = value.length;
        inputRef.current?.setSelectionRange(index, index);
        setCaretIndex(index);
      });
    };

    return (
      <form
        ref={rootRef}
        className={`curved-input${focused ? " is-focused" : ""}${hovered ? " is-hovered" : ""}`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onSubmit={(event) => {
          event.preventDefault();
          if (!disabled && !buttonDisabled && !isBusy) onSubmit();
        }}
        noValidate
      >
        <svg
          className="curved-input__svg"
          width={width}
          height={round(geometry.svgHeight)}
          viewBox={`0 0 ${width} ${round(geometry.svgHeight)}`}
          onPointerDown={(event) => event.preventDefault()}
          onClick={focusInput}
          aria-hidden="true"
        >
          <defs>
            <clipPath id={clipId}>
              <path d={clipPath} />
            </clipPath>
          </defs>
          <path className="curved-input__focus-ring" d={bandPath} />
          <path className="curved-input__surface" d={bandPath} />
          <path id={textPathId} d={textPath} fill="none" />
          <g
            transform={`translate(${round(iconX)} ${round(iconY)}) rotate(${round(iconAngle)})`}
          >
            <circle className="curved-input__icon-chip" r="16" />
            <circle className="curved-input__lens" cx="-2" cy="-2" r="5.2" />
            <path className="curved-input__lens" d="M 2 2 L 7 7" />
          </g>
          <g clipPath={`url(#${clipId})`}>
            <text ref={textRef} className="curved-input__text">
              <textPath href={`#${textPathId}`}>{value}</textPath>
            </text>
            {!value ? (
              <text className="curved-input__placeholder">
                <textPath href={`#${textPathId}`}>{placeholder}</textPath>
              </text>
            ) : null}
            {focused ? (
              <g
                transform={`translate(${round(caretX)} ${round(caretY)}) rotate(${round(caretAngle)})`}
              >
                <line className="curved-input__caret" y1="-11" y2="11" />
              </g>
            ) : null}
          </g>
          <g
            className={`curved-input__button${disabled || buttonDisabled || isBusy ? " is-disabled" : ""}`}
            onClick={(event) => {
              event.stopPropagation();
              if (!disabled && !buttonDisabled && !isBusy) onSubmit();
            }}
          >
            <path className="curved-input__button-bg" d={buttonPath} />
            <path id={buttonPathId} d={buttonTextPath} fill="none" />
            <text className="curved-input__button-label" textAnchor="middle">
              <textPath href={`#${buttonPathId}`} startOffset="50%">
                {isBusy ? "Saving…" : buttonText}
              </textPath>
            </text>
          </g>
          {layout.hasSecondary && secondaryButtonText ? (
            <g
              className={`curved-input__button curved-input__button--secondary${
                disabled || secondaryButtonDisabled ? " is-disabled" : ""
              }`}
              onPointerEnter={onSecondaryPointerEnter}
              onFocus={onSecondaryFocus}
              tabIndex={0}
              onClick={(event) => {
                event.stopPropagation();
                if (
                  !disabled &&
                  !secondaryButtonDisabled &&
                  onSecondarySubmit
                ) {
                  onSecondarySubmit();
                }
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  event.stopPropagation();
                  if (
                    !disabled &&
                    !secondaryButtonDisabled &&
                    onSecondarySubmit
                  ) {
                    onSecondarySubmit();
                  }
                }
              }}
            >
              <path className="curved-input__button-bg" d={secondaryPath} />
              <path id={secondaryPathId} d={secondaryTextPath} fill="none" />
              <text className="curved-input__button-label" textAnchor="middle">
                <textPath href={`#${secondaryPathId}`} startOffset="50%">
                  {secondaryButtonText}
                </textPath>
              </text>
            </g>
          ) : null}
          {layout.hasSpin && spinButtonText ? (
            <g
              className={`curved-input__button curved-input__button--spin${
                disabled || spinButtonDisabled ? " is-disabled" : ""
              }`}
              onPointerEnter={onSpinPointerEnter}
              onFocus={onSpinFocus}
              tabIndex={0}
              onClick={(event) => {
                event.stopPropagation();
                if (!disabled && !spinButtonDisabled && onSpinSubmit) {
                  onSpinSubmit();
                }
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  event.stopPropagation();
                  if (!disabled && !spinButtonDisabled && onSpinSubmit) {
                    onSpinSubmit();
                  }
                }
              }}
            >
              <path className="curved-input__button-bg" d={spinPath} />
              <path id={spinPathId} d={spinTextPath} fill="none" />
              <text className="curved-input__button-label" textAnchor="middle">
                <textPath href={`#${spinPathId}`} startOffset="50%">
                  {spinButtonText}
                </textPath>
              </text>
            </g>
          ) : null}
        </svg>
        <input
          {...inputProps}
          ref={inputRef}
          className="curved-input__native"
          type="text"
          value={value}
          disabled={disabled}
          onChange={(event) => {
            onChange(event.target.value);
            setCaretIndex(
              event.target.selectionStart ?? event.target.value.length,
            );
          }}
          onSelect={(event) =>
            setCaretIndex(event.currentTarget.selectionStart ?? value.length)
          }
          onKeyUp={(event) =>
            setCaretIndex(event.currentTarget.selectionStart ?? value.length)
          }
          onKeyDown={onKeyDown}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          placeholder={placeholder}
          aria-label={ariaLabel ?? placeholder}
          role={combobox ? "combobox" : undefined}
          aria-expanded={combobox?.expanded}
          aria-controls={combobox?.controlsId}
          aria-autocomplete={combobox ? "list" : undefined}
          aria-activedescendant={combobox?.activeDescendantId}
          autoComplete="off"
          spellCheck={false}
        />
      </form>
    );
  },
);

CurvedInput.displayName = "CurvedInput";
