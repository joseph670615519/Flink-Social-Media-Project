import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, ensureUserDoc } from "../firebase";

function LogIn() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!username.trim() || !password.trim()) {
      alert('Please fill email and password');
      return;
    }

    try {
      
      const userCredential = await signInWithEmailAndPassword(auth, username, password);
      console.log("✅ Logged in as:", userCredential.user.uid);

    
      await ensureUserDoc();

      navigate("/");
    } catch (error) {
      console.error(error);
      alert("Login failed: " + error.message);
    }
  };

  return (
    <div className='login-page'>
      <div className='login-box'>
        <h2>Log-In</h2>
        <form onSubmit={handleSubmit}>
          <div className='login-input'>
            <label>Email: </label>
            <input
              id='login-email'
              type="email"
              placeholder="Email"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div className='login-input'>
            <label>Password: </label>
            <input
              id='login-pw'
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button type='submit' className='login-btn'>Log In</button>

          <div className='create-account'>
            <a href='/register'>Create an account</a>
          </div>
        </form>
      </div>
    </div>
  );
}

export default LogIn;
