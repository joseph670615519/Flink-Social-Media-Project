<<<<<<< HEAD
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
=======
import { useState } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './App.css'

import TweetList from './components/TweetList.jsx'
import Nav from './components/Nav.jsx'
import Footer from './components/Footer.jsx'
import { TweetProvider } from './components/TweetContext.jsx'
import AddTweet from './components/AddTweet.jsx'
import List from './components/List.jsx'
import Search from './components/Search.jsx'
import LogIn from './pages/LogIn.jsx'
import Register from './pages/Register.jsx'
>>>>>>> 9c2c5262001538eb6dd14cc835ebabd0fe72744f

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

<<<<<<< HEAD
   return (
    <TweetProvider>
      <BrowserRouter>
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
=======
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
>>>>>>> 9c2c5262001538eb6dd14cc835ebabd0fe72744f
}

export default App;
