import React, {useContext, useState} from "react";
import Tweet from "./Tweet.jsx";
import { TweetContext } from "./TweetContext.jsx";

const TweetList = () => {
    const { tweets, setTweets } = useContext(TweetContext);
    return (
        <div>
            {tweets.map((tweet) => (
                <Tweet 
                    key={tweet.id}
                    id={tweet.id} 
                    title={tweet.title} 
                    message={tweet.message} 
                    likes={tweet.likes}
                    userId={tweet.userId}
                    date={tweet.date}
                    userName={tweet.userName}
                    avatar={tweet.userAvatar}
                    imageURL={tweet.imageURL}
                />
            ))}
        </div>
    );
}

export default TweetList;