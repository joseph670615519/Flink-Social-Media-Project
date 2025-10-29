import React, {useState, createContext, useEffect} from "react";
import { collection, onSnapshot, orderBy, query, doc, getDoc, updateDoc, addDoc, serverTimestamp, arrayUnion, arrayRemove, deleteDoc, getDocs, where } from "firebase/firestore";
import { db } from '../firebase';

export const TweetContext = createContext();

export const TweetProvider = (props) => {
    const [tweets, setTweets] = useState([]);
    const [loading, setLoading] = useState(true);

    const addComment = async (tweetId, commentText, user) => {
        try {
            const tweetRef = doc(db, 'tweets', tweetId);
            const tweetSnap = await getDoc(tweetRef);
            
            if (!tweetSnap.exists()) {
                console.error("Tweet not found");
                return false;
            }
            
            const currentData = tweetSnap.data();
            const existingComments = currentData.comments || [];
            
            const newComment = {
                id: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                text: commentText,
                userId: user.uid,
                userName: user.displayName || user.email.split('@')[0],
                userAvatar: user.photoURL,
                timestamp: serverTimestamp(),
                createdAt: new Date().toISOString(),
                date: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
            };

            await updateDoc(tweetRef, {
                comments: arrayUnion(newComment)
            });

            console.log('Comment added successfully to tweet:', tweetId);
            return true;
        } catch (error) {
            console.error("Couldn't add comment:", error);
            return false;
        }
    };

    const checkIfRetweeted = async (originalTweetId, userId) => {
        try {
            const tweetRef = doc(db, 'tweets', originalTweetId);
            const tweetSnap = await getDoc(tweetRef);
            
            if (!tweetSnap.exists()) return false;

            const tweetData = tweetSnap.data();
            const retweets = tweetData.retweets || [];
            
            return retweets.includes(userId);
        } catch (error) {
            console.error("Error checking retweet status:", error);
            return false;
        }
    };

    const retweetPost = async (originalTweetId, user) => {
        try {
            // Get the original tweet
            const tweetRef = doc(db, 'tweets', originalTweetId);
            const tweetSnap = await getDoc(tweetRef);
            
            if (!tweetSnap.exists()) {
                console.error("Tweet not found");
                return false;
            }

            const originalTweet = tweetSnap.data();

            // Check if user already retweeted this
            const existingRetweets = originalTweet.retweets || [];
            if (existingRetweets.includes(user.uid)) {
                // Already retweeted, so unretweet
                return await unretweetPost(originalTweetId, user);
            }

            // Create a retweet entry
            const retweetDoc = await addDoc(collection(db, 'tweets'), {
                title: originalTweet.title,
                message: originalTweet.message,
                imageURL: originalTweet.imageURL,
                likes: 0,
                userId: user.uid, // Current user who retweeted
                userName: user.displayName || user.email,
                userAvatar: user.photoURL,
                date: new Date().toLocaleDateString(),
                createdAt: serverTimestamp(),
                isRetweet: true,
                originalTweetId: originalTweetId,
                originalUserId: originalTweet.userId,
                originalUserName: originalTweet.userName,
                originalUserAvatar: originalTweet.userAvatar,
                originalDate: originalTweet.date,
                comments: [],
                retweets: [],
                retweetCount: 0
            });

            // Update original tweet with retweet info
            await updateDoc(tweetRef, {
                retweets: arrayUnion(user.uid),
                retweetCount: (originalTweet.retweetCount || 0) + 1
            });

            // Add notification to original poster
            if (originalTweet.userId !== user.uid) {
                const originalUserRef = doc(db, 'users', originalTweet.userId);
                const originalUserSnap = await getDoc(originalUserRef);
                
                if (originalUserSnap.exists()) {
                    const userData = originalUserSnap.data();
                    const notifications = userData.notifications || [];
                    
                    const newNotification = {
                        id: Math.random().toString(36).substr(2, 9),
                        type: 'retweet',
                        fromUserId: user.uid,
                        fromUserName: user.displayName || user.email,
                        fromUserAvatar: user.photoURL,
                        tweetId: originalTweetId,
                        message: 'retweeted your post',
                        timestamp: new Date(),
                        read: false
                    };

                    await updateDoc(originalUserRef, {
                        notifications: [...notifications, newNotification]
                    });
                }
            }

            console.log('Retweet successful:', retweetDoc.id);
            return true;
        } catch (error) {
            console.error("Error retweeting:", error);
            return false;
        }
    };

    const unretweetPost = async (originalTweetId, user) => {
        try {
            // Find and delete the retweet document
            const retweetsQuery = query(
                collection(db, 'tweets'),
                where('isRetweet', '==', true),
                where('originalTweetId', '==', originalTweetId),
                where('userId', '==', user.uid)
            );

            const retweetSnap = await getDocs(retweetsQuery);
            
            if (!retweetSnap.empty) {
                // Delete the retweet document
                const retweetDoc = retweetSnap.docs[0];
                await deleteDoc(doc(db, 'tweets', retweetDoc.id));
            }

            // Update original tweet
            const tweetRef = doc(db, 'tweets', originalTweetId);
            const tweetSnap = await getDoc(tweetRef);
            
            if (tweetSnap.exists()) {
                const tweetData = tweetSnap.data();
                await updateDoc(tweetRef, {
                    retweets: arrayRemove(user.uid),
                    retweetCount: Math.max((tweetData.retweetCount || 1) - 1, 0)
                });
            }

            console.log('Unretweet successful');
            return true;
        } catch (error) {
            console.error("Error unretweeting:", error);
            return false;
        }
    };

    useEffect(() => {
        const tweetsQuery = query(
            collection(db, 'tweets'),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(tweetsQuery, 
            (snapshot) => {
                const tweetsData = snapshot.docs.map(doc => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        ...data,
                        // Ensure comments is always an array
                        comments: data.comments || []
                    };
                });
                setTweets(tweetsData);
                setLoading(false);
                console.log('Loaded tweets from Firestore:', tweetsData.length);
                
                // Log comments for debugging
                tweetsData.forEach(tweet => {
                    if (tweet.comments && tweet.comments.length > 0) {
                        console.log(`Tweet ${tweet.id} has ${tweet.comments.length} comments`);
                    }
                });
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
        <TweetContext.Provider value={{ tweets, setTweets, addComment, retweetPost, checkIfRetweeted, loading }}>
            {props.children}
        </TweetContext.Provider>
    );
}