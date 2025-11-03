import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, ensureUserDoc, signInWithGoogle } from "../firebase";

function LogIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      alert('Please fill in both email and password.');
      return;
    }

    try {
      // Firebase login
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log(" Logged in as:", userCredential.user.uid);

      // Ensure user doc exists in Firestore
      await ensureUserDoc();

      // Track login event
      const { trackUserLogin } = await import("../firebase");
      trackUserLogin(userCredential.user.uid);

      // Navigate to main feed
      navigate("/feed");
    } catch (error) {
      console.error("Login error:", error);
      alert("Login failed: " + error.message);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const result = await signInWithGoogle();
      if (result.success) {
        console.log("Google sign-in successful:", result.user.uid);
        navigate("/feed");
      } else {
        alert("Google sign-in failed: " + result.error);
      }
    } catch (error) {
      console.error("Google sign-in error:", error);
      alert("Google sign-in failed: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="flink-header">
        <div className="flink-logo">
          <img 
            src="https://cdn-icons-png.flaticon.com/512/2190/2190552.png" 
            alt="Flink Logo" 
            style={{
              width: '40px',
              height: '40px',
              marginRight: '12px'
            }}
          />
          Flink
        </div>
        <p>Connect, share, and make memories together.</p>
      </div>
      
      <div className="login-box">
        <h2>Sign In to Your Account</h2>
        
        <button 
          className="google-signin-btn" 
          onClick={handleGoogleSignIn}
          disabled={loading}
        >
          {loading ? 'Signing in...' : 'Sign in with Google'}
        </button>
        
        <div className="divider">or</div>
        
        <form onSubmit={handleSubmit}>
          <div className="login-input">
            <input
              id="login-email"
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="login-input">
            <input
              id="login-pw"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button type="submit" className="login-btn">Sign In</button>

          <div className="create-account">
            Don't have an account? <a href="/register">Create new account</a>
          </div>
        </form>
      </div>
    </div>
  );
}

export default LogIn;
