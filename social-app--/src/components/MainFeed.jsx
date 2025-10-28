import React, { useContext, useState, useEffect } from 'react';
import { TweetContext } from './TweetContext';
import Tweet from './Tweet';

const MainFeed = ({ user, searchTerm }) => {
  const [tweets, setTweets] = useContext(TweetContext);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const refreshData = async () => {
      setIsRefreshing(true);
      
      setTimeout(() => {
        setIsRefreshing(false);
      }, 500);
    };
    
    refreshData();
  }, []); 

  const filteredTweets = tweets.filter(tweet => 
    tweet.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tweet.message.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="main-feed">
      {isRefreshing && (
        <div style={{ 
          textAlign: 'center', 
          padding: '1rem',
          color: 'var(--text-secondary)',
          fontStyle: 'italic'
        }}>
          🔄 Refreshing feed...
        </div>
      )}
      {filteredTweets.map(tweet => (
        <Tweet 
          key={tweet.id} 
          title={tweet.title} 
          message={tweet.message} 
          likes={tweet.likes}
          userId={tweet.userId}
          date={tweet.date}
          userName={tweet.userName}
          avatar={tweet.userAvatar}
        />
      ))}
    </div>
  );
};

export default MainFeed;