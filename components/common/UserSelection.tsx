/* eslint-disable react/prop-types */
import { useState } from 'react';
import { useUser } from '../../context/UserContext';
import type { User } from '../../types';
import { usePins } from '../../hooks/usePins';
import { useRandomCatImage } from '../../hooks/useRandomCatImage';
import PinDialog from './PinDialog';
import ImageWithFallback from './ImageWithFallback';
import { userImageSources } from '../../config/imageConfig';
import './UserSelection.css';

interface UserSelectionProps {
  onUserSelected?: (user: User | null) => void;
}

const UserSelection: React.FC<UserSelectionProps> = ({ onUserSelected }) => {
  const { currentUser, setCurrentUser } = useUser();
  const { userHasPin, verifyUserPin, isLoading } = usePins();
  const [pendingUser, setPendingUser] = useState<User | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const { sources: aaronCatSources } = useRandomCatImage();
  const { sources: electraCatSources } = useRandomCatImage();
  const activeUser: User = currentUser ?? 'Aaron';
  const getAvatarSources = (user: User): string[] => {
    const catSources = user === 'Aaron' ? aaronCatSources : electraCatSources;
    return catSources.length > 0 ? [...catSources, ...userImageSources[user]] : userImageSources[user];
  };

  const handleUserClick = (user: User) => {
    if (isLoading || isVerifying) return;

    if (user === currentUser) {
      setCurrentUser(null);
      onUserSelected?.(null);
      return;
    }

    if (userHasPin(user)) {
      setPendingUser(user);
    } else {
      setCurrentUser(user);
      onUserSelected?.(user);
    }
  };

  const handlePinSubmit = async (pin: string): Promise<boolean> => {
    if (!pendingUser) return false;
    setIsVerifying(true);
    try {
      const isValid = await verifyUserPin(pendingUser, pin);
      if (isValid) {
        setCurrentUser(pendingUser);
        onUserSelected?.(pendingUser);
        setPendingUser(null);
        return true;
      }
      return false;
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="user-selection-vapor">
      <div className="user-selection-vapor__scanlines" aria-hidden="true" />
      <div className="user-selection-vapor__sun" aria-hidden="true" />
      <div
        className="user-selection-vapor__aura user-selection-vapor__aura--left"
        aria-hidden="true"
      />
      <div
        className="user-selection-vapor__aura user-selection-vapor__aura--right"
        aria-hidden="true"
      />

      <header className="user-selection-vapor__header">
        <h3 className="user-selection-vapor__title">Who is watching?</h3>
        <p className="user-selection-vapor__subtitle">
          You are in guest mode. Pick <strong>Aaron</strong> or <strong>Electra</strong> to save
          personalized updates and actions.
        </p>
      </header>

      <div className="user-selection-vapor__carousel">
        <button
          type="button"
          className={`user-selection-vapor__profile-card is-side is-left user-selection-vapor__profile-card--aaron ${activeUser === 'Aaron' ? 'is-muted' : ''}`}
          onClick={() => handleUserClick('Aaron')}
          disabled={isLoading || isVerifying}
          aria-label="Select Aaron as profile"
        >
          <span className="user-selection-vapor__avatar-wrap">
            <ImageWithFallback sources={getAvatarSources('Aaron')} alt="Aaron profile" />
          </span>
          {userHasPin('Aaron') && <span className="user-selection-vapor__lock-badge">🔒</span>}
        </button>

        <button
          type="button"
          className={`user-selection-vapor__profile-card is-active ${activeUser === 'Aaron' ? 'user-selection-vapor__profile-card--aaron' : 'user-selection-vapor__profile-card--electra'}`}
          onClick={() => handleUserClick(activeUser)}
          disabled={isLoading || isVerifying}
          aria-label={`Select ${activeUser} as profile${userHasPin(activeUser) ? ' (PIN protected)' : ''}`}
        >
          <span className="user-selection-vapor__avatar-wrap">
            <ImageWithFallback sources={getAvatarSources(activeUser)} alt={`${activeUser} profile`} />
          </span>
          {userHasPin(activeUser) && <span className="user-selection-vapor__lock-badge">🔒</span>}
          <span className="user-selection-vapor__active-label">{activeUser}</span>
        </button>

        <button
          type="button"
          className={`user-selection-vapor__profile-card is-side is-right user-selection-vapor__profile-card--electra ${activeUser === 'Electra' ? 'is-muted' : ''}`}
          onClick={() => handleUserClick('Electra')}
          disabled={isLoading || isVerifying}
          aria-label="Select Electra as profile"
        >
          <span className="user-selection-vapor__avatar-wrap">
            <ImageWithFallback sources={getAvatarSources('Electra')} alt="Electra profile" />
          </span>
          {userHasPin('Electra') && <span className="user-selection-vapor__lock-badge">🔒</span>}
        </button>
      </div>

      <div className="user-selection-vapor__pager" aria-hidden="true">
        <span
          className={`user-selection-vapor__dot ${activeUser === 'Aaron' ? 'is-active' : ''}`}
        />
        <span
          className={`user-selection-vapor__dot ${activeUser === 'Electra' ? 'is-active' : ''}`}
        />
      </div>

      <footer className="user-selection-vapor__footer">
        <p>Select Profile</p>
        <button
          type="button"
          className="user-selection-vapor__add-button"
          aria-label="Add profile (coming soon)"
          disabled
        >
          +
        </button>
      </footer>

      <PinDialog
        isOpen={!!pendingUser}
        user={pendingUser || 'Aaron'}
        onCancel={() => setPendingUser(null)}
        onSubmit={handlePinSubmit}
        mode="enter"
        isLoading={isVerifying}
      />
    </div>
  );
};

export default UserSelection;
