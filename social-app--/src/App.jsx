import React, { Suspense, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import { ensureUserDoc } from './firebase';
import './App.css';
import TweetList from './components/TweetList.jsx';
import Nav from './components/Nav.jsx';
import Footer from './components/Footer.jsx';
import { TweetProvider } from './components/TweetContext.jsx';
import AddTweet from './components/AddTweet.jsx';
import List from './components/List.jsx';
import Search from './components/Search.jsx';

import Layout from './pages/Layout.jsx';

import Register from './pages/Register.jsx';
import LogIn from './pages/LogIn.jsx';

import Profile from './components/Profile.jsx';
import UserProfile from './components/UserProfile.jsx';
import MainFeed from './components/MainFeed.jsx';



function App() {
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) await ensureUserDoc();
    });
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
        
          <Route path="/login" element={<LogIn />} />
          <Route path="/register" element={<Register />} />
          
          <Route element={
            <Layout 
              user={user} 
              handleSearch={handleSearch} 
              MainFeed={MainFeed} 
              searchTerm={searchTerm} /> 
            }>

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
            </Route>
          </Routes>
      </BrowserRouter>
    </TweetProvider>
  );
}

export default App;
