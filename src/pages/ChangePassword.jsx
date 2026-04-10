import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth } from '../firebase';
import { updatePassword } from 'firebase/auth';
import { motion } from 'framer-motion';
import { Lock, ShieldCheck, ArrowLeft, Save } from 'lucide-react';

const ChangePassword = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      return setError('Mật khẩu không khớp!');
    }

    try {
      setMessage('');
      setError('');
      setLoading(true);
      if (auth.currentUser) {
        await updatePassword(auth.currentUser, newPassword);
        setMessage('Cập nhật mật khẩu thành công!');
        setTimeout(() => navigate('/'), 2000);
      }
    } catch (err) {
      setError('Cần đăng nhập lại để thực hiện thao tác này.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-effect w-full max-w-md p-8 rounded-2xl shadow-2xl"
      >
        <div className="flex items-center gap-4 mb-8">
          <Link to="/" className="p-2 rounded-full hover:bg-white/5 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold gradient-text">Đổi mật khẩu</h1>
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

        <form onSubmit={handleChangePassword} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-muted ml-1">Mật khẩu mới</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
              <input 
                type="password" 
                required 
                className="w-full bg-bg-dark border border-border rounded-xl py-3 pl-11 pr-4 focus:border-primary transition-colors text-text-main"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-text-muted ml-1">Xác nhận mật khẩu</label>
            <div className="relative">
              <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
              <input 
                type="password" 
                required 
                className="w-full bg-bg-dark border border-border rounded-xl py-3 pl-11 pr-4 focus:border-primary transition-colors text-text-main"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-primary hover:bg-primary-hover text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 group disabled:opacity-50"
          >
            {loading ? 'Đang cập nhật...' : (
              <>
                Lưu mật khẩu
                <Save className="w-5 h-5" />
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default ChangePassword;
