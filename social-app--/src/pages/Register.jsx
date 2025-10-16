import React, { useState} from 'react'
import './Register.css'

function Register () {
    const [Username, setUsername] = React.useState('');
    const [DoB, setDoB] = React.useState('');
    const [email, setEmail] = React.useState('');
    const [pw, setPw] = React.useState('');
    
    const handleSubmit = (e) => {
        e.preventDefault();

        //username
        const usernameRegex = /^[a-zA-Z0-9_]{5,}$/;
        if(!usernameRegex.test(Username)){
            alert('Username must be at least 5 characters and can include letters, numbers, _ or -');
            return;
        }

        //email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if(!emailRegex.test(email)){
            alert('Invalid email address.');
            return;
        }

        //password
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
        if(!passwordRegex.test(pw)){
            alert('Password must be at least 8 characters, include uppercase, lowercase, number, and special character.');
            return;
        }

        alert('Registration successful!');
        console.log('Registering with:', { Username, DoB, email, pw });
    };

  return (
    <div className='sign-up'>
        <h2>Sign up</h2>
        <form className="register-form" onSubmit={handleSubmit}>

            <div className='form-group'>
                <label>Username: </label>
                    <input id='register-username' type="text" placeholder="Username" value={Username} onChange={(e) => setUsername(e.target.value)} required/>
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
                    <input id='pw' type="password" placeholder="Password" value={pw} onChange={(e) => setPw(e.target.value)} required />
            </div>

            <button type="submit">Register</button>
           
        </form>

        <p>Already have an account? <a href="/"><br></br>Log-in</a></p>
    </div>
  )
}

export default Register