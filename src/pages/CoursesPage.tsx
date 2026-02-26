import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { Chapter, Lesson, Class } from '../types';
import { BookOpen, Plus, ChevronRight, FileText, PlayCircle } from 'lucide-react';
import { motion } from 'motion/react';

export const CoursesPage = () => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [lessons, setLessons] = useState<Record<number, Lesson[]>>({});
  const [showChapterModal, setShowChapterModal] = useState(false);
  const [newChapterTitle, setNewChapterTitle] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    const data = await api.admin.getClasses();
    setClasses(data);
    if (data.length > 0) handleClassSelect(data[0]);
  };

  const handleClassSelect = async (cls: Class) => {
    setSelectedClass(cls);
    const chaptersData = await api.content.getChapters(cls.id);
    setChapters(chaptersData);
    
    // Load lessons for each chapter
    const lessonsMap: Record<number, Lesson[]> = {};
    for (const chapter of chaptersData) {
      const lessonsData = await api.content.getLessons(chapter.id);
      lessonsMap[chapter.id] = lessonsData;
    }
    setLessons(lessonsMap);
  };

  const handleAddChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass) return;
    await api.content.createChapter({ title: newChapterTitle, class_id: selectedClass.id });
    setShowChapterModal(false);
    setNewChapterTitle('');
    handleClassSelect(selectedClass);
  };

  return (
    <div className="p-8">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Cours & Chapitres</h1>
          <p className="text-gray-500 mt-1">Explorez le programme de mathématiques.</p>
        </div>
        <div className="flex gap-4">
          <select 
            className="px-4 py-2 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-semibold"
            onChange={(e) => {
              const cls = classes.find(c => c.id === parseInt(e.target.value));
              if (cls) handleClassSelect(cls);
            }}
            value={selectedClass?.id || ''}
          >
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button 
            onClick={() => setShowChapterModal(true)}
            className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
          >
            <Plus size={20} />
            Nouveau Chapitre
          </button>
        </div>
      </header>

      <div className="space-y-8">
        {chapters.map((chapter, i) => (
          <motion.section 
            key={chapter.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                <span className="w-8 h-8 bg-indigo-600 text-white rounded-lg flex items-center justify-center text-sm">
                  {i + 1}
                </span>
                {chapter.title}
              </h2>
              <button 
                onClick={() => navigate(`/lessons/new?chapterId=${chapter.id}`)}
                className="text-indigo-600 text-sm font-bold flex items-center gap-1 hover:underline"
              >
                <Plus size={16} />
                Ajouter une leçon
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {lessons[chapter.id]?.map((lesson) => (
                <div 
                  key={lesson.id}
                  onClick={() => navigate(`/lessons/${lesson.id}`)}
                  className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:border-indigo-200 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gray-50 text-gray-400 rounded-xl flex items-center justify-center group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                      <FileText size={20} />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{lesson.title}</h4>
                      <p className="text-xs text-gray-400 mt-0.5">Cliquez pour lire</p>
                    </div>
                    <ChevronRight size={16} className="text-gray-300 group-hover:text-indigo-600" />
                  </div>
                </div>
              ))}
              {(!lessons[chapter.id] || lessons[chapter.id].length === 0) && (
                <div className="col-span-full py-8 border-2 border-dashed border-gray-100 rounded-3xl flex flex-col items-center justify-center text-gray-400">
                  <BookOpen size={32} className="mb-2 opacity-20" />
                  <p className="text-sm">Aucune leçon dans ce chapitre.</p>
                </div>
              )}
            </div>
          </motion.section>
        ))}
      </div>

      {showChapterModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl"
          >
            <h2 className="text-2xl font-bold mb-6">Nouveau Chapitre</h2>
            <form onSubmit={handleAddChapter} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Titre du chapitre</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ex: Nombres et Calculs, Géométrie..."
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 outline-none focus:ring-2 focus:ring-indigo-500"
                  value={newChapterTitle}
                  onChange={e => setNewChapterTitle(e.target.value)}
                />
              </div>
              <div className="flex gap-4 mt-8">
                <button 
                  type="button"
                  onClick={() => setShowChapterModal(false)}
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
