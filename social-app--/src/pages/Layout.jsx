import React, { Suspense } from 'react'
import { Outlet } from 'react-router-dom'

import Search from '../components/Search'
import Nav from '../components/Nav'
import List from '../components/List'

function Layout( { user, handleSearch, MainFeed, searchTerm } ) {
  return (
    <>
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
                    <Outlet />
                </Suspense>
            </main>

            {/* right friends list */}
            <aside className="list-container">
                <List />
            </aside>
        </div>
    </>
  )
}

export default Layout