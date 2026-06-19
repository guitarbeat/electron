import { useEffect, useState, type FC } from "react";
import type { User } from "@/shared/types";
import { useProfilePin } from "@/app/ProfilePinContext";
import { USER_OPTIONS } from "@/utils";
import {
  isSoundEnabled,
  setSoundEnabled,
  subscribeSoundPreference,
} from "@/utils/soundPreference";
import UserAvatar from "@/ui/UserAvatar";
import MagicToggle from "@/ui/MagicToggle";

const LockIcon: FC<{ size?: number }> = ({ size = 14 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
  >
    <rect
      x="5"
      y="11"
      width="14"
      height="10"
      rx="2"
      stroke="currentColor"
      strokeWidth="2"
    />
    <path
      d="M8 11V7a4 4 0 018 0v4"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const SoundOnIcon: FC<{ size?: number }> = ({ size = 14 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
  >
    <path
      d="M11 5L6 9H3v6h3l5 4V5z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <path
      d="M15.54 8.46a5 5 0 010 7.07"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M17.66 6.34a8 8 0 010 11.32"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const SoundOffIcon: FC<{ size?: number }> = ({ size = 14 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
  >
    <path
      d="M11 5L6 9H3v6h3l5 4V5z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <path
      d="M23 9l-6 6"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M17 9l6 6"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const LogoutIcon: FC<{ size?: number }> = ({ size = 14 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
  >
    <path
      d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <polyline
      points="16,17 21,12 16,7"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <line
      x1="21"
      y1="12"
      x2="9"
      y2="12"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ProfileMenu: FC = () => {
  const {
    currentUser,
    isDisabled,
    isSavingPin,
    selectionError,
    userHasPin,
    selectProfile,
    openPinSettings,
    userNeedsPin,
  } = useProfilePin();
  const [soundEnabled, setSoundEnabledState] = useState(isSoundEnabled);

  useEffect(() => subscribeSoundPreference(() => setSoundEnabledState(isSoundEnabled())), []);

  return (
    <div className="app-header__profile-picker">
      <div className="app-header__profile-toggle">
        <MagicToggle<string>
          options={([...USER_OPTIONS] as User[]).map((profile) => {
            const isActive = currentUser === profile;
            const hasPin = userHasPin(profile);
            return {
              value: profile,
              label: (
                <div className="app-header__option-content">
                  <span className="app-header__option-avatar">
                    <UserAvatar user={profile} />
                    {isActive ? (
                      <span
                        className="app-header__avatar-logout-badge"
                        aria-hidden="true"
                      >
                        <LogoutIcon size={10} />
                      </span>
                    ) : null}
                  </span>
                  <span className="app-header__option-name">
                    {isActive ? "Log out" : profile}
                  </span>
                  {!isActive && hasPin ? <LockIcon size={12} /> : null}
                </div>
              ),
              disabled: isDisabled,
              ariaLabel: isActive
                ? `Log out as ${profile}`
                : hasPin
                  ? `Sign in as ${profile} (PIN protected)`
                  : `Sign in as ${profile}`,
            };
          })}
          activeValue={currentUser ?? ""}
          onChange={(val) => selectProfile(val as User)}
          ariaLabel="Select profile"
        />
      </div>

      <button
        type="button"
        className="app-header__profile-pin-btn"
        onClick={() => setSoundEnabled(!soundEnabled)}
        aria-label={soundEnabled ? "Mute UI sounds" : "Enable UI sounds"}
        aria-pressed={soundEnabled}
        title={soundEnabled ? "Mute UI sounds" : "Enable UI sounds"}
      >
        {soundEnabled ? <SoundOnIcon size={14} /> : <SoundOffIcon size={14} />}
      </button>

      {currentUser ? (
        <button
          type="button"
          className="app-header__profile-pin-btn"
          onClick={openPinSettings}
          disabled={isDisabled || isSavingPin}
          aria-label={
            userNeedsPin(currentUser)
              ? "Finish PIN setup"
              : userHasPin(currentUser)
                ? "Change PIN"
                : "Set PIN"
          }
          title={
            userNeedsPin(currentUser)
              ? "Finish PIN setup"
              : userHasPin(currentUser)
                ? "Change PIN"
                : "Set PIN"
          }
        >
          <LockIcon size={14} />
        </button>
      ) : null}

      {selectionError ? (
        <p className="app-header__picker-error" role="alert">
          {selectionError}
        </p>
      ) : null}
    </div>
  );
};

export default ProfileMenu;
