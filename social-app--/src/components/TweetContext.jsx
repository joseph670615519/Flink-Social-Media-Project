import React, {useState, createContext, useEffect} from "react";
import { collection, onSnapshot, orderBy, query, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from '../firebase';

export const TweetContext = createContext();

export const TweetProvider = (props) => {
    const [tweets, setTweets] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const tweetsQuery = query(
            collection(db, 'tweets'),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(tweetsQuery, 
            (snapshot) => {
                const tweetsData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setTweets(tweetsData);
                setLoading(false);
            },
            (error) => {
                console.error("Error fetching tweets:", error);
                setLoading(false);
                setTweets([]);
            }
        );

        return () => unsubscribe();
    }, []);

    const enhancedSetTweets = (newTweets) => {
        setTweets(newTweets);
        
        if (Array.isArray(newTweets) && newTweets.length > tweets.length) {
            const newTweet = newTweets.find(tweet => 
                !tweets.some(existing => existing.id === tweet.id)
            );
            
            if (newTweet && newTweet.title && newTweet.message) {
                addDoc(collection(db, 'tweets'), {
                    title: newTweet.title,
                    message: newTweet.message,
                    likes: newTweet.likes || 0,
                    userId: newTweet.userId || 'current-user',
                    userName: newTweet.userName || 'User',
                    userAvatar: newTweet.userAvatar,
                    date: newTweet.date || new Date().toLocaleDateString(),
                    createdAt: serverTimestamp()
                }).catch(error => {
                    console.error("Error saving tweet to Firestore:", error);
                });
            }
        }
    };

    const contextValue = [tweets, enhancedSetTweets];

    return (
        <TweetContext.Provider value={contextValue}>
            {props.children}
        </TweetContext.Provider>
    );
}