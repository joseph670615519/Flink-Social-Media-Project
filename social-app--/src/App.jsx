import { useState } from 'react'
import './App.css'
import TweetList from './components/TweetList.jsx'
import Nav from './components/Nav.jsx'
import Footer from './components/Footer.jsx'
import { TweetProvider } from './components/TweetContext.jsx'
import AddTweet from './components/AddTweet.jsx'
import List from './components/List.jsx'

function App() {
  const [count, setCount] = useState(0)

  return (
     <TweetProvider>
      <div className="App">
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
