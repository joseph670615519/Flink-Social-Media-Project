import React from 'react'
import './Register.css'

function Register () {
  return (
    <div className='sign-up'>
        <h2>Sign up</h2>
        <form className="register-form">

            <div className='name-row'>
                <div className='name-group'>
                    <label>First name: </label>
                        <input id='fname' type="text" placeholder="First name" required />
                </div>

                <div className='name-group'>
                    <label>Last name: </label>
                        <input id='lname' type="text" placeholder="Last name" required />                    
                </div>
            </div>

            <div className='form-group'>
                <label>Date of Birth: </label>
                    <input id='DoB' type="date" placeholder="Date of Birth" required />
            </div>

            <div className='form-group'>
                <label>Email address: </label>
                    <input id='email' type="email" placeholder="Email" required />
            </div>

            <div className='form-group'>
                <label>New password: </label>
                    <input id='pw' type="password" placeholder="Password" required />
            </div>

            <button type="submit">Register</button>
        </form>

        <p>Already have an account? <a href="/"><br></br>Log-in</a></p>
    </div>
  )
}

export default Register