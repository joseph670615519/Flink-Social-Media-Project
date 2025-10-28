import { useState } from 'react';

function Sidebar({ selectedFriend, setSelectedFriend, setShowProfile }) {
  const [searchText, setSearchText] = useState('');

  const [friends] = useState([
    { id: 1, name: 'Maggy Johnson', profilePic: '👩', lastMessage: 'See you tomorrow!', lastMessageTime: '2m', online: true },
    { id: 2, name: 'Christopher Muniu', profilePic: '👨', lastMessage: 'Thanks for your help', lastMessageTime: '15m', online: true },
    { id: 3, name: 'Michelle Anderson', profilePic: '👩‍🦰', lastMessage: 'Sounds good!', lastMessageTime: '1h', online: false },
    { id: 4, name: 'Nyambura', profilePic: '👨‍💼', lastMessage: 'Let me check', lastMessageTime: '3h', online: false },
  ]);

  const filteredFriends = friends.filter(friend =>
    friend.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const handleFriendClick = (friend) => {
    setSelectedFriend(friend);
    setShowProfile(false);
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2>Messenger</h2>
      </div>
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search Messenger"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
      </div>
      <div className="friends-list">
        {filteredFriends.map(friend => (
          <div
            key={friend.id}
            className={`friend-item ${selectedFriend?.id === friend.id ? 'active' : ''}`}
            onClick={() => handleFriendClick(friend)}
          >
            <div className="friend-avatar">
              <span className="avatar-emoji">{friend.profilePic}</span>
              {friend.online && <span className="online-indicator"></span>}
            </div>
            <div className="friend-info">
              <div className="friend-name">{friend.name}</div>
              <div className="friend-last-message">{friend.lastMessage}</div>
            </div>
            <div className="friend-time">{friend.lastMessageTime}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Sidebar;
