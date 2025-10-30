import React from 'react';
import { FilmIcon } from './icons';

const Header: React.FC = () => {
  return (
    <header className="sticky top-0 z-10 p-2">
      <div className="container mx-auto px-4 py-3 flex justify-center items-center cute-card relative">
        <div className="flex items-center gap-3 text-pink-300">
            <FilmIcon />
            <h1 className="text-3xl font-heading text-white tracking-tight text-center" style={{textShadow: '2px 2px 4px #ff69b4'}}>
                Aaron &amp; Electra's Movie List
            </h1>
        </div>
      </div>
    </header>
  );
};

export default Header;