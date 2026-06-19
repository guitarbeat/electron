import React from "react";
import { useProfilePin } from "@/app/ProfilePinContext";
import PinDialog from "@/common/PinDialog";

const ProfilePinPanel: React.FC = () => {
  const {
    pendingUser,
    pinSettingsUser,
    pinMode,
    isVerifying,
    isSavingPin,
    handlePinSubmit,
    handlePinSettingsCancel,
    handlePinSettingsSubmit,
    clearPendingUser,
    userNeedsPin,
  } = useProfilePin();

  if (pendingUser) {
    return (
      <PinDialog
        key={`enter-${pendingUser}`}
        isOpen
        user={pendingUser}
        mode="enter"
        isLoading={isVerifying}
        onCancel={clearPendingUser}
        onSubmit={handlePinSubmit}
      />
    );
  }

  if (pinSettingsUser) {
    return (
      <PinDialog
        key={`${pinMode}-${pinSettingsUser}`}
        isOpen
        user={pinSettingsUser}
        mode={pinMode}
        isLoading={isSavingPin}
        onCancel={handlePinSettingsCancel}
        onSubmit={handlePinSettingsSubmit}
        isRequiredSetup={pinMode === "set" && userNeedsPin(pinSettingsUser)}
      />
    );
  }

  return null;
};

export default ProfilePinPanel;
