import React, {useState, createContext, useEffect} from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
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
                console.log('Loaded tweets from Firestore tweets:', tweetsData.length);
            },
            (error) => {
                console.error("Error fetching tweets:", error);
                setLoading(false);
                setTweets([]);
            }
        );

        return () => unsubscribe();
    }, []);

    return (
        <TweetContext.Provider value={[tweets, setTweets]}>
            {props.children}
        </TweetContext.Provider>
    );
}