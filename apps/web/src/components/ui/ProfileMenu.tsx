import React from "react";
import { useUser } from "@/app/providerContexts";
import type { User } from "@/shared/types";

export const ProfileMenu: React.FC = () => {
  const { currentUser, setCurrentUser } = useUser();

  const handleSelectUser = async (user: User) => {
    if (currentUser === user) return;
    await setCurrentUser(user);
  };

  return (
    <div className="inline-profiles-container" role="group" aria-label="Profiles">
      <div className="profiles-switcher-row">
        {/* Aaron Avatar Button */}
        <button
          type="button"
          onClick={() => handleSelectUser("Aaron")}
          className={`profile-switcher-btn profile-switcher-btn--aaron ${
            currentUser === "Aaron" ? "is-active is-logged-in" : "is-logged-out"
          }`}
          title="Switch to Aaron"
          aria-label="Aaron profile"
          aria-pressed={currentUser === "Aaron"}
        >
          <div className="profile-switcher-face-wrap">
            <img
              src="/aaron-avatar.png"
              alt="Aaron"
              className="app-header__avatar-image"
              onError={(e) => {
                // Fallback pixel art svg if needed
                (e.currentTarget as HTMLImageElement).src =
                  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' fill='%23111827'/%3E%3Ccircle cx='16' cy='16' r='10' fill='%23f59e0b'/%3E%3C/svg%3E";
              }}
            />
          </div>
        </button>

        {/* Electra Avatar Button */}
        <button
          type="button"
          onClick={() => handleSelectUser("Electra")}
          className={`profile-switcher-btn profile-switcher-btn--electra ${
            currentUser === "Electra" ? "is-active is-logged-in" : "is-logged-out"
          }`}
          title="Switch to Electra"
          aria-label="Electra profile"
          aria-pressed={currentUser === "Electra"}
        >
          <div className="profile-switcher-face-wrap">
            <img
              src="/public/assets/aistudio/image_45c8f93a.png"
              alt="Electra"
              style={{
                objectFit: "cover",
                objectPosition: "97% 50%",
                transform: "scale(2.2)",
              }}
              className="app-header__avatar-image"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src =
                  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' fill='%23111827'/%3E%3Ccircle cx='16' cy='16' r='10' fill='%23ec4899'/%3E%3C/svg%3E";
              }}
            />
          </div>
        </button>
      </div>
    </div>
  );
};

export default ProfileMenu;
