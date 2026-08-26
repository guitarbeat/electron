import type { FC } from "react";

interface DotFieldProps {
  dotRadius?: number;
  dotSpacing?: number;
  cursorRadius?: number;
  cursorForce?: number;
  [key: string]: unknown;
}

declare const DotField: FC<DotFieldProps>;
export default DotField;
