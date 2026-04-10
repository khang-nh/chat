import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import ChatWindow from '../components/ChatWindow';

const Chat = () => {
  const [selectedChat, setSelectedChat] = useState(null);

  return (
    <div className="flex h-screen overflow-hidden bg-bg-dark">
      <div className="flex w-full h-full max-w-[1600px] mx-auto overflow-hidden">
        <div className={`w-80 border-r flex flex-col ${selectedChat ? 'sidebar-hidden' : ''}`}>
          <Sidebar onSelectChat={setSelectedChat} selectedChat={selectedChat} />
        </div>
        <div className={`flex-1 flex flex-col ${!selectedChat ? 'chat-hidden' : ''}`}>
          <ChatWindow chat={selectedChat} onBack={() => setSelectedChat(null)} />
        </div>
      </div>
    </div>
  );
};

export default Chat;
