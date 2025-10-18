import React, { useState } from 'react';
import { Link } from 'react-router-dom';

function Search({ onSearch }) {
    const [searchTerm, setSearchTerm] = useState('');

    const handleChange = (event) => {
        const value = event.target.value;
        setSearchTerm(value);
        onSearch(value);
    };

    return (
        <div className="search-container">
            <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '1rem',
                maxWidth: '500px',
                margin: '0 auto'
            }}>
                {/* Home Button */}
                <Link 
                    to="/" 
                    style={{ 
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: '#86c76b',
                        color: 'white',
                        fontSize: '1.2rem',
                        transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => {
                        e.target.style.background = '#6bbf4e';
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.background = '#86c76b';
                    }}
                >
                    🏠
                </Link>

                {/* Search Input */}
                <div style={{ position: 'relative', flex: 1 }}>
                    <label htmlFor="search-input" style={{ display: 'none' }}>Search Tweets</label>
                    <input
                        id="search-input"
                        type="text"
                        placeholder="Search posts..."
                        value={searchTerm}
                        onChange={handleChange}
                        className="search-input"
                        autoComplete="off"
                    />
                    <span
                        style={{
                            position: 'absolute',
                            left: '12px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: '#86c76b',
                            pointerEvents: 'none'
                        }}
                    >
                        🔍
                    </span>
                </div>
            </div>
        </div>
    );
}

export default Search;