import React, { useState } from 'react';
import { useUser } from '../../context/UserContext';
import BottomSheet from '../ui/BottomSheet';
import Card from '../ui/Card';
import Button from '../ui/Button';
import UserSelection from '../common/UserSelection';
import { spacing, colors, typography, radius } from '../../design-system/tokens';

interface ProfileSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

const ProfileSheet: React.FC<ProfileSheetProps> = ({ isOpen, onClose }) => {
  const { currentUser, setCurrentUser } = useUser();
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleLogout = () => {
    setCurrentUser(null);
    setStatusMessage('Signed out to guest mode.');
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Profile & Security">
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
        <Card
          style={{
            padding: spacing.md,
            borderRadius: radius.lg,
            border: `1px solid ${colors.borderSecondary}35`,
            background:
              'radial-gradient(circle at 15% 0%, rgba(255,255,255,0.14), rgba(255,255,255,0)), rgba(18, 29, 54, 0.72)',
          }}
        >
          <p
            style={{
              margin: 0,
              marginBottom: spacing.xs,
              color: colors.textTertiary,
              fontSize: typography.fontSize.xs,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            Active profile
          </p>
          <p
            style={{
              margin: 0,
              color: colors.textPrimary,
              fontFamily: typography.fontFamily.heading.join(', '),
              fontSize: typography.fontSize.base,
              letterSpacing: '0.03em',
            }}
          >
            {currentUser || 'Guest Mode'}
          </p>
          <p
            style={{
              margin: `${spacing.xs} 0 0`,
              color: colors.textSecondary,
              fontSize: typography.fontSize.xs,
            }}
          >
            Choose Aaron, Electra, or guest below.
          </p>
        </Card>

        <UserSelection />

        <Card
          style={{
            padding: spacing.md,
            borderRadius: radius.lg,
            border: `1px solid ${colors.borderSecondary}35`,
            background: 'rgba(17, 28, 51, 0.7)',
          }}
        >
          <h3
            style={{
              margin: 0,
              marginBottom: spacing.sm,
              color: colors.textPrimary,
              fontSize: typography.fontSize.base,
              fontFamily: typography.fontFamily.heading.join(', '),
            }}
          >
            Session Management
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              style={{ border: `1px solid ${colors.borderSecondary}40` }}
            >
              Log Out to Anonymous Mode
            </Button>

            <Button variant="ghost" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>

          {statusMessage && (
            <p
              style={{
                margin: `${spacing.sm} 0 0`,
                fontSize: typography.fontSize.xs,
                color: colors.textSecondary,
              }}
            >
              {statusMessage}
            </p>
          )}
        </Card>
      </div>
    </BottomSheet>
  );
};

export default ProfileSheet;
