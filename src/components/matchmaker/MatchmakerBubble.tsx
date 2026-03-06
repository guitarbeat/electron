import React from 'react';
import type { User } from '@/types';
import Matchmaker from './Matchmaker';

interface MatchmakerBubbleProps {
  currentUser: User | null;
}

const MatchmakerBubble: React.FC<MatchmakerBubbleProps> = ({ currentUser }) => {
  if (!currentUser) return null;

  return <Matchmaker currentUser={currentUser} />;
};

export default MatchmakerBubble;
