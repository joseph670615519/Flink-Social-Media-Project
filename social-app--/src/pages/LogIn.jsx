import React, {useState} from 'react'
import './Login.css'

function LogIn() {
    const[username, setUsername] = useState('');
    const[password, setPassword] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log('Logging in with:', { username, password });
    }

  return (
    <div className='login-page'>
        <div className='login-box'>
            <h2>Log-In</h2>
            <form onSubmit={handleSubmit}>

                <div className='login-input'>
                    <label>Username: </label>
                    <input id='login-username' type="text" placeholder="Username" required />
                </div>

                <div className='login-input'>
                    <label>Password: </label>
                    <input id='login-pw' type="password" placeholder="Password" required />
                </div>

                <button type='submit' className='login-btn'>Log In</button>

                <div className='create-account'><a href='/register'>Create an account</a></div>

            </form>
        </div>
    </div>
  )
}

export default LogIn