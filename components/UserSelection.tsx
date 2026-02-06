import React from 'react';
import ProfileSelectionScreen from './ProfileSelectionScreen';

interface UserSelectionProps {
  onTakeQuiz: () => void;
}

/**
 * UserSelection component - Y2K Dark Romantic Profile Selection
 * 
 * This component now renders the redesigned ProfileSelectionScreen
 * with gel-style floating bubbles, pixel-art stars, and a split-screen layout.
 */
const UserSelection: React.FC<UserSelectionProps> = ({ onTakeQuiz }) => {
  return <ProfileSelectionScreen onTakeQuiz={onTakeQuiz} />;
};

export default UserSelection;
