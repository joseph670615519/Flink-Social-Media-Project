import { useState } from 'react'
import './App.css'
import TweetList from './components/TweetList.jsx'
import Nav from './components/Nav.jsx'
import Footer from './components/Footer.jsx'
import { TweetProvider } from './components/TweetContext.jsx'
import AddTweet from './components/AddTweet.jsx'
import List from './components/List.jsx'
import Search from './components/Search.jsx'

function App() {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = (term) => {
    setSearchTerm(term);
    console.log('Searching for:', term);
  };

  return (
     <TweetProvider>
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
    </TweetProvider>
  )
}

export default App
