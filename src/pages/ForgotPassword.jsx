import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { auth } from '../firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import { motion } from 'framer-motion';
import { Mail, KeyRound, ArrowLeft } from 'lucide-react';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReset = async (e) => {
    e.preventDefault();
    try {
      setMessage('');
      setError('');
      setLoading(true);
      await sendPasswordResetEmail(auth, email);
      setMessage('Kiểm tra hộp thư đến để nhận hướng dẫn đặt lại mật khẩu.');
    } catch (err) {
      setError('Không thể gửi yêu cầu. Kiểm tra lại địa chỉ email.');
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
          <h1 className="text-4xl font-bold gradient-text mb-2">Quên mật khẩu?</h1>
          <p className="text-text-muted">Đừng lo, chúng tôi sẽ giúp bạn lấy lại</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        {message && (
          <div className="bg-green-500/10 border border-green-500/20 text-green-500 p-3 rounded-lg mb-6 text-sm">
            {message}
          </div>
        )}

        <form onSubmit={handleReset} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-muted ml-1">Nhập email của bạn</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
              <input 
                type="email" 
                required 
                className="w-full bg-bg-dark border border-border rounded-xl py-3 pl-11 pr-4 focus:border-primary transition-colors text-text-main"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-primary hover:bg-primary-hover text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 group disabled:opacity-50"
          >
            {loading ? 'Đang gửi...' : (
              <>
                Gửi yêu cầu
                <KeyRound className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        <div className="text-center mt-8">
          <Link to="/login" className="text-text-muted flex items-center justify-center gap-2 hover:text-text-main transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Quay lại đăng nhập
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
