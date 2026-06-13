import React, { Suspense, type ReactNode } from 'react';
import AppSuspenseFallback from '@/app/AppSuspenseFallback';

interface LazyBoundaryProps {
  children: ReactNode;
  label?: string;
}

const LazyBoundary: React.FC<LazyBoundaryProps> = ({ children, label }) => (
  <Suspense fallback={<AppSuspenseFallback label={label} />}>{children}</Suspense>
);

export default LazyBoundary;
