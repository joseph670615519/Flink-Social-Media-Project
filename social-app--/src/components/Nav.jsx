import React, {useContext} from 'react';
import { TweetContext } from './TweetContext';

const Nav = () => {
    const [tweets, setTweets] = useContext(TweetContext);
    return (
        <div style={{ padding: '2rem', color: 'dark green' }}>
            <h3>Profile: Unknown</h3>
            <p>Number of tweets: {tweets.length}</p>
        </div>
    );
}

export default Nav;