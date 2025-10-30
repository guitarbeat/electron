import React from 'react';
import { FilmIcon } from './icons';

const Header: React.FC = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-10 p-4 bg-main/50 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-3 flex justify-center items-center cute-card relative">
        <div className="flex items-center gap-3 text-pink-300">
            <FilmIcon />
            <h1 className="text-xl sm:text-3xl font-heading text-white tracking-tight text-center" style={{textShadow: '2px 2px 4px #ff69b4'}}>
                Aaron &amp; Electra's Movie List
            </h1>
        </div>
      </div>
    </header>
  );
};

export default Header;
