import React, { createContext, useContext, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { User } from './types';
import { api } from './api';
import { 
  BookOpen, 
  Users, 
  GraduationCap, 
  MessageSquare, 
  Settings, 
  LogOut, 
  LayoutDashboard,
  Plus,
  ChevronRight,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UsersPage } from './pages/UsersPage';
import { ClassesPage } from './pages/ClassesPage';
import { CoursesPage } from './pages/CoursesPage';
import { LessonPage } from './pages/LessonPage';
import { MessagesPage } from './pages/MessagesPage';

// --- Auth Context ---
interface AuthContextType {
  user: User | null;
  login: (credentials: any) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (credentials: any) => {
    const { token, user } = await api.auth.login(credentials);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setUser(user);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

// --- Components ---

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const menuItems = [
    { icon: LayoutDashboard, label: 'Tableau de bord', path: '/', roles: ['admin', 'teacher', 'student'] },
    { icon: GraduationCap, label: 'Mes Classes', path: '/classes', roles: ['admin', 'teacher'] },
    { icon: BookOpen, label: 'Cours', path: '/courses', roles: ['student'] },
    { icon: Users, label: 'Utilisateurs', path: '/users', roles: ['admin'] },
    { icon: MessageSquare, label: 'Messages', path: '/messages', roles: ['admin', 'teacher', 'student'] },
  ];

  return (
    <div className="w-64 bg-white border-r border-gray-100 h-screen flex flex-col">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-indigo-600">MadaMaths</h1>
        <p className="text-xs text-gray-400 uppercase tracking-widest mt-1">Éducation Madagascar</p>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {menuItems.filter(item => item.roles.includes(user?.role || '')).map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className="w-full flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl transition-all duration-200"
          >
            <item.icon size={20} />
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center gap-3 px-4 py-3 mb-2">
          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
            {user?.full_name[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{user?.full_name}</p>
            <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200"
        >
          <LogOut size={20} />
          <span className="font-medium">Déconnexion</span>
        </button>
      </div>
    </div>
  );
};

const LoginPage = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login({ identifier, password });
      navigate('/');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-3xl shadow-sm border border-gray-100 p-8"
      >
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Bienvenue</h2>
          <p className="text-gray-500 mt-2">Connectez-vous à MadaMaths</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Identifiant (Code élève ou Nom d'utilisateur)</label>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              placeholder="Ex: STU123 ou admin"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              placeholder="••••••••"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
          >
            Se connecter
          </button>
        </form>
      </motion.div>
    </div>
  );
};

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ classes: 0, students: 0, submissions: 0 });

  return (
    <div className="p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Bonjour, {user?.full_name} 👋</h1>
        <p className="text-gray-500 mt-1">Voici ce qui se passe aujourd'hui.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[
          { label: 'Classes Actives', value: '12', color: 'bg-blue-50 text-blue-600', icon: GraduationCap },
          { label: 'Élèves Total', value: '342', color: 'bg-green-50 text-green-600', icon: Users },
          { label: 'Soumissions', value: '89', color: 'bg-purple-50 text-purple-600', icon: CheckCircle2 },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm"
          >
            <div className={`w-12 h-12 ${stat.color} rounded-2xl flex items-center justify-center mb-4`}>
              <stat.icon size={24} />
            </div>
            <p className="text-sm font-medium text-gray-500">{stat.label}</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">Activités Récentes</h3>
            <button className="text-indigo-600 text-sm font-semibold">Voir tout</button>
          </div>
          <div className="space-y-6">
            {[1, 2, 3].map((_, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
                  <Clock size={18} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Nouvel exercice ajouté: "Théorème de Pythagore"</p>
                  <p className="text-xs text-gray-500 mt-1">Il y a 2 heures • Classe 3ème A</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">Annonces</h3>
            <button className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Plus size={20} />
            </button>
          </div>
          <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
            <p className="text-sm font-medium text-indigo-900">Rappel: Examen trimestriel de mathématiques le 15 Mars.</p>
            <p className="text-xs text-indigo-600 mt-2">Par: M. Rakoto • Hier</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const ProtectedRoute = ({ children, roles }: { children: React.ReactNode, roles?: string[] }) => {
  const { user, loading } = useAuth();
  if (loading) return <div>Chargement...</div>;
  if (!user) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" />;
  return <>{children}</>;
};

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={
            <ProtectedRoute>
              <Layout><Dashboard /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/users" element={
            <ProtectedRoute roles={['admin']}>
              <Layout><UsersPage /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/classes" element={
            <ProtectedRoute roles={['admin', 'teacher']}>
              <Layout><ClassesPage /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/courses" element={
            <ProtectedRoute roles={['admin', 'teacher', 'student']}>
              <Layout><CoursesPage /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/lessons/:id" element={
            <ProtectedRoute roles={['admin', 'teacher', 'student']}>
              <Layout><LessonPage /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/messages" element={
            <ProtectedRoute roles={['admin', 'teacher', 'student']}>
              <Layout><MessagesPage /></Layout>
            </ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
