const API_BASE = '/api';

async function request(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Something went wrong');
  }
  return response.json();
}

export const api = {
  auth: {
    login: (credentials: any) => request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
    changePassword: (newPassword: string) => request('/auth/change-password', { method: 'POST', body: JSON.stringify({ newPassword }) }),
  },
  admin: {
    getUsers: () => request('/admin/users'),
    createUser: (user: any) => request('/admin/users', { method: 'POST', body: JSON.stringify(user) }),
    getClasses: () => request('/classes'),
    createClass: (name: string) => request('/admin/classes', { method: 'POST', body: JSON.stringify({ name }) }),
  },
  content: {
    getChapters: (classId: number) => request(`/classes/${classId}/chapters`),
    createChapter: (data: any) => request('/chapters', { method: 'POST', body: JSON.stringify(data) }),
    getLessons: (chapterId: number) => request(`/chapters/${chapterId}/lessons`),
    createLesson: (data: any) => request('/lessons', { method: 'POST', body: JSON.stringify(data) }),
    getLesson: (id: number) => request(`/lessons/${id}`),
    getExercises: (lessonId: number) => request(`/lessons/${lessonId}/exercises`),
    createExercise: (data: any) => request('/exercises', { method: 'POST', body: JSON.stringify(data) }),
  },
  work: {
    submit: (data: any) => request('/submissions', { method: 'POST', body: JSON.stringify(data) }),
    grade: (data: any) => request('/grades', { method: 'POST', body: JSON.stringify(data) }),
  },
  messages: {
    get: () => request('/messages'),
    send: (data: any) => request('/messages', { method: 'POST', body: JSON.stringify(data) }),
  }
};
