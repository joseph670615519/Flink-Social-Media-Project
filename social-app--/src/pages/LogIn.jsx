import React, {useState} from 'react'
import { useNavigate } from 'react-router-dom';
import './Login.css'

function LogIn() {
    const[username, setUsername] = useState('');
    const[password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();

        if(!username.trim() || !password.trim()) {
            alert('Please fill username and password');
            return;
        }

        console.log('Logging in with:', { username, password });

        navigate('/');
    }

  return (
    <div className='login-page'>
        <div className='login-box'>
            <h2>Log-In</h2>
            <form onSubmit={handleSubmit}>

                <div className='login-input'>
                    <label>Username: </label>
                    <input id='login-username' type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)}/>
                </div>

                <div className='login-input'>
                    <label>Password: </label>
                    <input id='login-pw' type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>

                <button type='submit' className='login-btn'>Log In</button>

                <div className='create-account'>
                    <a href='/register'>Create an account</a></div>

            </form>
        </div>
    </div>
  )
}

export default LogIn