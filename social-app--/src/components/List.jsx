import React, { useState } from 'react';
import avatarImg from '../assets/FlinkAva_.png'; // Use your default avatar

const List = () => {
  const [friends, setFriends] = useState([
    { id: 1, name: "Friend 1", avatar: avatarImg },
    { id: 2, name: "Friend 2", avatar: avatarImg },
  ]);
  const [newFriend, setNewFriend] = useState('');

  const handleAddFriend = (e) => {
    e.preventDefault();
    if (newFriend.trim() === '') return;
    setFriends([
      ...friends,
      { id: Date.now(), name: newFriend, avatar: avatarImg }
    ]);
    setNewFriend('');
  };

  return (
    <div className="list-container">
      <h2 style={{ marginBottom: '1rem' }}>Friends</h2>
      <form onSubmit={handleAddFriend} style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center' }}>
        <input
          type="text"
          value={newFriend}
          onChange={e => setNewFriend(e.target.value)}
          placeholder="Add a friend"
        />
        <button type="submit" style={{ marginLeft: '2rem' }}>Add</button>
      </form>
      <ul className="friends-list">
        {friends.map(friend => (
          <li key={friend.id} className="friend-item">
            <img src={friend.avatar} alt={friend.name} className="friend-avatar" />
            <span className="friend-name">{friend.name}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default List;