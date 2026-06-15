import React from 'react';
import { CollectionEmptyState } from '@/ui/CollectionLayout';

interface PlacesEmptyStateProps {
  title?: string;
  hint: string;
}

const PlacesEmptyState: React.FC<PlacesEmptyStateProps> = ({ title = "No places yet", hint }) => (
  <CollectionEmptyState className="places-empty-state">
    <span style={{ fontSize: "2.5rem", lineHeight: 1 }}>🗺️</span>
    <strong className="places-empty-state__title">{title}</strong>
    <span className="places-empty-state__hint">{hint}</span>
  </CollectionEmptyState>
);

export default PlacesEmptyState;
