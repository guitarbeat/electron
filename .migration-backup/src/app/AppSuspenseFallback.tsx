import React from 'react';
import './AppSuspenseFallback.css';

interface AppSuspenseFallbackProps {
  label?: string;
}

/**
 * Visible placeholder for lazy-loaded UI boundaries (replaces null Suspense fallbacks).
 */
const AppSuspenseFallback: React.FC<AppSuspenseFallbackProps> = ({
  label = 'Loading',
}) => (
  <div className="app-suspense-fallback" role="status" aria-live="polite" aria-label={label}>
    <span className="app-suspense-fallback__bar" aria-hidden="true" />
  </div>
);

export default AppSuspenseFallback;
