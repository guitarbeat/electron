import React from "react";
import { isDevelopmentDeployment } from "./buildInfoDeployment";

export interface BuildInfoBadgeProps {
  id?: string;
  className?: string;
  style?: React.CSSProperties;
  onDismiss?: () => void;
  defaultVisible?: boolean;
  isDevelopment?: boolean;
}

interface BuildInfoBadgeState {
  isVisible: boolean;
}

export class BuildInfoBadge extends React.Component<
  BuildInfoBadgeProps,
  BuildInfoBadgeState
> {
  constructor(props: BuildInfoBadgeProps) {
    super(props);
    const isDev = props.isDevelopment ?? isDevelopmentDeployment();
    this.state = {
      isVisible: (props.defaultVisible ?? true) && isDev,
    };
  }

  handleDismiss = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    this.setState({ isVisible: false });
    this.props.onDismiss?.();
  };

  render() {
    const isDev = this.props.isDevelopment ?? isDevelopmentDeployment();
    if (!isDev || !this.state.isVisible) {
      return null;
    }

    return (
      <button
        type="button"
        id={this.props.id ?? "build-info-badge"}
        aria-label="v0.1 · AI Studio test (click to dismiss)"
        title="v0.1 · AI Studio test (click to dismiss)"
        onClick={this.handleDismiss}
        className={`build-info-badge ${this.props.className ?? ""}`.trim()}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(18, 20, 26, 0.72)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          color: "rgba(255, 255, 255, 0.75)",
          border: "1px solid rgba(255, 255, 255, 0.16)",
          borderRadius: "9999px",
          fontSize: "0.6875rem",
          fontWeight: 500,
          letterSpacing: "0.02em",
          padding: "3px 9px",
          lineHeight: 1.3,
          whiteSpace: "nowrap",
          cursor: "pointer",
          userSelect: "none",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
          transition:
            "opacity 160ms ease, transform 160ms ease, background-color 160ms ease",
          ...this.props.style,
        }}
      >
        v0.1 · AI Studio test
      </button>
    );
  }
}

export default BuildInfoBadge;
