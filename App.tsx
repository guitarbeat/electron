import React from 'react';
import { useUser } from './context/UserContext';
import UserSelection from './components/UserSelection';
import Watchlist from './components/Watchlist';
import Header from './components/Header';
import MessageBoard from './components/MessageBoard';

const App: React.FC = () => {
  const { currentUser } = useUser();

  return (
    <div className="bg-main text-white min-h-screen font-body">
      <Header />
      <main className="pt-32 pb-12">
        {!currentUser ? <UserSelection /> : <Watchlist />}
        <MessageBoard />
      </main>
    </div>
  );
};

export default App;