import React, {useContext} from 'react';
import { TweetContext } from './TweetContext';

const List = () => {
    const [tweets, setTweets] = useContext(TweetContext);
    return (
        <div style={{ padding: '2rem', color: 'dark green' }}>
            <h3>Friend template</h3>
            <p>Number of friends</p>
        </div>
    );
}

export default List;