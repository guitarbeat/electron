import React from 'react';
import { useUser } from './context/UserContext';
import UserSelection from './components/UserSelection';
import Watchlist from './components/Watchlist';
import MessageBoard from './components/MessageBoard';

const App: React.FC = () => {
  const { currentUser } = useUser();

  return (
    <div className="bg-main text-white min-h-screen font-body">
      <main className="pt-8 pb-12">
        {!currentUser ? <UserSelection /> : <Watchlist />}
        <MessageBoard />
      </main>
    </div>
  );
};

export default App;