import React, { useState} from 'react'
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import './Register.css'

function Register () {
    const [displayName, setDisplayName] = useState('');
    const [DoB, setDoB] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();
    
    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation (keep your existing validation)
        const usernameRegex = /^[a-zA-Z0-9_]{5,}$/;
        if(!usernameRegex.test(displayName)){
            alert('Username must be at least 5 characters and can include letters, numbers, _ or -');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if(!emailRegex.test(email)){
            alert('Invalid email address.');
            return;
        }

        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
        if(!passwordRegex.test(password)){
            alert('Password must be at least 8 characters, include uppercase, lowercase, number, and special character.');
            return;
        }

        try {
      
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            await updateProfile(user, {
                displayName: displayName
            });

            await setDoc(doc(db, 'users', user.uid), {
                displayName: displayName,
                email: email,
                dateOfBirth: DoB,
                createdAt: new Date().toISOString(),
                friends: [],
                friendRequests: []
            });

            alert('Registration successful!');
            console.log('Registered successfully:', user);
            navigate('/feed'); 
        } catch (error) {
            console.error('Registration error:', error);
            alert('Registration failed: ' + error.message);
        }
    };

  return (
    <div className='sign-up'>
        <h2>Sign up</h2>
        <form className="register-form" onSubmit={handleSubmit}>

            <div className='form-group'>
                <label>Username: </label>
                    <input id='register-username' type="text" placeholder="Username" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required/>
            </div>
    
            <div className='form-group'>
                <label>Date of Birth: </label>
                    <input id='DoB' type="date" placeholder="Date of Birth" value={DoB} onChange={(e) => setDoB(e.target.value)} required />
            </div>

            <div className='form-group'>
                <label>Email address: </label>
                    <input id='email' type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>

            <div className='form-group'>
                <label>New password: </label>
                    <input id='pw' type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>

            <button id='register-btn' type="submit">Register</button>
           
        </form>

        <p>Already have an account? <a href="/"><br></br>Log-in</a></p>
    </div>
  )
}

export default Register