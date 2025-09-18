import React, {useContext} from 'react';
import { TweetContext } from './TweetContext';

const List = () => {
    const friends = [
  { id: 1, name: "Friend 1" },
  { id: 2, name: "Friend 2" },
];
    return (
  <div className="list-container">
    <h2>Friends</h2>
    <ul>
      {friends.map(friend => (
        <li key={friend.id}>{friend.name}</li>
      ))}
    </ul>
  </div>
    );
}

export default List;