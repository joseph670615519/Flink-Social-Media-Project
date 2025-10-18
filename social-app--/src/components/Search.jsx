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
            <label htmlFor="search-input" style={{ display: 'none' }}>Search Tweets</label>
            <div style={{ position: 'relative' }}>
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
                    🤔
                </span>
            </div>
        </div>
    );
}

export default Search;