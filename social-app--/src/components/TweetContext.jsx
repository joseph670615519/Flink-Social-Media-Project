import React, { useState, createContext, useEffect } from "react";
import { subscribeToAllPosts } from "../services/postsService";

export const TweetContext = createContext();

export const TweetProvider = (props) => {
    const [tweets, setTweets] = useState([
        {
            title: "Welcome to Flink",
            message: "This is my first tweet! Welcome to Flink - where you can connect, share, and communicate with friends!",
            likes: [],
            comments: [],
            id: "demo-1",
            userId: "demo-user",
            userDisplayName: "Flink Admin",
            userPhotoURL: '',
            date: new Date().toLocaleDateString(),
            createdAt: new Date()
        }
    ]);

    // Subscribe to Firebase posts updates
    useEffect(() => {
        const unsubscribe = subscribeToAllPosts((posts) => {
            setTweets(posts);
        });

        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, []);

    return (
        <TweetContext.Provider value={[tweets, setTweets]}>
            {props.children}
        </TweetContext.Provider>
    );
};
