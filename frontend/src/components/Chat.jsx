import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import api from '../api';
import { ArrowLeft, Send, MessageSquare, Clock, User } from 'lucide-react';

export default function Chat({ user }) {
  const { receiverId } = useParams();
  const [messages, setMessages] = useState([]);
  const [chatId, setChatId] = useState(null);
  const [receiverName, setReceiverName] = useState('User');
  const [content, setContent] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const socketRef = useRef(null);
  const messageEndRef = useRef(null);
  const navigate = useNavigate();

  // 1. Fetch initial chat history
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchChatDetails = async () => {
      setLoading(true);
      try {
        const response = await api.get(`/chat/${receiverId}`);
        setMessages(response.data.messages);
        setChatId(response.data.chatId);
        setReceiverName(response.data.receiverName);
      } catch (err) {
        console.error(err);
        setError('Failed to fetch conversation history.');
      } finally {
        setLoading(false);
      }
    };

    fetchChatDetails();
  }, [receiverId, user]);

  // 2. Connect to Socket.io server and join chat room
  useEffect(() => {
    if (!chatId) return;

    // Connect to backend socket server
    const socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000');
    socketRef.current = socket;

    // Join room
    socket.emit('joinChat', chatId);

    // Listen for incoming messages
    socket.on('message', (newMessage) => {
      setMessages((prev) => {
        if (prev.some(m => m._id === newMessage._id)) return prev;
        return [...prev, newMessage];
      });
    });

    // Cleanup on unmount
    return () => {
      socket.disconnect();
    };
  }, [chatId]);

  // 3. Auto-scroll to the bottom of message list
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!content.trim() || !chatId) return;

    const messageText = content;
    setContent('');

    try {
      await api.post('/chat/send', {
        chatId,
        content: messageText
      });
    } catch (err) {
      console.error(err);
      setError('Message could not be sent.');
    }
  };

  const formatMessageTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Helper to get initials for avatar
  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 w-full flex-grow flex flex-col h-[calc(100vh-120px)] min-h-[500px]">
      {/* Premium Chat Header */}
      <div className="flex justify-between items-center bg-white p-4 rounded-t-3xl border border-b border-green-100 shadow-sm relative z-10">
        <div className="flex items-center gap-3">
          <Link 
            to="/inbox" 
            className="text-gray-400 hover:text-green-700 p-2.5 hover:bg-green-50/50 rounded-xl transition-all"
            title="Back to Inbox"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          
          {/* Avatar Bubble */}
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-green-600 to-emerald-500 text-white flex items-center justify-center font-bold text-sm shadow-md">
            {getInitials(receiverName)}
          </div>
          
          <div>
            <h2 className="text-base font-extrabold text-green-955">{receiverName}</h2>
            <div className="text-[10px] text-green-600 font-bold flex items-center gap-1.5 mt-0.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span>Negotiation Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Message Container with sleek scrolling & background detail */}
      <div className="flex-1 bg-gradient-to-b from-green-50/20 to-white border-l border-r border-green-100 p-6 overflow-y-auto space-y-4 shadow-inner">
        {error && (
          <div className="bg-red-50 text-red-800 text-xs p-3.5 rounded-xl border border-red-100 flex items-center gap-2">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col justify-center items-center h-full text-green-700">
            <p className="mt-3 text-xs font-bold tracking-wide text-gray-500 uppercase">Connecting secure channel...</p>
          </div>
        ) : messages.length > 0 ? (
          messages.map((m, idx) => {
            const senderId = m.sender?._id || m.sender;
            const isMe = senderId === user.id;
            
            // Check if we should render the sender name tag (avoid repeating tags for consecutive messages)
            const prevMsg = idx > 0 ? messages[idx - 1] : null;
            const prevSenderId = prevMsg ? (prevMsg.sender?._id || prevMsg.sender) : null;
            const showNameTag = prevSenderId !== senderId;

            return (
              <div 
                key={m._id} 
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} ${showNameTag ? 'mt-4' : 'mt-1'}`}
              >
                {showNameTag && (
                  <span className="text-[9px] text-gray-400 font-bold mb-1 px-2.5 uppercase tracking-wider">
                    {isMe ? 'You' : m.sender?.name || receiverName}
                  </span>
                )}
                <div 
                  className={`px-4 py-3 rounded-2xl max-w-[70%] text-sm shadow-sm transition-all relative group ${
                    isMe 
                      ? 'bg-gradient-to-br from-green-600 to-emerald-600 text-white rounded-tr-none shadow-green-200/50' 
                      : 'bg-white text-gray-800 border border-green-100/70 rounded-tl-none'
                  }`}
                >
                  <p className="leading-relaxed whitespace-pre-wrap">{m.content}</p>
                  
                  {/* Timestamp overlay/tooltip */}
                  <span className={`block text-[9px] mt-1.5 text-right font-medium font-mono ${
                    isMe ? 'text-green-100' : 'text-gray-400'
                  }`}>
                    {formatMessageTime(m.createdAt)}
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <div className="bg-green-50 p-4 rounded-3xl mb-4 border border-green-100">
              <MessageSquare className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-sm font-extrabold text-green-900">Direct Negotiation Channel</p>
            <p className="text-xs text-gray-400 max-w-xs text-center mt-1 leading-relaxed">
              Negotiate price, coordinate logistics, and establish settlement parameters directly on the blockchain standard.
            </p>
          </div>
        )}
        <div ref={messageEndRef} />
      </div>

      {/* Modern input tray with floating style */}
      <form 
        onSubmit={handleSend}
        className="bg-white p-4 rounded-b-3xl border border-t border-green-100 shadow-md flex gap-3 z-10"
      >
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Type your message, coordinates or price settlement proposal..."
          className="flex-grow border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-50/50"
          required
        />
        <button
          type="submit"
          className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-5 py-3 rounded-xl transition flex items-center justify-center shadow-md hover:scale-102"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
