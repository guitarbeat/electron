import React from 'react';
import { useUser } from '../context/UserContext';
import ImageWithFallback from './ImageWithFallback';
import { userImageSources, defaultImageSources } from '../config/imageConfig';

const Header: React.FC = () => {
  const { currentUser } = useUser();
  const sources = currentUser ? userImageSources[currentUser] : defaultImageSources;
  
  const avatarSizeClasses = 'w-16 h-16 sm:w-20 sm:h-20';

  return (
    <div className="mb-8">
      <div className="px-4 py-4 cute-card">
        <div className="flex flex-col items-center w-full gap-4">
            {/* Avatar on top */}
            <div className={avatarSizeClasses}>
                <ImageWithFallback
                    key={currentUser || 'default'}
                    sources={sources}
                    alt={currentUser ? `${currentUser}'s avatar` : 'Default avatar'}
                    className="w-full h-full rounded-full object-cover border-2 border-pink-300 shadow-md animate-fade-in"
                />
            </div>

            {/* Centered Title below */}
            <h1 className="text-2xl sm:text-3xl font-heading text-white tracking-tight text-center break-words" style={{textShadow: '2px 2px 4px #ff69b4'}}>
                Aaron &amp; Electra's Movie List
            </h1>
        </div>
      </div>
    </div>
  );
};

export default Header;