import React from 'react';
import { UserIcon } from './icons';

interface UserSelectionProps {
  onSelectUser: (user: 'Aaron' | 'Electra') => void;
}

const UserSelection: React.FC<UserSelectionProps> = ({ onSelectUser }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center animate-fade-in p-4">
      <div className="cute-card p-8 sm:p-12 max-w-md w-full">
        <h2 className="text-4xl font-heading text-pink-300 mb-2" style={{textShadow: '2px 2px #000'}}>Who's Watching?</h2>
        <p className="text-slate-200 mb-8 font-body text-xl">
          Select your name so we know who's adding movies!
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => onSelectUser('Aaron')}
            className="flex-1 flex flex-col items-center gap-3 bg-main-blue/80 hover:bg-main-blue text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg border-2 border-outset border-blue-300"
          >
            <UserIcon />
            <span className="font-heading text-2xl">Aaron</span>
          </button>
          <button
            onClick={() => onSelectUser('Electra')}
            className="flex-1 flex flex-col items-center gap-3 bg-main-pink/80 hover:bg-main-pink text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg border-2 border-outset border-pink-300"
          >
             <UserIcon />
            <span className="font-heading text-2xl">Electra</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserSelection;