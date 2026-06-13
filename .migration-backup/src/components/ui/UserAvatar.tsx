import { type FC, useState } from 'react';
import { USER_PHOTOS } from '@/shared/types';
import type { User } from '@/shared/types';

interface Props {
  user: User | null;
}

const PersonIcon: FC = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
    <path d="M4 20c0-4 4-6 8-6s8 2 8 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

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
        <PersonIcon />
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

  return (
    <span className="app-header__avatar-initial">
      {user.charAt(0)}
    </span>
  );
};

export default UserAvatar;
