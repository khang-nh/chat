import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { doc, onSnapshot, updateDoc, setDoc, arrayUnion, Timestamp, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, User as UserIcon, Phone, Video, Info, ArrowLeft } from 'lucide-react';

const ChatWindow = ({ chat, onBack }) => {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const { currentUser } = useAuth();
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (chat?.id) {
      const unSub = onSnapshot(doc(db, "chats", chat.id), (doc) => {
        doc.exists() && setMessages(doc.data().messages);
      });
      return () => unSub();
    }
  }, [chat?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    const messageData = {
      id: crypto.randomUUID(),
      text,
      senderId: currentUser.uid,
      date: Timestamp.now(),
    };

    const currentText = text;
    setText(""); // Xóa ô nhập ngay lập tức để tạo cảm giác mượt mà

    try {
      await updateDoc(doc(db, "chats", chat.id), {
        messages: arrayUnion({
          ...messageData,
          text: currentText // Sử dụng biến tạm để đảm bảo dữ liệu đúng
        }),
      });

      // Cập nhật userChats...
      await updateDoc(doc(db, "userChats", currentUser.uid), {
        [chat.id + ".lastMessage"]: { text: currentText },
        [chat.id + ".date"]: serverTimestamp(),
      });

      await setDoc(doc(db, "userChats", chat.uid), {
        [chat.id]: {
          userInfo: {
            uid: currentUser.uid,
            displayName: currentUser.displayName,
            photoURL: currentUser.photoURL || ""
          },
          lastMessage: { text: currentText },
          date: serverTimestamp(),
        }
      }, { merge: true });
    } catch (err) {
      console.error("Lỗi gửi tin nhắn:", err);
      // Nếu lỗi, có thể hiện lại text cũ hoặc thông báo
      setText(currentText); 
      alert("Không thể gửi tin nhắn. Vui lòng kiểm tra quyền truy cập!");
    }
  };

  if (!chat) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-text-muted gap-4">
        <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center">
          <MessageSquare className="w-10 h-10 opacity-20" />
        </div>
        <p>Chọn một cuộc trò chuyện để bắt đầu</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-bg-dark/50">
      <div className="p-4 border-b flex items-center justify-between glass-effect">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="md:hidden p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-text-muted" />
          </button>
          <div className="p-3 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center overflow-hidden">
            {chat.photoURL ? <img src={chat.photoURL} className="w-full h-full object-cover" /> : <UserIcon className="text-text-muted" />}
          </div>
          <div>
            <p className="font-bold text-text-main">{chat.displayName}</p>
            <p className="text-xs text-green-500">Đang hoạt động</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-text-muted">
          <button className="p-3 hover:bg-white/10 rounded-full transition-all active:scale-90 hover:text-primary">
            <Phone className="w-5 h-5" />
          </button>
          <button className="p-3 hover:bg-white/10 rounded-full transition-all active:scale-90 hover:text-primary">
            <Video className="w-5 h-5" />
          </button>
          <button className="p-3 hover:bg-white/10 rounded-full transition-all active:scale-90 hover:text-primary">
            <Info className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <AnimatePresence initial={false}>
          {messages.map((m) => (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              key={m.id} 
              className={`flex mb-2 ${m.senderId === currentUser.uid ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] p-3 rounded-2xl relative ${
                m.senderId === currentUser.uid 
                  ? 'bg-primary text-white rounded-tr-none' 
                  : 'bg-white/10 text-text-main rounded-tl-none'
              }`}>
                <p className="text-[15px] leading-relaxed pr-2">{m.text}</p>
                <div className="flex justify-end mt-1">
                  <span className="text-[9px] opacity-60 font-medium">
                    {new Date(m.date.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="p-4 glass-effect">
        <div className="flex gap-3 rounded-2xl p-1.5 pl-4 transition-all focus-within:border-primary/50 focus-within:bg-white/10 shadow-inner">
          <input 
            type="text" 
            placeholder="Nhập tin nhắn..." 
            className="w-full bg-bg-dark border border-border rounded-xl py-3 pl-6 pr-14 text-base focus:border-primary transition-colors text-text-main"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <button 
            type="submit"
            className="bg-primary hover:bg-primary-hover text-white p-3 rounded-xl transition-all hover:scale-105 active:scale-95 flex-shrink-0"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
};

// Helper component for empty state
const MessageSquare = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
);

export default ChatWindow;
