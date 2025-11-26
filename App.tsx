import React from 'react';
import { useUser } from './context/UserContext';
import UserSelection from './components/UserSelection';
import Watchlist from './components/Watchlist';
import MessageBoard from './components/MessageBoard';
import { spacing, colors } from './design-system/tokens';

const App: React.FC = () => {
  const { currentUser } = useUser();

  return (
    <div style={{ 
      backgroundColor: colors.background, 
      color: colors.textPrimary, 
      minHeight: '100vh',
    }}>
      <main style={{ 
        paddingTop: spacing['2xl'], 
        paddingBottom: spacing['3xl'],
      }}>
        {!currentUser ? <UserSelection /> : <Watchlist />}
        <MessageBoard />
      </main>
    </div>
  );
};

export default App;