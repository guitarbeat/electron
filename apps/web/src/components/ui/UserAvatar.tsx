import { type FC, useState } from "react";
import { USER_PHOTOS } from "@/shared/types";
import type { User } from "@/shared/types";

interface Props {
  user: User | null;
}

/**
 * Renders a user avatar: photo (with initial fallback on error) or
 * a placeholder icon when user is null.
 * Size is controlled by parent CSS context via .app-header__option-avatar.
 */
const UserAvatar: FC<Props> = ({ user }) => {
  const [imgFailed, setImgFailed] = useState(false);

  if (!user) {
    return (
      <span className="app-header__avatar-placeholder">
      </span>
    );
  }

  const photoUrl = USER_PHOTOS[user];

  if (photoUrl && !imgFailed) {
    return (
      <img
        src={photoUrl}
        alt=""
        className="app-header__avatar-image"
        draggable="false"
        onError={() => setImgFailed(true)}
      />
    );
  }

  return <span className="app-header__avatar-initial">{user.charAt(0)}</span>;
};

export default UserAvatar;
