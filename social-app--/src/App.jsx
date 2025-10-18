import React, { Suspense, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import './App.css';
import TweetList from './components/TweetList.jsx';
import Nav from './components/Nav.jsx';
import Footer from './components/Footer.jsx';
import { TweetProvider } from './components/TweetContext.jsx';
import AddTweet from './components/AddTweet.jsx';
import List from './components/List.jsx';
import Search from './components/Search.jsx';

import Register from './pages/Register.jsx';
import LogIn from './pages/LogIn.jsx';

import Profile from './components/Profile.jsx';
import UserProfile from './components/UserProfile.jsx';
import MainFeed from './components/MainFeed.jsx';

function App() {
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => setUser(u));
    return () => unsub();
  }, []);

  const handleSearch = (term) => {
    setSearchTerm(term);
    console.log('Searching for:', term);
  };

   return (
    <TweetProvider>
      <BrowserRouter>
        
        {/* header */}
        <header className="fixed-header">
          <Search onSearch={handleSearch} />
        </header>

        <div className="App">
          {/* left nav */}
          <aside className="nav-container">
            <Nav user={user} />
          </aside>

          {/* center content */}
          <main className="main-content">
            <Suspense fallback={<div className="loading">Loading...</div>}>
              <Routes>
                <Route path="/" element={
                  <>
                    <AddTweet user={user} />
                    {MainFeed && <MainFeed user={user} searchTerm={searchTerm} />}
                    <TweetList />
                    <Footer />
                  </>
                } />

                <Route path="/me" element={<Profile user={user} />} />
                <Route path="/profile/:userId" element={<UserProfile />} />
              </Routes>
            </Suspense>
          </main>

          {/* right friends list */}
          <aside className="list-container">
            <List />
          </aside>
        </div>
      </BrowserRouter>
    </TweetProvider>
  );
}

export default App;
