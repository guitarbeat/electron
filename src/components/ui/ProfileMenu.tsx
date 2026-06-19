import { useEffect, useState, type FC } from "react";
import type { User } from "@/shared/types";
import { useProfileSelection } from "@/app/ProfilePinContext";
import {
  LockIcon,
  LogoutIcon,
  SoundOffIcon,
  SoundOnIcon,
} from "@/common/Icons";
import { USER_OPTIONS } from "@/utils";
import {
  isSoundEnabled,
  setSoundEnabled,
  subscribeSoundPreference,
} from "@/utils/soundPreference";
import UserAvatar from "@/ui/UserAvatar";

const getPinSettingsLabel = (
  currentUser: User,
  userNeedsPin: (user: User) => boolean,
  userHasPin: (user: User) => boolean,
): string => {
  if (userNeedsPin(currentUser)) return "Finish PIN setup";
  if (userHasPin(currentUser)) return "Change PIN";
  return "Set PIN";
};

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
  } = useProfileSelection();
  const [soundEnabled, setSoundEnabledState] = useState(isSoundEnabled);

  useEffect(
    () => subscribeSoundPreference(() => setSoundEnabledState(isSoundEnabled())),
    [],
  );

  const pinSettingsLabel = currentUser
    ? getPinSettingsLabel(currentUser, userNeedsPin, userHasPin)
    : null;

  return (
    <div className="app-header__profile-picker">
      <div
        className="app-header__profile-list app-header__profile-list--inline"
        role="group"
        aria-label="Select profile"
      >
        {([...USER_OPTIONS] as User[]).map((profile) => {
          const isActive = currentUser === profile;
          const hasPin = userHasPin(profile);
          return (
            <button
              key={profile}
              type="button"
              className={`app-header__profile-option app-header__profile-option--inline${
                isActive ? " is-active is-logout" : ""
              }${hasPin ? " has-pin" : ""}`}
              onClick={() => selectProfile(profile)}
              disabled={isDisabled}
              aria-pressed={isActive}
              aria-label={
                isActive
                  ? `Log out as ${profile}`
                  : hasPin
                    ? `Sign in as ${profile} (PIN protected)`
                    : `Sign in as ${profile}`
              }
              title={isActive ? `Log out as ${profile}` : undefined}
            >
              <span className="app-header__option-avatar">
                <UserAvatar user={profile} />
                {isActive ? (
                  <span
                    className="app-header__avatar-logout-badge"
                    aria-hidden="true"
                  >
                    <LogoutIcon size={12} />
                  </span>
                ) : null}
              </span>
              <span className="app-header__option-name">
                {isActive ? "Log out" : profile}
              </span>
              {!isActive && hasPin ? <LockIcon size={12} /> : null}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        className="app-header__chrome-icon-btn"
        onClick={() => setSoundEnabled(!soundEnabled)}
        aria-label={soundEnabled ? "Mute UI sounds" : "Enable UI sounds"}
        aria-pressed={soundEnabled}
        title={soundEnabled ? "Mute UI sounds" : "Enable UI sounds"}
      >
        {soundEnabled ? <SoundOnIcon size={14} /> : <SoundOffIcon size={14} />}
      </button>

      {currentUser && pinSettingsLabel ? (
        <button
          type="button"
          className="app-header__chrome-icon-btn"
          onClick={openPinSettings}
          disabled={isDisabled || isSavingPin}
          aria-label={pinSettingsLabel}
          title={pinSettingsLabel}
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
