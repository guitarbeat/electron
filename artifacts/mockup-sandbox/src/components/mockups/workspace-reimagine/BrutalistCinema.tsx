import React, { useState } from 'react';

export default function BrutalistCinema() {
  const [activeTab, setActiveTab] = useState<'movies' | 'places'>('movies');
  const [inputValue, setInputValue] = useState('');

  const fontHeading = { fontFamily: "'Anton', 'Bebas Neue', 'Impact', sans-serif", letterSpacing: '0.05em' };
  const fontBody = { fontFamily: "'IBM Plex Mono', 'Courier New', monospace" };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-[#ff2200] selection:text-white" style={fontBody}>
      {/* 1. Shell Control Strip (Nav Bar) */}
      <nav className="w-full border-b-[4px] border-[#ff2200] bg-black px-4 md:px-8 py-4 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-4">
        
        {/* Left: Logo & Avatars */}
        <div className="flex items-center gap-6">
          <div 
            className="w-12 h-12 flex items-center justify-center bg-[#ff2200] text-white text-3xl font-bold uppercase"
            style={fontHeading}
          >
            E
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center text-lg font-bold border-2 border-transparent hover:border-[#ff2200] transition-colors cursor-pointer" style={fontHeading}>
              A
            </div>
            <div className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center text-lg font-bold border-2 border-transparent hover:border-[#ff2200] transition-colors cursor-pointer" style={fontHeading}>
              E
            </div>
          </div>
        </div>

        {/* Center: Workspace Toggle */}
        <div className="flex items-center text-2xl md:text-4xl uppercase" style={fontHeading}>
          <button 
            onClick={() => setActiveTab('movies')}
            className={`px-6 py-2 transition-colors ${activeTab === 'movies' ? 'bg-[#ff2200] text-white' : 'text-gray-400 hover:text-white'}`}
          >
            Movies
          </button>
          <button 
            onClick={() => setActiveTab('places')}
            className={`px-6 py-2 transition-colors ${activeTab === 'places' ? 'bg-[#ff2200] text-white' : 'text-gray-400 hover:text-white'}`}
          >
            Places
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex flex-wrap justify-center items-center gap-4 md:gap-6 text-sm font-bold uppercase tracking-wider">
          <button className="hover:text-[#ff2200] transition-colors uppercase decoration-2 underline-offset-4 hover:underline">Messages</button>
          <button className="hover:text-[#ff2200] transition-colors uppercase decoration-2 underline-offset-4 hover:underline">Notes</button>
          <button className="hover:text-[#ff2200] transition-colors uppercase decoration-2 underline-offset-4 hover:underline">Edit Quiz</button>
          <button className="hover:text-[#ff2200] transition-colors uppercase decoration-2 underline-offset-4 hover:underline">Spin & Match</button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-16 flex flex-col gap-24">
        
        {/* 2. Workspace Hero */}
        <section className="flex flex-col md:flex-row md:items-end justify-between gap-12 border-l-[8px] border-[#ff2200] pl-6 md:pl-12">
          <div className="flex flex-col gap-4 max-w-3xl">
            <span className="text-[#ff2200] text-sm md:text-base font-bold tracking-[0.2em] uppercase">
              Movies Workspace
            </span>
            <h1 
              className="text-7xl md:text-[120px] leading-[0.85] text-white uppercase inline-block border-b-[6px] border-[#ff2200] pb-2"
              style={fontHeading}
            >
              Watchlist
            </h1>
            <p className="text-xl md:text-2xl text-gray-400 mt-6 leading-relaxed max-w-xl">
              Queue titles, notes, and spin-off rituals from one shared movie space.
            </p>
          </div>
          
          <div className="flex-shrink-0">
            <div className="border-[3px] border-[#ff2200] px-6 py-4 bg-black text-[#ff2200] uppercase font-bold tracking-widest text-sm">
              Status // Guest Mode
            </div>
          </div>
        </section>

        {/* 3. Shared Queue Card */}
        <section className="w-full bg-black border-t-[6px] border-[#ff2200] p-8 md:p-16">
          <div className="flex flex-col gap-12 max-w-4xl mx-auto">
            <div className="flex flex-col gap-4 text-center">
              <span className="text-[#ff2200] text-sm font-bold tracking-[0.2em] uppercase">
                Shared Queue
              </span>
              <h2 className="text-5xl md:text-7xl uppercase text-white" style={fontHeading}>
                Send a title to the queue
              </h2>
              <p className="text-gray-400 text-lg">
                Not signed in? Guest can still send titles to Suggestions.
              </p>
            </div>

            <div className="relative mt-8">
              <input 
                type="text" 
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="ADD A MOVIE OR SHOW TITLE"
                className="w-full bg-transparent border-none border-b-2 border-white focus:border-[#ff2200] text-white text-2xl md:text-4xl py-4 focus:outline-none focus:ring-0 placeholder:text-gray-700 uppercase transition-colors"
                style={fontHeading}
              />
              <div className="absolute right-0 bottom-4 flex gap-2">
                <button 
                  className="bg-white text-black px-6 py-2 text-xl hover:bg-[#ff2200] hover:text-white transition-colors uppercase font-bold"
                  style={fontHeading}
                >
                  Enter
                </button>
              </div>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}
