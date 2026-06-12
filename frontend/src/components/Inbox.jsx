import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import { MessageSquare, ArrowRight, User } from 'lucide-react';

export default function Inbox({ user }) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchConversations = async () => {
      try {
        const response = await api.get('/chat/conversations');
        setConversations(response.data);
      } catch (err) {
        console.error(err);
        setError('Failed to fetch conversation list.');
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, [user]);

  return (
    <div className="max-w-4xl mx-auto py-12 px-6 w-full flex-grow">
      <div className="bg-white rounded-3xl shadow-xl p-8 border border-green-50">
        <h1 className="text-3xl font-extrabold text-green-955 mb-6 flex items-center gap-2">
          📥 Messages Inbox
        </h1>
        <p className="text-sm text-gray-500 mb-6 -mt-3">
          Manage discussions, price settlements, and delivery coordinate agreements.
        </p>

        {error && (
          <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4 rounded-xl text-red-800 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col justify-center items-center h-48 text-green-700">
            <span className="text-4xl animate-spin">🔄</span>
            <p className="mt-4 font-semibold">Retrieving inbox list...</p>
          </div>
        ) : conversations.length > 0 ? (
          <ul className="divide-y divide-gray-100">
            {conversations.map((conv) => (
              <li 
                key={conv.chatId} 
                className="flex items-center justify-between py-5 hover:bg-green-50/50 px-4 rounded-2xl transition duration-150"
              >
                <div className="flex items-center gap-4">
                  <div className="bg-green-100 text-green-800 font-bold rounded-full w-12 h-12 flex items-center justify-center text-lg border border-green-200">
                    <User className="w-5 h-5 text-green-700" />
                  </div>
                  <div>
                    <p className="text-base font-bold text-gray-800">
                      {conv.otherUser?.name || 'User'}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5 capitalize">
                      Role: {conv.otherUser?.role}
                    </p>
                  </div>
                </div>
                
                <Link 
                  to={`/chat/${conv.otherUser?._id}`}
                  className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs transition flex items-center gap-1.5 shadow-sm"
                >
                  Open Conversation <ArrowRight className="w-4 h-4" />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center py-16">
            <div className="bg-gray-100 text-gray-400 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-6 h-6" />
            </div>
            <p className="text-gray-500 font-semibold">No messages yet.</p>
            <p className="text-xs text-gray-400 mt-1">Start browsing products to initiate contact.</p>
          </div>
        )}
      </div>
    </div>
  );
}
