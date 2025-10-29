import React, { useContext, useState, useEffect } from 'react';
import { TweetContext } from './TweetContext';
import Tweet from './Tweet';

const MainFeed = ({ user, searchTerm }) => {
  const { tweets } = useContext(TweetContext);
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

  // Safe filtering with null checks
  const filteredTweets = tweets.filter(tweet => {
    if (!tweet) return false;
    
    const searchLower = searchTerm?.toLowerCase() || '';
    if (!searchLower) return true;

    return (
      tweet.title?.toLowerCase().includes(searchLower) ||
      tweet.message?.toLowerCase().includes(searchLower) ||
      tweet.userName?.toLowerCase().includes(searchLower)
    );
  });

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
      
      {filteredTweets.map(tweet => {
        // Skip invalid tweets
        if (!tweet || !tweet.id) return null;

        return (
          <Tweet 
            key={tweet.id} 
            id={tweet.id}
            tweetId={tweet.id}
            title={tweet.title || ''} 
            message={tweet.message || ''} 
            likes={tweet.likes || 0}
            userId={tweet.userId || 'unknown'}
            date={tweet.date || 'Unknown date'}
            userName={tweet.userName || 'Unknown User'}
            avatar={tweet.userAvatar}
            imageURL={tweet.imageURL}
            isRetweet={tweet.isRetweet || false}
            originalTweetId={tweet.originalTweetId}
            originalUserId={tweet.originalUserId}
            originalUserName={tweet.originalUserName}
            originalUserAvatar={tweet.originalUserAvatar}
            originalDate={tweet.originalDate}
          />
        );
      })}
      
      {searchTerm && filteredTweets.length === 0 && (
        <div style={{ 
          textAlign: 'center', 
          padding: '2rem',
          color: '#666'
        }}>
          No results found for "{searchTerm}"
        </div>
      )}

      {!searchTerm && filteredTweets.length === 0 && (
        <div style={{ 
          textAlign: 'center', 
          padding: '2rem',
          color: '#666'
        }}>
          No posts yet. Be the first to post something!
        </div>
      )}
    </div>
  );
};

export default MainFeed;