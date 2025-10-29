import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { Mail, Lock, Chrome } from 'lucide-react';
import './Login.css'

function LogIn() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!email.trim() || !password.trim()) {
            alert('กรุณากรอกอีเมลและรหัสผ่าน');
            return;
        }

        setLoading(true);
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            
            // บันทึกข้อมูลผู้ใช้ลง Firestore
            await setDoc(doc(db, 'users', user.uid), {
                displayName: user.displayName || user.email,
                email: user.email,
                photoURL: user.photoURL || '',
                lastLogin: new Date(),
                loginMethod: 'email'
            }, { merge: true });

            navigate('/');
        } catch (error) {
            console.error('Login error:', error);
            alert('ล็อกอินไม่สำเร็จ: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        const provider = new GoogleAuthProvider();
        setLoading(true);
        
        try {
            const result = await signInWithPopup(auth, provider);
            const user = result.user;
            
            // บันทึกข้อมูลผู้ใช้ลง Firestore
            await setDoc(doc(db, 'users', user.uid), {
                displayName: user.displayName,
                email: user.email,
                photoURL: user.photoURL,
                lastLogin: new Date(),
                loginMethod: 'google'
            }, { merge: true });

            navigate('/');
        } catch (error) {
            console.error('Google login error:', error);
            alert('ล็อกอินด้วย Google ไม่สำเร็จ: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

  return (
    <div className='login-page'>
        <div className='login-container'>
            <div className='login-header'>
                <h1 className='flink-title'>✨ Flink</h1>
                <p className='flink-subtitle'>Connect, share, and make memories together.</p>
            </div>
            
            <div className='login-box'>
                <h2>เข้าสู่ระบบ</h2>
                
                <button 
                    type="button" 
                    className="google-login-btn"
                    onClick={handleGoogleLogin}
                    disabled={loading}
                >
                    <Chrome size={20} />
                    เข้าสู่ระบบด้วย Google
                </button>
                
                <div className="divider">
                    <span>หรือ</span>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className='login-input'>
                        <Mail size={20} className="input-icon" />
                        <input 
                            type="email" 
                            placeholder="อีเมล" 
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className='login-input'>
                        <Lock size={20} className="input-icon" />
                        <input 
                            type="password" 
                            placeholder="รหัสผ่าน" 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                            required
                        />
                    </div>

                    <button type='submit' className='login-btn' disabled={loading}>
                        {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
                    </button>

                    <div className='create-account'>
                        <p>ยังไม่มีบัญชี? <a href='/register'>สร้างบัญชีใหม่</a></p>
                    </div>
                </form>
            </div>
        </div>
    </div>
  )
}

export default LogIn