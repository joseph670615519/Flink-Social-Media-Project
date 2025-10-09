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
                        <input
                            type='text'
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                </div>

                <div className='login-input'>
                    <label>Password: </label>
                    <input
                        type='password'
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>

                <button type='submit' className='login-btn'>Log In</button>

                <div className='create-account'>Create an account</div>

            </form>
        </div>
    </div>
  )
}

export default LogIn