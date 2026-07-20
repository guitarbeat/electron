import MagicToggle from "@/components/ui/MagicToggle";
import MagicButtonGroup from "@/components/ui/MagicButtonGroup";
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

      <MagicToggle<User | "none">
        options={([...USER_OPTIONS] as User[]).map((profile) => {
          const isActive = currentUser === profile;
          const hasPin = userHasPin(profile);
          return {
            value: profile,
            label: (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span className="app-header__option-avatar">
                  <UserAvatar user={profile} />
                  {isActive ? (
                    <span className="app-header__avatar-logout-badge" aria-hidden="true">
                      <LogoutIcon size={12} />
                    </span>
                  ) : null}
                </span>
                <span className="app-header__option-name">
                  {isActive ? "Log out" : profile}
                </span>
                {!isActive && hasPin ? <LockIcon size={12} /> : null}
              </span>
            ),
            ariaLabel: isActive
              ? `Log out as ${profile}`
              : hasPin
                ? `Sign in as ${profile} (PIN protected)`
                : `Sign in as ${profile}`,
            disabled: isDisabled,
            className: isActive ? "is-logout" : "",
          };
        })}
        activeValue={currentUser || "none"}
        onChange={(val) => {
          if (val !== "none") selectProfile(val as User);
        }}
        ariaLabel="Select profile"
      />


      <MagicButtonGroup<"sound" | "pin">
        options={[
          {
            value: "sound",
            label: soundEnabled ? <SoundOnIcon size={14} /> : <SoundOffIcon size={14} />,
            ariaLabel: soundEnabled ? "Mute UI sounds" : "Enable UI sounds",
            disabled: false,
          },
          ...(currentUser && pinSettingsLabel
            ? [
                {
                  value: "pin" as const,
                  label: <LockIcon size={14} />,
                  ariaLabel: pinSettingsLabel,
                  disabled: isDisabled || isSavingPin,
                },
              ]
            : []),
        ]}
        onClick={(val) => {
          if (val === "sound") setSoundEnabled(!soundEnabled);
          if (val === "pin") openPinSettings();
        }}
        ariaLabel="App settings"
      />

      {selectionError ? (
        <p className="app-header__picker-error" role="alert">
          {selectionError}
        </p>
      ) : null}
    </div>
  );
};

export default ProfileMenu;
