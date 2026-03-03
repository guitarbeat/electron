import React from 'react';
import Card from '../ui/Card';
import { colors, spacing, typography, radius, shadows } from '../../design-system/tokens';

/** Shared card style for all extras sections */
const sectionStyle: React.CSSProperties = {
  padding: spacing.lg,
  borderRadius: radius.lg,
  border: `1px solid ${colors.borderSecondary}35`,
  background: `linear-gradient(145deg, ${colors.surfaceElevated}, ${colors.surface})`,
  boxShadow: shadows.glow,
};

const sectionTitleStyle: React.CSSProperties = {
  margin: 0,
  color: colors.textPrimary,
  fontFamily: typography.fontFamily.heading.join(', '),
  fontSize: typography.fontSize.lg,
  letterSpacing: '0.03em',
};

const sectionSubtitleStyle: React.CSSProperties = {
  margin: 0,
  color: colors.textSecondary,
  fontSize: typography.fontSize.sm,
};

const ExtrasHub: React.FC = () => {
  return (
    <div
      style={{
        maxWidth: '960px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: spacing.lg,
      }}
    >
      <Card style={sectionStyle}>
        <h2 style={{ ...sectionTitleStyle, marginBottom: spacing.xs }}>Extras</h2>
        <p style={sectionSubtitleStyle}>Use the floating bubbles for games and quiz.</p>
      </Card>
    </div>
  );
};

export default ExtrasHub;
