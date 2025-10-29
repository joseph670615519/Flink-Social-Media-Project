import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import './App.css';

import { TweetProvider } from './components/TweetContext.jsx';

import LogIn from './pages/LogIn.jsx';
import Register from './pages/Register.jsx';

import Nav from './components/Nav.jsx';
import AddTweet from './components/AddTweet.jsx';
import MainFeed from './components/MainFeed.jsx';
import List from './components/List.jsx';
import Search from './components/Search.jsx';
import Profile from './components/Profile.jsx';
import UserProfile from './components/UserProfile.jsx'; 
import Notification from './components/Notification.jsx';
import Chat from './components/chat.jsx';

function Logo({ onRefresh }) {
  const navigate = useNavigate();
  
  const handleLogoClick = () => {
    if (window.location.pathname === '/feed') {
      onRefresh(); 
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      navigate('/feed');
    }
  };

  return (
    <div 
      className="app-logo-clickable"
      onClick={handleLogoClick}
      style={{ cursor: 'pointer' }}
      aria-label="Go to feed"
      role="button"
      tabIndex={0}
      onKeyPress={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleLogoClick();
        }
      }}
    >
      <h1 className="app-logo">Flink</h1>
    </div>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0); 

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSearch = (term) => {
    setSearchTerm(term);
  };

  const handleRefreshFeed = () => {
    setRefreshKey(prev => prev + 1);
    console.log('Refreshing feed...');
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px'
      }}>
        Loading Flink...
      </div>
    );
  }

  return (
    <TweetProvider>
      <BrowserRouter>
        <Routes>
          <Route 
            path="/login" 
            element={!user ? <LogIn /> : <Navigate to="/feed" replace />} 
          />
          <Route 
            path="/register" 
            element={!user ? <Register /> : <Navigate to="/feed" replace />} 
          />
          
          <Route 
            path="/feed" 
            element={
              user ? (
                <div className="app-layout">
                  <header className="app-header">
                    <div className="header-content">
                      <div className="header-left">
                        <Logo onRefresh={handleRefreshFeed} />
                      </div>
                      
                      <div className="header-center">
                        <Search onSearch={handleSearch} />
                      </div>
                      
                      <div className="header-right">
                        <Chat /> 
                        <Notification />
                      </div>
                    </div>
                  </header>

                  {/* Main Layout Container */}
                  <div className="layout-container">
                    <aside className="sidebar left-sidebar">
                      <Nav user={user} />
                    </aside>

                    <main className="main-feed-container">
                      <AddTweet user={user} />
                      <MainFeed 
                        key={refreshKey} 
                        user={user} 
                        searchTerm={searchTerm} 
                      />
                    </main>
          
                    <aside className="sidebar right-sidebar">
                      <List user={user} />
                    </aside>
                  </div>
                </div>
              ) : (
                <Navigate to="/login" replace />
              )
            } 
          />
          
          <Route 
            path="/me" 
            element={user ? <Profile user={user} /> : <Navigate to="/login" replace />} 
          />
          
          <Route 
            path="/profile/:userId" 
            element={user ? <UserProfile /> : <Navigate to="/login" replace />} 
          />
          
          <Route 
            path="/" 
            element={<Navigate to={user ? "/feed" : "/login"} replace />} 
          />
        </Routes>
      </BrowserRouter>
    </TweetProvider>
  );
}

export default App;