import React, {useContext} from "react";
import Tweet from "./Tweet.jsx";
import { TweetContext } from "./TweetContext.jsx";

const TweetList = ({ currentUserId, currentUserName, currentUserAvatar }) => {
    const [tweets] = useContext(TweetContext);
    return (
        <div>
            {tweets.map((tweet) => (
                <Tweet 
                    key={tweet.id} 
                    id={tweet.id}
                    title={tweet.title} 
                    message={tweet.message} 
                    likes={tweet.likes || []} 
                    comments={tweet.comments || []}
                    userName={tweet.userDisplayName || tweet.userName || "User"}
                    avatar={tweet.userPhotoURL || tweet.avatar}
                    date={tweet.date}
                    userId={tweet.userId}
                    currentUserId={currentUserId}
                    currentUserName={currentUserName}
                    currentUserAvatar={currentUserAvatar}
                />
            ))}
        </div>
    );
}

export default TweetList;
