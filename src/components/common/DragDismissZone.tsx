import React from 'react';
import { useBubbleDismiss } from '../../context/BubbleDismissContext';
import './DragDismissZone.css';

interface DragDismissZoneProps {
  visible: boolean;
  isHovering: boolean;
}

const DragDismissZone: React.FC<DragDismissZoneProps> = ({
  visible,
  isHovering,
}) => {
  if (!visible) return null;

  return (
    <div 
      className={`drag-dismiss-zone ${isHovering ? 'hovering' : ''}`}
      aria-label="Drag bubbles here to dismiss"
    />
  );
};

export default DragDismissZone;
