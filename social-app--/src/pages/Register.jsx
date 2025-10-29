import React, { useState } from 'react'
import './Register.css'
import { useNavigate } from 'react-router-dom'; 
import { createUserWithEmailAndPassword, updateProfile, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { User, Mail, Lock, Calendar, Chrome } from 'lucide-react';

function Register () {
    const [displayName, setDisplayName] = useState('');
    const [DoB, setDoB] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        if (!displayName.trim()) {
            alert('กรุณากรอกชื่อผู้ใช้');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            alert('รูปแบบอีเมลไม่ถูกต้อง');
            return;
        }

        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
        if (!passwordRegex.test(password)) {
            alert('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร และประกอบด้วยตัวพิมพ์เล็ก พิมพ์ใหญ่ ตัวเลข และอักขระพิเศษ');
            return;
        }

        setLoading(true);
        try {
            // สร้างผู้ใช้ใหม่
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // อัปเดต profile
            await updateProfile(user, {
                displayName: displayName
            });

            // บันทึกข้อมูลผู้ใช้ลง Firestore
            await setDoc(doc(db, 'users', user.uid), {
                displayName: displayName,
                email: email,
                dateOfBirth: DoB,
                photoURL: user.photoURL || '',
                createdAt: new Date(),
                loginMethod: 'email'
            });

            alert('สมัครสมาชิกสำเร็จ!');
            navigate('/');
        } catch (error) {
            console.error('Registration error:', error);
            alert('การสมัครสมาชิกไม่สำเร็จ: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleRegister = async () => {
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
                createdAt: new Date(),
                loginMethod: 'google'
            });

            navigate('/');
        } catch (error) {
            console.error('Google registration error:', error);
            alert('การสมัครด้วย Google ไม่สำเร็จ: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

  return (
    <div className='register-page'>
        <div className='register-container'>
            <div className='register-header'>
                <h1 className='flink-title'>✨ Flink</h1>
                <p className='flink-subtitle'>เข้าร่วมชุมชน Flink วันนี้</p>
            </div>
            
            <div className='register-box'>
                <h2>สร้างบัญชีใหม่</h2>
                
                <button 
                    type="button" 
                    className="google-register-btn"
                    onClick={handleGoogleRegister}
                    disabled={loading}
                >
                    <Chrome size={20} />
                    สมัครด้วย Google
                </button>
                
                <div className="divider">
                    <span>หรือ</span>
                </div>

                <form className="register-form" onSubmit={handleSubmit}>
                    <div className='form-group'>
                        <User size={20} className="input-icon" />
                        <input 
                            type="text" 
                            placeholder="ชื่อผู้ใช้" 
                            value={displayName} 
                            onChange={(e) => setDisplayName(e.target.value)} 
                            required
                        />
                    </div>

                    <div className='form-group'>
                        <Calendar size={20} className="input-icon" />
                        <input 
                            type="date" 
                            placeholder="วันเกิด" 
                            value={DoB} 
                            onChange={(e) => setDoB(e.target.value)} 
                            required 
                        />
                    </div>

                    <div className='form-group'>
                        <Mail size={20} className="input-icon" />
                        <input 
                            type="email" 
                            placeholder="อีเมล" 
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)} 
                            required 
                        />
                    </div>

                    <div className='form-group'>
                        <Lock size={20} className="input-icon" />
                        <input 
                            type="password" 
                            placeholder="รหัสผ่าน" 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                            required 
                        />
                    </div>

                    <button type="submit" className='register-btn' disabled={loading}>
                        {loading ? 'กำลังสร้างบัญชี...' : 'สร้างบัญชี'}
                    </button>
                </form>

                <div className='login-link'>
                    <p>มีบัญชีแล้ว? <a href="/login">เข้าสู่ระบบ</a></p>
                </div>
            </div>
        </div>
    </div>
  )
}

export default Register