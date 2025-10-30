import React from 'react';
import { useUser } from '../context/UserContext';
import { User } from '../types';

const UserSelection: React.FC = () => {
  const { setCurrentUser } = useUser();

  const handleUserSelect = (user: User) => {
    setCurrentUser(user);
  };

  return (
    <div className="container mx-auto px-4 text-center">
      <div className="max-w-md mx-auto cute-card p-8">
        <h2 className="text-3xl font-heading mb-6 text-pink-300" style={{textShadow: '1px 1px 2px #ff69b4'}}>Who are you?</h2>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => handleUserSelect('Aaron')}
            className="px-8 py-3 text-xl font-bold rounded-lg shadow-lg transform hover:scale-105 transition-transform duration-200 text-white bg-blue-500 hover:bg-blue-600"
          >
            Aaron
          </button>
          <button
            onClick={() => handleUserSelect('Electra')}
            className="px-8 py-3 text-xl font-bold rounded-lg shadow-lg transform hover:scale-105 transition-transform duration-200 text-white bg-pink-500 hover:bg-pink-600"
          >
            Electra
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserSelection;
