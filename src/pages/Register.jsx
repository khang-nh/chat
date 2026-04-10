import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { Mail, Lock, User, UserPlus, ArrowRight } from 'lucide-react';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);
      const res = await createUserWithEmailAndPassword(auth, email, password);
      
      console.log('User created:', res.user.uid);

      await updateProfile(res.user, {
        displayName: username
      });
      
      console.log('Profile updated');

      await setDoc(doc(db, "users", res.user.uid), {
        uid: res.user.uid,
        email: email,
        displayName: username, 
        photoURL: "", 
        status: "online",
        createdAt: serverTimestamp() 
      });

      console.log('User doc created');

      await setDoc(doc(db, "userChats", res.user.uid), {});

      console.log('UserChats doc created, navigating...');
      
      navigate('/');
    } catch (err) {
      console.error('Registration error:', err);
      if (err.code === 'auth/email-already-in-use') {
        setError('Email đã được sử dụng. Vui lòng dùng email khác.');
      } else if (err.code === 'auth/weak-password') {
        setError('Mật khẩu quá yếu (tối thiểu 6 ký tự).');
      } else {
        setError('Lỗi: ' + (err.message || 'Không thể tạo tài khoản'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-effect w-full max-w-md p-8 rounded-2xl shadow-2xl"
      >
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold gradient-text mb-2">Tham gia ngay</h1>
          <p className="text-text-muted">Tạo tài khoản để bắt đầu trò chuyện</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-muted ml-1">Tên hiển thị</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="w-5 h-5 text-text-muted" />
              </div>
              <input 
                type="text" 
                required 
                className="w-full bg-bg-dark border border-border rounded-xl py-3 pl-11 pr-6 focus:border-primary transition-colors text-text-main"
                placeholder="Nguyễn Văn A"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-text-muted ml-1">Email</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="w-5 h-5 text-text-muted" />
              </div>
              <input 
                type="email" 
                required 
                className="w-full bg-bg-dark border border-border rounded-xl py-3 pl-11 pr-6 focus:border-primary transition-colors text-text-main"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-text-muted ml-1">Mật khẩu</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="w-5 h-5 text-text-muted" />
              </div>
              <input 
                type="password" 
                required 
                className="w-full bg-bg-dark border border-border rounded-xl py-3 pl-11 pr-4 focus:border-primary transition-colors text-text-main"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-primary hover:bg-primary-hover text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 group disabled:opacity-50"
          >
            {loading ? 'Đang tạo...' : (
              <>
                Tạo tài khoản
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <p className="text-center mt-8 text-text-muted">
          Đã có tài khoản?{' '}
          <Link to="/login" className="text-primary font-semibold hover:text-primary-hover">
            Đăng nhập
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Register;
