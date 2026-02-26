import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { User } from '../types';
import { Send, User as UserIcon, MessageSquare, Clock } from 'lucide-react';
import { motion } from 'motion/react';

export const MessagesPage = () => {
  const [messages, setMessages] = useState<any[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [msgs, usersData] = await Promise.all([
        api.messages.get(),
        api.admin.getUsers()
      ]);
      setMessages(msgs);
      setUsers(usersData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !content.trim()) return;
    try {
      await api.messages.send({ receiver_id: selectedUser.id, content });
      setContent('');
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filteredMessages = messages.filter(m => 
    (selectedUser && (m.sender_id === selectedUser.id || m.receiver_id === selectedUser.id))
  );

  return (
    <div className="flex h-full bg-white">
      {/* Sidebar: User List */}
      <div className="w-80 border-r border-gray-100 flex flex-col">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Messages</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {users.map((u) => (
            <button
              key={u.id}
              onClick={() => setSelectedUser(u)}
              className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all ${
                selectedUser?.id === u.id ? 'bg-indigo-50 text-indigo-600' : 'hover:bg-gray-50 text-gray-600'
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center font-bold text-sm">
                {u.full_name[0]}
              </div>
              <div className="text-left flex-1 min-w-0">
                <p className="font-bold text-sm truncate">{u.full_name}</p>
                <p className="text-xs opacity-60 capitalize">{u.role}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-gray-50/30">
        {selectedUser ? (
          <>
            <div className="p-6 bg-white border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                  {selectedUser.full_name[0]}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{selectedUser.full_name}</h3>
                  <p className="text-xs text-green-500 font-medium">En ligne</p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-6">
              {filteredMessages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                  <MessageSquare size={48} className="mb-4 opacity-10" />
                  <p>Aucun message. Commencez la conversation !</p>
                </div>
              )}
              {filteredMessages.map((m, i) => (
                <div 
                  key={m.id} 
                  className={`flex ${m.sender_id === selectedUser.id ? 'justify-start' : 'justify-end'}`}
                >
                  <div className={`max-w-md p-4 rounded-2xl shadow-sm ${
                    m.sender_id === selectedUser.id 
                      ? 'bg-white text-gray-800 rounded-tl-none' 
                      : 'bg-indigo-600 text-white rounded-tr-none'
                  }`}>
                    <p className="text-sm leading-relaxed">{m.content}</p>
                    <p className={`text-[10px] mt-2 flex items-center gap-1 ${
                      m.sender_id === selectedUser.id ? 'text-gray-400' : 'text-indigo-200'
                    }`}>
                      <Clock size={10} />
                      {new Date(m.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-6 bg-white border-t border-gray-100">
              <form onSubmit={handleSend} className="flex gap-4">
                <input 
                  type="text" 
                  placeholder="Écrivez votre message..."
                  className="flex-1 px-6 py-3 rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={content}
                  onChange={e => setContent(e.target.value)}
                />
                <button 
                  type="submit"
                  className="p-4 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                >
                  <Send size={20} />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-gray-400">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <MessageSquare size={40} className="opacity-20" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Vos Messages</h3>
            <p>Sélectionnez un contact pour commencer à discuter.</p>
          </div>
        )}
      </div>
    </div>
  );
};
