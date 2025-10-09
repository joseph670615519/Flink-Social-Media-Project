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

function App() {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = (term) => {
    setSearchTerm(term);
    console.log('Searching for:', term);
  };

  return (
     <TweetProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LogIn />} />

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

export default App
