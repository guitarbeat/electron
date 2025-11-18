import React, { useState } from 'react';
import { useUser } from '../context/UserContext';
import { User } from '../types';
import ImageWithFallback from './ImageWithFallback';
import { userImageSources, defaultImageSources } from '../config/imageConfig';

const UserSelection: React.FC = () => {
  const { setCurrentUser } = useUser();
  const [hoveredUser, setHoveredUser] = useState<User | null>(null);

  const handleUserSelect = (user: User) => {
    setCurrentUser(user);
  };

  const sources = hoveredUser ? userImageSources[hoveredUser] : defaultImageSources;

  return (
    <div className="container mx-auto px-4 text-center">
      <div className="max-w-md mx-auto cute-card p-8">
        <div className="h-32 mb-4 flex justify-center items-center">
          <ImageWithFallback
            key={hoveredUser || 'default'}
            sources={sources}
            alt={`A meme representing ${hoveredUser || 'no one'}`}
            className="max-h-full rounded-lg border-4 border-pink-300 shadow-lg object-contain animate-fade-in"
          />
        </div>
        <h2 className="text-3xl font-heading mb-6 text-pink-300" style={{textShadow: '1px 1px 2px #ff69b4'}}>Who are you?</h2>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => handleUserSelect('Aaron')}
            onMouseEnter={() => setHoveredUser('Aaron')}
            onMouseLeave={() => setHoveredUser(null)}
            className="cute-button cute-button-blue text-xl"
          >
            Aaron
          </button>
          <button
            onClick={() => handleUserSelect('Electra')}
            onMouseEnter={() => setHoveredUser('Electra')}
            onMouseLeave={() => setHoveredUser(null)}
            className="cute-button cute-button-pink text-xl"
          >
            Electra
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserSelection;