import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { User, Class } from '../types';
import { Plus, Search, UserPlus, Shield, GraduationCap } from 'lucide-react';
import { motion } from 'motion/react';

export const UsersPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    username: '',
    student_code: '',
    role: 'student',
    class_id: '',
    password: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [usersData, classesData] = await Promise.all([
        api.admin.getUsers(),
        api.admin.getClasses()
      ]);
      setUsers(usersData);
      setClasses(classesData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.admin.createUser(formData);
      setShowModal(false);
      loadData();
      setFormData({ full_name: '', username: '', student_code: '', role: 'student', class_id: '', password: '' });
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="p-8">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Utilisateurs</h1>
          <p className="text-gray-500 mt-1">Gérez les élèves, enseignants et administrateurs.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
        >
          <UserPlus size={20} />
          Ajouter un utilisateur
        </button>
      </header>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-50 bg-gray-50/50 flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Rechercher un utilisateur..." 
              className="w-full pl-12 pr-4 py-2 rounded-xl border-none bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
            />
          </div>
        </div>

        <table className="w-full text-left">
          <thead>
            <tr className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-50">
              <th className="px-6 py-4">Nom Complet</th>
              <th className="px-6 py-4">Rôle</th>
              <th className="px-6 py-4">Identifiant</th>
              <th className="px-6 py-4">Classe</th>
              <th className="px-6 py-4">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                      {user.full_name[0]}
                    </div>
                    <span className="font-semibold text-gray-900">{user.full_name}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    user.role === 'admin' ? 'bg-red-50 text-red-600' : 
                    user.role === 'teacher' ? 'bg-blue-50 text-blue-600' : 
                    'bg-green-50 text-green-600'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600 font-mono">
                  {user.username || user.student_code}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {user.class_name || '-'}
                </td>
                <td className="px-6 py-4">
                  <span className={`w-2 h-2 rounded-full inline-block mr-2 ${user.is_active ? 'bg-green-500' : 'bg-red-500'}`}></span>
                  <span className="text-sm text-gray-600">{user.is_active ? 'Actif' : 'Désactivé'}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl"
          >
            <h2 className="text-2xl font-bold mb-6">Nouvel Utilisateur</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Nom Complet</label>
                <input 
                  type="text" 
                  required
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-indigo-500"
                  value={formData.full_name}
                  onChange={e => setFormData({...formData, full_name: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Rôle</label>
                  <select 
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-indigo-500"
                    value={formData.role}
                    onChange={e => setFormData({...formData, role: e.target.value})}
                  >
                    <option value="student">Élève</option>
                    <option value="teacher">Enseignant</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                {formData.role === 'student' ? (
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Code Élève</label>
                    <input 
                      type="text" 
                      placeholder="Ex: STU001"
                      className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-indigo-500"
                      value={formData.student_code}
                      onChange={e => setFormData({...formData, student_code: e.target.value})}
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Nom d'utilisateur</label>
                    <input 
                      type="text" 
                      className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-indigo-500"
                      value={formData.username}
                      onChange={e => setFormData({...formData, username: e.target.value})}
                    />
                  </div>
                )}
              </div>
              {formData.role === 'student' && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Classe</label>
                  <select 
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-indigo-500"
                    value={formData.class_id}
                    onChange={e => setFormData({...formData, class_id: e.target.value})}
                  >
                    <option value="">Sélectionner une classe</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Mot de passe temporaire</label>
                <input 
                  type="password" 
                  placeholder="Laisser vide pour défaut"
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-indigo-500"
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                />
              </div>
              <div className="flex gap-4 mt-8">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-all"
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-3 rounded-xl font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                >
                  Créer
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};
