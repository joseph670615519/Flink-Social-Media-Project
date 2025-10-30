import React, {useState, createContext} from "react";
export const TweetContext = createContext();
export const TweetProvider = (props) => {
    const [tweets, setTweets] = useState([
         {
            title: "First Tweet",
            message: "This is my first tweet!",
            likes: 0,
            id: 0,
            userId: "current-user",
            date: new Date().toLocaleDateString()
        },
        {
            title: "Second Tweet",
            message: "This is my second tweet!",
            likes: 3,
            id: 1,
            userId: "current-user",
            date: new Date().toLocaleDateString()
        },
    ]);
    return (
        <TweetContext.Provider value={[tweets, setTweets]}>
            {props.children}
        </TweetContext.Provider>
    );
}
