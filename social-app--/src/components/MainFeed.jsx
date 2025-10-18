import React, { useContext } from 'react';
import { TweetContext } from './TweetContext';
import Tweet from './Tweet';

const MainFeed = ({ user, searchTerm }) => {
  const [tweets] = useContext(TweetContext);
  
  const filteredTweets = tweets.filter(tweet => 
    tweet.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tweet.message.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="main-feed">
      {filteredTweets.map(tweet => (
        <Tweet 
          key={tweet.id} 
          title={tweet.title} 
          message={tweet.message} 
          likes={tweet.likes}
          userId={tweet.userId}
          date={tweet.date}
        />
      ))}
    </div>
  );
};

export default MainFeed;