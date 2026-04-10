import React, { useState, useEffect, useRef } from 'react';
import { auth, db } from '../firebase';
import { collection, query, orderBy, startAt, endAt, getDocs, setDoc, doc, updateDoc, serverTimestamp, getDoc, onSnapshot, writeBatch } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { Search, LogOut, Settings, MessageSquare, User as UserIcon, Sun, Moon, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const Sidebar = ({ onSelectChat, selectedChat }) => {
  const [username, setUsername] = useState('');
  const [user, setUser] = useState(null);
  const [chats, setChats] = useState([]);
  const [allUsers, setAllUsers] = useState([]); // New state for all users
  const [showMenu, setShowMenu] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const menuRef = useRef(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Fetch ALL users
  useEffect(() => {
    const fetchAllUsers = async () => {
      const q = query(collection(db, "users"));
      const querySnapshot = await getDocs(q);
      const users = [];
      querySnapshot.forEach((doc) => {
        if (doc.data().uid !== currentUser.uid) {
          users.push(doc.data());
        }
      });
      setAllUsers(users);
    };
    currentUser.uid && fetchAllUsers();
  }, [currentUser.uid]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  useEffect(() => {
    const getChats = () => {
      const unsub = onSnapshot(doc(db, "userChats", currentUser.uid), (doc) => {
        setChats(Object.entries(doc.data() || {}).sort((a, b) => b[1].date - a[1].date));
      });
      return () => unsub();
    };
    currentUser.uid && getChats();
  }, [currentUser.uid]);

  const handleSearch = async () => {
    if (!username.trim()) return;
    const q = query(
      collection(db, "users"), 
      orderBy("displayName"),
      startAt(username),
      endAt(username + "\uf8ff")
    );
    try {
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        setUser(null);
        alert("Không tìm thấy người dùng này!");
      } else {
        querySnapshot.forEach((doc) => {
          if (doc.data().uid !== currentUser.uid) setUser(doc.data());
        });
      }
    } catch (err) {}
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleSelect = async (selectedUser) => {
    const combinedId = currentUser.uid > selectedUser.uid ? currentUser.uid + selectedUser.uid : selectedUser.uid + currentUser.uid;
    try {
      const res = await getDoc(doc(db, "chats", combinedId));
      if (!res.exists()) {
        const batch = writeBatch(db);

        // 1. Tạo phòng chat mới
        const chatRef = doc(db, "chats", combinedId);
        batch.set(chatRef, { messages: [] });

        // 2. Cập nhật userChats của người gửi
        const senderChatsRef = doc(db, "userChats", currentUser.uid);
        batch.set(senderChatsRef, {
          [combinedId]: {
            userInfo: {
              uid: selectedUser.uid,
              displayName: selectedUser.displayName,
              photoURL: selectedUser.photoURL || ""
            },
            date: serverTimestamp()
          }
        }, { merge: true });

        // 3. Cập nhật userChats của người nhận
        const receiverChatsRef = doc(db, "userChats", selectedUser.uid);
        batch.set(receiverChatsRef, {
          [combinedId]: {
            userInfo: {
              uid: currentUser.uid,
              displayName: currentUser.displayName,
              photoURL: currentUser.photoURL || ""
            },
            date: serverTimestamp()
          }
        }, { merge: true });

        // Thực thi tất cả các lệnh cùng lúc
        await batch.commit();
      }
      onSelectChat({ id: combinedId, ...selectedUser });
    } catch (err) {
      console.error("Lỗi khi chọn user:", err);
    }
    setUser(null);
    setUsername("");
  };

  return (
    <div className="flex-1 flex flex-col h-full glass-effect">
      <div className="p-4 border-b">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 w-10 h-10 bg-primary rounded-full flex items-center justify-center">
            <MessageSquare className="text-white w-6 h-6" />
          </div>
          <span className="font-bold text-lg gradient-text">NK Chat | NK Messenger</span>
        </div>
        
        <div className="relative">
          <input 
            type="text" 
            placeholder="Tìm người dùng..." 
            className="w-full bg-bg-dark border border-border rounded-xl py-3 pl-6 pr-14 text-base focus:border-primary transition-colors text-text-main"
            onKeyDown={handleKeyDown}
            onChange={(e) => setUsername(e.target.value)}
            value={username}
          />
          <button 
            onClick={handleSearch}
            className="absolute top-1 bottom-1 right-1 px-3 bg-primary/20 border border-primary/30 rounded-lg flex items-center justify-center text-primary hover:bg-primary/30 transition-all active:scale-95"
          >
            <Search className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {user && (
          <div className="p-4 flex items-center gap-3 cursor-pointer hover:bg-white/5 border-b border-primary/20 bg-primary/5" onClick={() => handleSelect(user)}>
            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center overflow-hidden">
              {user.photoURL ? <img src={user.photoURL} className="w-full h-full object-cover" /> : <UserIcon className="text-text-muted" />}
            </div>
            <div>
              <p className="font-medium text-text-main">{user.displayName}</p>
              <p className="text-xs text-primary">Nhấp để bắt đầu chat</p>
            </div>
          </div>
        )}

        {chats.length > 0 && (
          <div className="px-4 py-2 bg-white/5 text-[10px] font-bold text-text-muted uppercase tracking-wider">Tin nhắn gần đây</div>
        )}
        {chats.map((chat) => (
          <div 
            key={chat[0]} 
            className={`p-4 flex items-center gap-3 cursor-pointer transition-colors ${selectedChat?.id === chat[0] ? 'bg-white/10' : 'hover:bg-white/5'}`}
            onClick={() => onSelectChat({ id: chat[0], ...chat[1].userInfo })}
          >
            <div className="p-3 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center overflow-hidden">
              {chat[1].userInfo?.photoURL ? <img src={chat[1].userInfo?.photoURL} className="w-full h-full object-cover" /> : <UserIcon className="text-text-muted" />}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="font-medium text-text-main">{chat[1].userInfo?.displayName}</p>
              <p className="text-xs text-text-muted truncate">{chat[1].lastMessage?.text || "Chưa có tin nhắn"}</p>
            </div>
          </div>
        ))}

        <div className="px-4 py-2 mt-2 bg-white/5 text-[10px] font-bold text-text-muted uppercase tracking-wider">Tất cả người dùng ({allUsers.length})</div>
        {allUsers.map((u) => (
          <div 
            key={u.uid} 
            className="p-4 flex items-center gap-3 cursor-pointer hover:bg-white/5 transition-colors"
            onClick={() => handleSelect(u)}
          >
            <div className="p-3 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center overflow-hidden">
              {u.photoURL ? <img src={u.photoURL} className="w-full h-full object-cover" /> : <UserIcon className="text-text-muted" />}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="font-medium text-text-main">{u.displayName}</p>
              <p className="text-[10px] text-text-muted italic">Sẵn sàng để chat</p>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t bg-white/5 relative">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            {currentUser.photoURL ? <img src={currentUser.photoURL} className="w-full h-full rounded-full object-cover" /> : <UserIcon className="text-primary" />}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="font-medium text-text-main truncate">{currentUser.displayName}</p>
            <p className="text-xs text-text-muted truncate">{currentUser.email}</p>
          </div>
        </div>
        
        <div className="relative" ref={menuRef}>
          <button 
            onClick={() => setShowMenu(!showMenu)} 
            className={`w-full ${showMenu ? 'bg-primary/20 text-primary' : 'bg-white/5 text-text-muted'} hover:bg-white/10 p-3 rounded-xl flex items-center justify-center gap-2 transition-all font-medium text-sm`}
          >
            <Settings className={`w-4 h-4 ${showMenu ? 'rotate-90' : ''} transition-transform duration-300`} />
            Cấu hình & Tài khoản
          </button>
          
          <AnimatePresence>
            {showMenu && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                className="absolute bottom-full left-0 mb-4 w-full glass-effect rounded-2xl shadow-2xl overflow-hidden z-50 p-2 border border-white/10"
              >
                  <p className="text-[12px] uppercase tracking-wider text-text-muted font-bold mb-3 px-1">Cấu hình & tài khoản</p>
                <div className="p-2 mb-2">
                  <div 
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    className="bg-bg-dark/50 p-1 rounded-xl flex items-center cursor-pointer relative border border-white/5"
                  >
                    <motion.div 
                      className="absolute w-[calc(50%-4px)] h-[calc(100%-8px)] bg-primary rounded-lg shadow-lg"
                      animate={{ x: theme === 'dark' ? '100%' : '0%' }}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                    <div className="flex-1 flex items-center justify-center gap-2 py-2 z-10 text-xs font-medium transition-colors duration-300">
                      <Sun className={`w-3.5 h-3.5 ${theme === 'light' ? 'text-white' : 'text-text-muted'}`} />
                      <span className={theme === 'light' ? 'text-white' : 'text-text-muted'}>Sáng</span>
                    </div>
                    <div className="flex-1 flex items-center justify-center gap-2 py-2 z-10 text-xs font-medium transition-colors duration-300">
                      <Moon className={`w-3.5 h-3.5 ${theme === 'dark' ? 'text-white' : 'text-text-muted'}`} />
                      <span className={theme === 'dark' ? 'text-white' : 'text-text-muted'}>Tối</span>
                    </div>
                  </div>
                </div>

                <div className="h-px bg-white/5 my-1" />

                <button 
                  onClick={() => navigate('/change-password')}
                  className="w-full flex items-center gap-3 p-3 hover:bg-white/5 bg-primary/20 text-primary rounded-xl transition-colors text-sm text-text-main mb-2"
                >
                  <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                    <Lock className="w-4 h-4 text-orange-500" />
                  </div>
                  <span>Đổi mật khẩu</span>
                </button>
                
                <button 
                  onClick={() => auth.signOut()}
                  className="w-full flex items-center gap-3 p-3 bg-primary/20 text-primary hover:bg-red-500/10 rounded-xl transition-colors text-sm text-red-500"
                >
                  <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                    <LogOut className="w-4 h-4 text-red-500" />
                  </div>
                  <span>Đăng xuất</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
