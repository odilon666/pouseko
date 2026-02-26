import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { Lesson, Exercise, Submission } from '../types';
import { ChevronLeft, Send, CheckCircle2, Clock, AlertCircle, Plus } from 'lucide-react';
import { motion } from 'motion/react';

export const LessonPage = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const chapterId = searchParams.get('chapterId');
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ title: '', content: '' });
  const navigate = useNavigate();

  useEffect(() => {
    if (id === 'new') {
      setIsEditing(true);
      setLoading(false);
    } else {
      loadLesson();
    }
  }, [id]);

  const loadLesson = async () => {
    try {
      const lessonData = await api.content.getLesson(parseInt(id!));
      setLesson(lessonData);
      setEditData({ title: lessonData.title, content: lessonData.content });
      const exercisesData = await api.content.getExercises(parseInt(id!));
      setExercises(exercisesData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (id === 'new') {
      await api.content.createLesson({ ...editData, chapter_id: parseInt(chapterId!) });
      navigate('/courses');
    } else {
      // Update logic here if needed
      setIsEditing(false);
    }
  };

  if (loading) return <div className="p-8">Chargement...</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <button 
        onClick={() => navigate('/courses')}
        className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 mb-8 transition-colors font-semibold"
      >
        <ChevronLeft size={20} />
        Retour aux cours
      </button>

      {isEditing ? (
        <div className="space-y-6 bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900">Nouvelle Leçon</h2>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Titre de la leçon</label>
            <input 
              type="text" 
              className="w-full px-4 py-3 rounded-2xl border border-gray-200 outline-none focus:ring-2 focus:ring-indigo-500"
              value={editData.title}
              onChange={e => setEditData({...editData, title: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Contenu (Texte ou Markdown)</label>
            <textarea 
              rows={12}
              className="w-full px-4 py-3 rounded-2xl border border-gray-200 outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
              value={editData.content}
              onChange={e => setEditData({...editData, content: e.target.value})}
            />
          </div>
          <div className="flex gap-4">
            <button 
              onClick={() => navigate('/courses')}
              className="flex-1 px-4 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100"
            >
              Annuler
            </button>
            <button 
              onClick={handleSave}
              className="flex-1 px-4 py-3 rounded-xl font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-100"
            >
              Enregistrer
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-12">
          <article className="bg-white p-10 rounded-3xl border border-gray-100 shadow-sm">
            <h1 className="text-4xl font-bold text-gray-900 mb-8">{lesson?.title}</h1>
            <div className="prose prose-indigo max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap">
              {lesson?.content}
            </div>
          </article>

          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Exercices</h2>
              <button className="p-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-colors">
                <Plus size={20} />
              </button>
            </div>

            <div className="space-y-4">
              {exercises.map((ex) => (
                <div key={ex.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between group hover:border-indigo-200 transition-all">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                      <CheckCircle2 size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">{ex.title}</h4>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Clock size={12} />
                          Deadline: {new Date(ex.deadline).toLocaleDateString('fr-FR')}
                        </span>
                        <span className="text-xs text-indigo-600 font-bold">
                          Max: {ex.max_score} pts
                        </span>
                      </div>
                    </div>
                  </div>
                  <button className="px-6 py-2 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 transition-all">
                    Faire l'exercice
                  </button>
                </div>
              ))}
              {exercises.length === 0 && (
                <div className="p-12 text-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-100 text-gray-400">
                  <AlertCircle size={32} className="mx-auto mb-2 opacity-20" />
                  <p>Aucun exercice pour cette leçon.</p>
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
};
