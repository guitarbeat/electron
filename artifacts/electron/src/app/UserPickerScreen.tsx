import { useState, type FC } from "react";
import { useUser } from "@/app/useProviders";
import { usePins } from "@/hooks/usePins";
import { USER_OPTIONS, consoleError, getErrorMessage } from "@/utils";
import { USER_PHOTOS } from "@/shared/types";
import type { User } from "@/shared/types";
import PinDialog from "@/common/PinDialog";

const UserCard: FC<{
  user: User;
  hasPin: boolean;
  disabled: boolean;
  onClick: (user: User) => void;
}> = ({ user, hasPin, disabled, onClick }) => {
  const [imgFailed, setImgFailed] = useState(false);
  const photoUrl = USER_PHOTOS[user];

  return (
    <button
      type="button"
      className="ups-card"
      onClick={() => onClick(user)}
      disabled={disabled}
      aria-label={hasPin ? `Sign in as ${user} (PIN required)` : `Sign in as ${user}`}
    >
      <div className="ups-card__avatar">
        {photoUrl && !imgFailed ? (
          <img
            src={photoUrl}
            alt=""
            className="ups-card__photo"
            draggable="false"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <span className="ups-card__initial">{user.charAt(0)}</span>
        )}
        {hasPin && (
          <span className="ups-card__lock" aria-hidden="true">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="2" />
              <path d="M8 11V7a4 4 0 018 0v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </span>
        )}
      </div>
      <span className="ups-card__name">{user}</span>
    </button>
  );
};

const UserPickerScreen: FC = () => {
  const { setCurrentUser } = useUser();
  const { userHasPin, userNeedsPin, verifyUserPin, setUserPin } = usePins();
  const [pendingUser, setPendingUser] = useState<User | null>(null);
  const [pinSettingsUser, setPinSettingsUser] = useState<User | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSavingPin, setIsSavingPin] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSelect = async (user: User) => {
    setError(null);
    if (userHasPin(user)) {
      setPendingUser(user);
      return;
    }
    try {
      if (await setCurrentUser(user)) {
        if (userNeedsPin(user)) setPinSettingsUser(user);
      }
    } catch (err) {
      consoleError("Profile selection failed:", err);
      setError(getErrorMessage(err, "Could not sign in right now."));
    }
  };

  const handlePinSubmit = async (pin: string): Promise<boolean> => {
    if (!pendingUser) return false;
    setIsVerifying(true);
    try {
      const ok = await setCurrentUser(pendingUser, pin);
      if (ok) setPendingUser(null);
      return ok;
    } finally {
      setIsVerifying(false);
    }
  };

  const pinMode = pinSettingsUser && userHasPin(pinSettingsUser) ? "change" : "set";

  const handlePinSettingsCancel = () => {
    const required = pinSettingsUser && userNeedsPin(pinSettingsUser) ? pinSettingsUser : null;
    setPinSettingsUser(null);
    setError(null);
    if (required) void setCurrentUser(null);
  };

  const handlePinSettingsSubmit = async (pin: string, newPin?: string): Promise<boolean> => {
    if (!pinSettingsUser) return false;
    setIsSavingPin(true);
    try {
      if (pinMode === "set") {
        const saved = await setUserPin(pinSettingsUser, pin);
        if (saved) setPinSettingsUser(null);
        return saved;
      }
      if (!newPin) return verifyUserPin(pinSettingsUser, pin);
      if (!(await verifyUserPin(pinSettingsUser, pin))) return false;
      const saved = await setUserPin(pinSettingsUser, newPin);
      if (saved) setPinSettingsUser(null);
      return saved;
    } finally {
      setIsSavingPin(false);
    }
  };

  return (
    <div className="ups-root">
      <div className="ups-glow ups-glow--left" aria-hidden="true" />
      <div className="ups-glow ups-glow--right" aria-hidden="true" />

      <div className="ups-content">
        <h1 className="ups-heading">Who&apos;s watching?</h1>

        <div className="ups-grid">
          {(USER_OPTIONS as User[]).map((user) => (
            <UserCard
              key={user}
              user={user}
              hasPin={userHasPin(user)}
              disabled={isVerifying || isSavingPin}
              onClick={handleSelect}
            />
          ))}
        </div>

        {error && (
          <p className="ups-error" role="alert">{error}</p>
        )}
      </div>

      {pendingUser && (
        <PinDialog
          isOpen
          user={pendingUser}
          mode="enter"
          isLoading={isVerifying}
          onCancel={() => { setPendingUser(null); setError(null); }}
          onSubmit={handlePinSubmit}
        />
      )}
      {pinSettingsUser && (
        <PinDialog
          isOpen
          user={pinSettingsUser}
          mode={pinMode}
          isLoading={isSavingPin}
          onCancel={handlePinSettingsCancel}
          onSubmit={handlePinSettingsSubmit}
          isRequiredSetup={pinMode === "set" && userNeedsPin(pinSettingsUser)}
        />
      )}
    </div>
  );
};

export default UserPickerScreen;
