export const PIN_LENGTH = 4;

export type PinFlowMode = "enter" | "set" | "change";

export type PinPhase =
  | "enter"
  | "set-new"
  | "set-confirm"
  | "change-current"
  | "change-new"
  | "change-confirm";

export interface PinFlowState {
  mode: PinFlowMode;
  phase: PinPhase;
  currentPin: string;
  newPin: string;
  digits: string;
  error: string;
  isShaking: boolean;
}

const phaseForMode = (mode: PinFlowMode): PinPhase => {
  if (mode === "enter") return "enter";
  if (mode === "set") return "set-new";
  return "change-current";
};

export const createPinFlowState = (mode: PinFlowMode): PinFlowState => ({
  mode,
  phase: phaseForMode(mode),
  currentPin: "",
  newPin: "",
  digits: "",
  error: "",
  isShaking: false,
});

export type PinFlowAction =
  | { type: "reset"; mode: PinFlowMode }
  | { type: "digit"; value: number }
  | { type: "backspace" }
  | { type: "clear-error" }
  | { type: "clear-shake" }
  | { type: "set-error"; message: string }
  | { type: "clear-digits" }
  | { type: "set-digits"; digits: string }
  | { type: "advance-set-new" }
  | { type: "advance-change-current" }
  | { type: "advance-change-new" };

export const pinFlowReducer = (
  state: PinFlowState,
  action: PinFlowAction,
): PinFlowState => {
  switch (action.type) {
    case "reset":
      return createPinFlowState(action.mode);
    case "digit": {
      if (state.digits.length >= PIN_LENGTH) {
        return state;
      }
      return {
        ...state,
        digits: `${state.digits}${action.value}`,
        error: "",
      };
    }
    case "backspace":
      return {
        ...state,
        digits: state.digits.slice(0, -1),
        error: "",
      };
    case "clear-error":
      return { ...state, error: "" };
    case "clear-shake":
      return { ...state, isShaking: false };
    case "set-error":
      return {
        ...state,
        error: action.message,
        isShaking: true,
      };
    case "clear-digits":
      return { ...state, digits: "" };
    case "set-digits":
      return {
        ...state,
        digits: action.digits,
        error: "",
      };
    case "advance-set-new":
      return {
        ...state,
        phase: "set-confirm",
        newPin: state.digits,
        digits: "",
        error: "",
      };
    case "advance-change-current":
      return {
        ...state,
        phase: "change-new",
        currentPin: state.digits,
        digits: "",
        error: "",
      };
    case "advance-change-new":
      return {
        ...state,
        phase: "change-confirm",
        newPin: state.digits,
        digits: "",
        error: "",
      };
    default:
      return state;
  }
};

export const getPinFlowTitle = (
  state: PinFlowState,
  user: string,
  isRequiredSetup: boolean,
): string => {
  switch (state.phase) {
    case "enter":
      return `Sign in as ${user}`;
    case "set-new":
      return isRequiredSetup ? `Set a PIN for ${user}` : `Create PIN for ${user}`;
    case "set-confirm":
      return "Confirm new PIN";
    case "change-current":
      return "Enter current PIN";
    case "change-new":
      return "Choose new PIN";
    case "change-confirm":
      return "Confirm new PIN";
    default:
      return "Enter PIN";
  }
};

export const getPinSubmitLabel = (
  state: PinFlowState,
  isRequiredSetup: boolean,
): string => {
  if (state.phase === "set-confirm" || state.phase === "change-confirm") {
    return isRequiredSetup ? "Save PIN" : "Save";
  }
  return "Continue";
};

export const needsPinSubmitButton = (mode: PinFlowMode): boolean =>
  mode !== "enter";
