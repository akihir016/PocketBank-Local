import React, { useState, useRef, useEffect } from 'react';
import { X, Send, User, Sparkles, Users, LogOut } from 'lucide-react';
import { io, Socket } from 'socket.io-client';

interface AdvisorChatProps {
  onClose: () => void;
}

interface Message {
  id: string;
  text: string;
  sender: string;
}

const AdvisorChat: React.FC<AdvisorChatProps> = ({ onClose }) => {
  const [name, setName] = useState('');
  const [isNameSet, setIsNameSet] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [activeUsers, setActiveUsers] = useState<string[]>([]);
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize socket connection
    socketRef.current = io('http://localhost:3001');

    // Attempt to retrieve and set name from localStorage
    const savedName = localStorage.getItem('username');
    if (savedName) {
      setName(savedName);
      setIsNameSet(true);
    }

    // Setup socket event listeners
    socketRef.current.on('connect', () => {
      console.log('Connected to server!');
      // If a name is saved, automatically set it on the server
      const currentName = localStorage.getItem('username');
      if (currentName) {
        socketRef.current?.emit('set_name', currentName, () => {});
      }
    });

    socketRef.current.on('users', (users: string[]) => {
      setActiveUsers(users);
    });

    socketRef.current.on('chat_message', (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
    });

    // Cleanup on component unmount
    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSetName = () => {
    if (name.trim() && socketRef.current) {
      const newName = name.trim();
      localStorage.setItem('username', newName);
      socketRef.current.emit('set_name', newName, (response: { success: boolean }) => {
        if (response.success) {
          setIsNameSet(true);
        }
      });
    }
  };
  
  const handleRelog = () => {
    if (socketRef.current) {
        socketRef.current.disconnect();
    }
    localStorage.removeItem('username');
    setIsNameSet(false);
    setName('');
    setMessages([]);
    setActiveUsers([]);

    // Reconnect after a short delay
    setTimeout(() => {
        socketRef.current = io('http://localhost:3001');
        socketRef.current.on('connect', () => {
            console.log('Reconnected to server!');
        });
        socketRef.current.on('users', (users: string[]) => {
            setActiveUsers(users);
        });
        socketRef.current.on('chat_message', (msg: Message) => {
            setMessages((prev) => [...prev, msg]);
        });
    }, 100);
  };

  const handleSend = () => {
    if (inputText.trim() && socketRef.current) {
      socketRef.current.emit('chat_message', inputText);
      setInputText('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  
  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSetName();
    }
  };

  if (!isNameSet) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl relative">
          <button onClick={onClose} className="absolute top-2 right-2 p-2 rounded-full hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
          <h2 className="text-xl sm:text-2xl font-bold text-center mb-4">Enter Your Name</h2>
          <div className="space-y-4">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleNameKeyDown}
              placeholder="Your name..."
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none bg-gray-50 text-center"
              autoFocus
            />
            <button
              onClick={handleSetName}
              disabled={!name.trim()}
              className="w-full mt-4 p-3 rounded-lg bg-brand-600 text-white font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed transition-all active:scale-95"
            >
              Set Name and Join Chat
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md h-[90vh] sm:h-[600px] rounded-t-2xl sm:rounded-2xl flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 duration-300">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-brand-600 to-brand-500 text-white">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5" />
            <div>
              <h3 className="font-bold text-sm">Group Chat</h3>
              <div className="flex items-center gap-1.5 text-xs opacity-80">
                <Users className="w-3 h-3"/>
                {activeUsers.length} active
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleRelog} className="p-2 rounded-full hover:bg-white/20 transition-colors" title="Change Name">
              <LogOut className="w-5 h-5" />
            </button>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-white/20 transition-colors" title="Close Chat">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.sender === name ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {msg.sender !== 'System' && (
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                  ${msg.sender === name ? 'bg-brand-100 text-brand-600' : 'bg-white border border-gray-200 text-gray-600'}
                `}>
                  <User className="w-5 h-5" />
                </div>
              )}
              <div className={`
                max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed
                ${msg.sender === name
                  ? 'bg-brand-600 text-white rounded-tr-none'
                  : msg.sender === 'System'
                    ? 'bg-transparent text-gray-500 text-center w-full max-w-full text-xs'
                    : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none shadow-sm'
                }
              `}>
                {msg.sender !== 'System' && msg.sender !== name && <p className="font-bold text-xs pb-1 text-brand-600">{msg.sender}</p>}
                {msg.text}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 bg-white border-t border-gray-100">
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-full px-4 py-2 focus-within:ring-2 focus-within:ring-brand-500 focus-within:border-transparent transition-shadow">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              className="flex-1 bg-transparent outline-none text-gray-700 placeholder-gray-400"
            />
            <button
              onClick={handleSend}
              disabled={!inputText.trim()}
              className="p-2 rounded-full bg-brand-600 text-white disabled:bg-gray-300 transition-all active:scale-95"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvisorChat;