import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import avatarImg from '../assets/FlinkAva.png'; 
const List = () => {
  const [friends, setFriends] = useState([
    { id: 1, name: "Friend 1", avatar: avatarImg },
    { id: 2, name: "Friend 2", avatar: avatarImg },
  ]);
  const [newFriend, setNewFriend] = useState('');

   const handleAddFriend = (e) => {
    e.preventDefault();
    if (newFriend.trim() === '') return;
    
    // Generate a unique ID for the new friend
    const newId = `user${Date.now()}`;
    
    setFriends([
      ...friends,
      { id: newId, name: newFriend, avatar: avatarImg }
    ]);
    
    setNewFriend('');
  };

  return (
    <div className="list-container">
      <h2 style={{ marginBottom: '1rem' }}>Friends</h2>
      <form onSubmit={handleAddFriend} style={{ marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <input
          type="text"
          value={newFriend}
          onChange={e => setNewFriend(e.target.value)}
          placeholder="Add a friend"
          style={{ 
            padding: '0.5rem', 
            borderRadius: '8px', 
            border: '1px solid #b2e6a0',
            background: '#f8fff4'
          }}
        />
        <button type="submit">Add</button>
      </form>
      <ul className="friends-list">
        {friends.map(friend => (
          <li key={friend.id} className="friend-item">
            <Link 
              to={`/profile/${friend.id}`} 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '1rem',
                textDecoration: 'none',
                color: 'inherit',
                width: '100%',
                padding: '0.75rem',
                borderRadius: '8px',
                transition: 'background 0.2s'
              }}
            >
              <img src={friend.avatar} alt={friend.name} className="friend-avatar" />
              <span className="friend-name">{friend.name}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default List;