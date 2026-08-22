import React, { useId } from "react";
import DOMPurify from "dompurify";
import parse from "html-react-parser";
import {
  DEFAULT_ELECTRON_MARK_VARIANT,
  getElectronMarkSvgMarkup,
  type ElectronMarkPalette,
  type ElectronMarkVariant,
} from "./ElectronMarkData";

export interface ElectronMarkProps {
  variant?: ElectronMarkVariant;
  size?: number | string;
  className?: string;
  title?: string;
  monochrome?: boolean;
  palette?: Partial<ElectronMarkPalette>;
  style?: React.CSSProperties;
}

const ElectronMark: React.FC<ElectronMarkProps> = ({
  variant = DEFAULT_ELECTRON_MARK_VARIANT,
  size = 64,
  className,
  title,
  monochrome = false,
  palette,
  style,
}) => {
  const idPrefix = useId().replaceAll(":", "");
  const markup = getElectronMarkSvgMarkup(variant, {
    size,
    title,
    monochrome,
    palette,
    idPrefix,
  });

  const resolvedSize = typeof size === "number" ? `${size}px` : size;

  return (
    <span
      className={className}
      style={{
        display: "inline-flex",
        width: resolvedSize,
        height: resolvedSize,
        lineHeight: 0,
        flex: "0 0 auto",
        ...style,
      }}
    >
      {parse(
        DOMPurify.sanitize(markup, {
          USE_PROFILES: { svg: true },
          FORBID_TAGS: ["use", "foreignObject"],
          FORBID_ATTR: ["href", "xlink:href"],
        }),
      )}
    </span>
  );
};

export default ElectronMark;
