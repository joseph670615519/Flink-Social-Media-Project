import React, {useState} from 'react';

function Search({onSearch}) {
    const [searchTerm, setSearchTerm] = useState('');

    const handleChange = (event) => {
        const value = event.target.value;
        setSearchTerm(value);
        onSearch(value);
    };

    return (
        <div className="search-container">
            <input
                type="text"
                placeholder="Search tweets..."
                value={searchTerm}
                onChange={handleChange}
                className="search-input"
            />
        </div>
    );
}

export default Search;