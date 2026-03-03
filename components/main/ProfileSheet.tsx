import React, { useState } from 'react';
import { useUser } from '../../context/UserContext';
import { usePins } from '../../hooks/usePins';
import BottomSheet from '../ui/BottomSheet';
import Card from '../ui/Card';
import Button from '../ui/Button';
import PinDialog from '../common/PinDialog';
import UserSelection from '../common/UserSelection';
import { spacing, colors, typography, radius } from '../../design-system/tokens';

interface ProfileSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

const ProfileSheet: React.FC<ProfileSheetProps> = ({ isOpen, onClose }) => {
  const { currentUser, setCurrentUser } = useUser();
  const { userHasPin, setUserPin, removeUserPin, verifyUserPin } = usePins();
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [pinMode, setPinMode] = useState<'set' | 'change'>('set');
  const [isPinLoading, setIsPinLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handlePinSubmit = async (pin: string, newPin?: string): Promise<boolean> => {
    if (!currentUser) return false;

    setIsPinLoading(true);
    try {
      if (pinMode === 'set') {
        const nextPin = newPin || pin;
        const success = await setUserPin(currentUser, nextPin);
        if (success) {
          setStatusMessage('PIN saved successfully.');
          setShowPinDialog(false);
        }
        return success;
      }

      if (newPin) {
        const success = await setUserPin(currentUser, newPin);
        if (success) {
          setStatusMessage('PIN updated successfully.');
          setShowPinDialog(false);
        }
        return success;
      }

      const isValid = await verifyUserPin(currentUser, pin);
      if (!isValid) {
        setStatusMessage('Current PIN did not match.');
      }
      return isValid;
    } catch (error) {
      setStatusMessage('Unable to update PIN right now.');
      return false;
    } finally {
      setIsPinLoading(false);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setStatusMessage('Signed out to guest mode.');
  };

  return (
    <>
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

      {currentUser && (
        <PinDialog
          isOpen={showPinDialog}
          user={currentUser}
          onCancel={() => setShowPinDialog(false)}
          onSubmit={handlePinSubmit}
          mode={pinMode}
          isLoading={isPinLoading}
        />
      )}
    </>
  );
};

export default ProfileSheet;
