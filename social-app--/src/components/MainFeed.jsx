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
    searchTerm === '' || 
    tweet.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tweet.message?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tweet.userName?.toLowerCase().includes(searchTerm.toLowerCase())
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
      
      {searchTerm && (
        <div style={{ 
          padding: '1rem',
          background: '#f8fff4',
          borderRadius: '8px',
          marginBottom: '1rem',
          border: '1px solid #86c76b'
        }}>
          <strong>Search results for: "{searchTerm}"</strong>
          <span style={{ color: '#666', marginLeft: '1rem' }}>
            ({filteredTweets.length} {filteredTweets.length === 1 ? 'result' : 'results'})
          </span>
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
      
      {searchTerm && filteredTweets.length === 0 && (
        <div style={{ 
          textAlign: 'center', 
          padding: '2rem',
          color: '#666'
        }}>
          No results found for "{searchTerm}"
        </div>
      )}
    </div>
  );
};

export default MainFeed;