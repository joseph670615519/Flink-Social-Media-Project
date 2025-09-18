import React, {useState, useContext} from 'react';
import { TweetContext } from './TweetContext';

const AddTweet = () => {
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [tweets, setTweets] = useContext(TweetContext);

    const updateTitle = (e) => {
        setTitle(e.target.value);
    }

    const updateMessage = (e) => {
        setMessage(e.target.value);
    }
    
    const addTweet = (e) => {
        e.preventDefault();
        setTweets(prevTweets => [...prevTweets,
             {title: title, message: message, likes: 0, id: prevTweets.length}]);
             const allTweets = tweets.map(tweet => tweets);
             allTweets.push({title: title, message: message, likes: 0, id: tweets.length});
             localStorage.setItem('tweets', JSON.stringify(allTweets));
    }
    return (
        <div>
            <form onSubmit={addTweet}>
                <input type="text" name ="title" placeholder="Title"
                value={title} onChange={updateTitle}/>
                <input type="text" name="message" placeholder="Message" 
                value={message} onChange={updateMessage}/>
                <button type="submit" className='small-btn'>Add Tweet</button>
            </form>
        </div>
    )
}

export default AddTweet;