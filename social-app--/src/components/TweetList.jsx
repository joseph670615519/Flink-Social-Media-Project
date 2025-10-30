import React, {useContext, useState} from "react";
import Tweet from "./Tweet.jsx";
import { TweetContext } from "./TweetContext.jsx";

const TweetList = () => {
    const [tweets, setTweets] = useContext(TweetContext);
    return (
        <div>
            {tweets.map((tweet) => (
                <Tweet key={tweet.id} title={tweet.title} 
                message={tweet.message} likes={tweet.likes} />
            ))}
        </div>
    );
}

export default TweetList;
