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
          <Routes>
            <Route path="/" element={<LogIn />} />

            <Route path="/register" element={<Register />} />

            <Route path="/feed" 
            element = {
              <div className="App">   

                <header className="fixed-header">
                  <Search onSearch={handleSearch} />
                </header>

                <div className="nav-container">
                  <Nav />
                </div>

                <div className="list-container">
                  <List />
                </div>

                <div className="main-content">
                  <AddTweet />
                  <TweetList />
                  <Footer />
                </div>
              
              </div>
              }
            />
          </Routes>
        </BrowserRouter>
      </TweetProvider>
  )
}

export default App;
