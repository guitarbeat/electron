import React, { useState } from 'react';
import { useAppSession } from '@/context';
import Card from '@/ui/Card';
import Button from '@/ui/Button';
import { Input } from '@/ui/FormFields';
import { colors, spacing, typography } from '@/design-system';

const AccessGate: React.FC = () => {
  const { unlockApp, isSessionLoading } = useAppSession();
  const [secret, setSecret] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    const didUnlock = await unlockApp(secret);
    if (!didUnlock) {
      setError('Incorrect app secret.');
      return;
    }

    setSecret('');
  };

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: spacing.xl,
        background:
          'radial-gradient(circle at top, rgba(255, 182, 210, 0.18), transparent 32%), radial-gradient(circle at bottom, rgba(120, 213, 255, 0.12), transparent 28%), #140d16',
      }}
    >
      <Card
        variant="elevated"
        style={{
          width: 'min(100%, 420px)',
          padding: spacing.xl,
          display: 'flex',
          flexDirection: 'column',
          gap: spacing.lg,
          border: `1px solid ${colors.borderSubtle}`,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
          <p style={{ ...typography.presets.eyebrow, color: colors.textSecondary, margin: 0 }}>
            Shared Access
          </p>
          <h1
            style={{
              margin: 0,
              color: colors.textPrimary,
              fontFamily: typography.fontFamilyValue.heading,
              fontSize: typography.fontSize['2xl'],
            }}
          >
            Unlock the shared space
          </h1>
          <p style={{ margin: 0, color: colors.textSecondary }}>
            Enter the app secret to enable shared read access. Profile selection stays optional and
            only controls write access.
          </p>
        </div>

        <form
          onSubmit={(event) => {
            void handleSubmit(event);
          }}
          style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}
        >
          <Input
            type="password"
            label="App secret"
            value={secret}
            onChange={(event) => {
              setSecret(event.target.value);
              setError(null);
            }}
            error={error || undefined}
            autoComplete="current-password"
          />
          <Button type="submit" isLoading={isSessionLoading} disabled={!secret.trim()}>
            Unlock
          </Button>
        </form>
      </Card>
    </main>
  );
};

export default AccessGate;
