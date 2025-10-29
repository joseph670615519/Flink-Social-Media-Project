import React, { Suspense, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from './firebase';
import { doc, setDoc } from 'firebase/firestore';
import { createUserProfile } from './services/userService';
import './App.css';
import TweetList from './components/TweetList.jsx';
import Nav from './components/Nav.jsx';
import Footer from './components/Footer.jsx';
import { TweetProvider } from './components/TweetContext.jsx';
import AddTweet from './components/AddTweet.jsx';
import List from './components/List.jsx';
import Search from './components/Search.jsx';
import Friends from './components/Friends.jsx';
import PostsFeed from './components/PostsFeed.jsx';

import Layout from './pages/Layout.jsx';

import Register from './pages/Register.jsx';
import LogIn from './pages/LogIn.jsx';

import Profile from './components/Profile.jsx';
import UserProfile from './components/UserProfile.jsx';
import MainFeed from './components/MainFeed.jsx';

function App() {
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      
      // Create or update user profile in Firestore when they log in
      if (u) {
        try {
          const userRef = doc(db, 'users', u.uid);
          await setDoc(userRef, {
            displayName: u.displayName || u.email,
            email: u.email,
            photoURL: u.photoURL || '',
            bio: '',
            followers: [],
            following: [],
            lastActive: new Date(),
            createdAt: new Date()
          }, { merge: true });
        } catch (error) {
          console.error('Error saving user data:', error);
        }
      }
      
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleSearch = (term) => {
    setSearchTerm(term);
    console.log('Searching for:', term);
  };

  if (loading) {
    return <div className="loading-container">Loading...</div>;
  }

  return (
    <TweetProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={user ? <Navigate to="/" /> : <LogIn />} />
          <Route path="/register" element={user ? <Navigate to="/" /> : <Register />} />
          
          <Route element={user ? <Layout user={user} handleSearch={handleSearch} MainFeed={MainFeed} searchTerm={searchTerm} /> : <Navigate to="/login" />}>
            <Route path="/" element={
              <>
                <AddTweet user={user} />
                {MainFeed && <MainFeed user={user} searchTerm={searchTerm} />}
                <TweetList currentUserId={user?.uid} currentUserName={user?.displayName} currentUserAvatar={user?.photoURL} />
                <Footer />
              </>
            } />

            <Route path="/posts" element={<PostsFeed user={user} />} />
            <Route path="/friends" element={<Friends user={user} />} />
            <Route path="/me" element={<Profile user={user} />} />
            <Route path="/profile/:userId" element={<UserProfile />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </TweetProvider>
  );
}

export default App;
