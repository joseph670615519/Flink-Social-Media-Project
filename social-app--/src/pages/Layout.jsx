import React, { Suspense } from 'react'
import { Outlet } from 'react-router-dom'
import { Phone } from 'lucide-react'

import Search from '../components/Search'
import Nav from '../components/Nav'
import List from '../components/List'
import '../components/FlinkBrand.css'
import './Layout.css'

function Layout( { user, handleSearch, MainFeed, searchTerm } ) {
  const handleCall = () => {
    window.open('https://tuyet-presystolic-jillian.ngrok-free.dev', '_blank');
  };

  return (
    <div className="flink-layout">
        {/* header */}
        <header className="flink-header">
          <div className="flink-logo">
            <span className="flink-logo-text">✨ Flink</span>
            <span className="flink-logo-subtitle">Connect & Share</span>
          </div>
          
          <div className="header-center">
            <Search onSearch={handleSearch} />
          </div>
          
          <div className="header-actions">
            <button className="video-call-btn" onClick={handleCall}>
              <Phone size={20} />
              <span>Video Call</span>
            </button>
            {user && (
              <div className="user-header">
                <img 
                  src={user.photoURL || '/default-avatar.png'} 
                  alt={user.displayName}
                  className="user-header-avatar"
                />
                <span className="user-header-name">
                  {user.displayName || user.email}
                </span>
              </div>
            )}
          </div>
        </header>
        
        <div className="flink-container">
          {/* left nav */}
          <aside className="flink-nav">
            <Nav user={user} />
          </aside>

            {/* center content */}
            <main className="flink-main">
                <Suspense fallback={
                  <div className="flink-loading">
                    <div className="loading-spinner"></div>
                    <p>กำลังโหลด...</p>
                  </div>
                }>
                    <Outlet />
                </Suspense>
            </main>

            {/* right friends list */}
            <aside className="flink-sidebar">
                <List />
            </aside>
        </div>
    </div>
  )
}

export default Layout