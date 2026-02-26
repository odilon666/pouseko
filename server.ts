import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { initDb } from './backend/db';
import db from './backend/db';
import { hashPassword, comparePassword, generateToken } from './backend/utils/security';
import { authenticate, authorize, AuthRequest } from './backend/middleware/auth';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize Database
  initDb();

  // --- API ROUTES ---

  // Auth Routes
  app.post('/api/auth/login', async (req, res) => {
    const { identifier, password } = req.body; // identifier can be username or student_code
    if (!identifier || !password) {
      return res.status(400).json({ error: 'Identifier and password are required' });
    }

    const user = db.prepare(`
      SELECT u.*, r.name as role
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.username = ? OR u.student_code = ?
    `).get(identifier, identifier) as any;

    if (!user || !(await comparePassword(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!user.is_active) {
      return res.status(401).json({ error: 'Account is disabled' });
    }

    const token = generateToken({ id: user.id, role: user.role });
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        student_code: user.student_code,
        full_name: user.full_name,
        role: user.role,
        must_change_password: user.must_change_password
      }
    });
  });

  app.post('/api/auth/change-password', authenticate, async (req: AuthRequest, res) => {
    const { newPassword } = req.body;
    if (!newPassword) return res.status(400).json({ error: 'New password required' });

    const hashedPassword = await hashPassword(newPassword);
    db.prepare('UPDATE users SET password = ?, must_change_password = 0 WHERE id = ?')
      .run(hashedPassword, req.user!.id);

    res.json({ message: 'Password updated successfully' });
  });

  // Admin Routes: User Management
  app.post('/api/admin/users', authenticate, authorize(['admin']), async (req, res) => {
    const { username, student_code, full_name, role, class_id, password } = req.body;
    
    try {
      const roleRow = db.prepare('SELECT id FROM roles WHERE name = ?').get(role) as any;
      if (!roleRow) return res.status(400).json({ error: 'Invalid role' });

      const hashedPassword = await hashPassword(password || 'MadaMaths2026!');
      
      const result = db.prepare(`
        INSERT INTO users (username, student_code, full_name, role_id, class_id, password, must_change_password)
        VALUES (?, ?, ?, ?, ?, ?, 1)
      `).run(username || null, student_code || null, full_name, roleRow.id, class_id || null, hashedPassword);

      res.status(201).json({ id: result.lastInsertRowid, message: 'User created successfully' });
    } catch (error: any) {
      if (error.message.includes('UNIQUE')) {
        return res.status(409).json({ error: 'Username or Student Code already exists' });
      }
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/admin/users', authenticate, authorize(['admin', 'teacher']), (req, res) => {
    const users = db.prepare(`
      SELECT u.id, u.username, u.student_code, u.full_name, r.name as role, c.name as class_name, u.is_active
      FROM users u
      JOIN roles r ON u.role_id = r.id
      LEFT JOIN classes c ON u.class_id = c.id
    `).all();
    res.json(users);
  });

  // Class Management
  app.post('/api/admin/classes', authenticate, authorize(['admin']), (req, res) => {
    const { name } = req.body;
    try {
      const result = db.prepare('INSERT INTO classes (name) VALUES (?)').run(name);
      res.status(201).json({ id: result.lastInsertRowid, name });
    } catch (error: any) {
      res.status(400).json({ error: 'Class already exists' });
    }
  });

  app.get('/api/classes', authenticate, (req, res) => {
    const classes = db.prepare('SELECT * FROM classes').all();
    res.json(classes);
  });

  // Chapter & Lesson Management
  app.post('/api/chapters', authenticate, authorize(['admin', 'teacher']), (req, res) => {
    const { title, class_id } = req.body;
    const result = db.prepare('INSERT INTO chapters (title, class_id) VALUES (?, ?)')
      .run(title, class_id);
    res.status(201).json({ id: result.lastInsertRowid, title, class_id });
  });

  app.get('/api/classes/:classId/chapters', authenticate, (req, res) => {
    const chapters = db.prepare('SELECT * FROM chapters WHERE class_id = ?').all(req.params.classId);
    res.json(chapters);
  });

  app.post('/api/lessons', authenticate, authorize(['admin', 'teacher']), (req, res) => {
    const { title, content, chapter_id } = req.body;
    const result = db.prepare('INSERT INTO lessons (title, content, chapter_id) VALUES (?, ?, ?)')
      .run(title, content, chapter_id);
    res.status(201).json({ id: result.lastInsertRowid, title, content, chapter_id });
  });

  app.get('/api/chapters/:chapterId/lessons', authenticate, (req, res) => {
    const lessons = db.prepare('SELECT id, title, chapter_id, created_at FROM lessons WHERE chapter_id = ?').all(req.params.chapterId);
    res.json(lessons);
  });

  app.get('/api/lessons/:id', authenticate, (req, res) => {
    const lesson = db.prepare('SELECT * FROM lessons WHERE id = ?').get(req.params.id);
    if (!lesson) return res.status(404).json({ error: 'Lesson not found' });
    res.json(lesson);
  });

  // Exercises & Submissions
  app.post('/api/exercises', authenticate, authorize(['admin', 'teacher']), (req, res) => {
    const { title, description, lesson_id, deadline, max_score } = req.body;
    const result = db.prepare(`
      INSERT INTO exercises (title, description, lesson_id, deadline, max_score)
      VALUES (?, ?, ?, ?, ?)
    `).run(title, description, lesson_id, deadline, max_score);
    res.status(201).json({ id: result.lastInsertRowid });
  });

  app.get('/api/lessons/:lessonId/exercises', authenticate, (req, res) => {
    const exercises = db.prepare('SELECT * FROM exercises WHERE lesson_id = ?').all(req.params.lessonId);
    res.json(exercises);
  });

  app.post('/api/submissions', authenticate, authorize(['student']), (req: AuthRequest, res) => {
    const { exercise_id, content } = req.body;
    
    // Check deadline
    const exercise = db.prepare('SELECT deadline FROM exercises WHERE id = ?').get(exercise_id) as any;
    if (!exercise) return res.status(404).json({ error: 'Exercise not found' });
    if (new Date() > new Date(exercise.deadline)) {
      return res.status(400).json({ error: 'Deadline passed' });
    }

    try {
      const result = db.prepare(`
        INSERT INTO submissions (exercise_id, student_id, content)
        VALUES (?, ?, ?)
      `).run(exercise_id, req.user!.id, content);
      res.status(201).json({ id: result.lastInsertRowid });
    } catch (error) {
      res.status(409).json({ error: 'Already submitted' });
    }
  });

  // Grades
  app.post('/api/grades', authenticate, authorize(['admin', 'teacher']), (req: AuthRequest, res) => {
    const { submission_id, score, feedback } = req.body;
    
    const submission = db.prepare(`
      SELECT s.*, e.max_score 
      FROM submissions s 
      JOIN exercises e ON s.exercise_id = e.id 
      WHERE s.id = ?
    `).get(submission_id) as any;

    if (!submission) return res.status(404).json({ error: 'Submission not found' });
    if (score > submission.max_score) return res.status(400).json({ error: 'Score exceeds max score' });

    const result = db.prepare(`
      INSERT INTO grades (submission_id, score, feedback, teacher_id)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(submission_id) DO UPDATE SET score=excluded.score, feedback=excluded.feedback
    `).run(submission_id, score, feedback, req.user!.id);

    res.json({ message: 'Grade saved' });
  });

  // Messages
  app.post('/api/messages', authenticate, (req: AuthRequest, res) => {
    const { receiver_id, content } = req.body;
    const result = db.prepare('INSERT INTO messages (sender_id, receiver_id, content) VALUES (?, ?, ?)')
      .run(req.user!.id, receiver_id, content);
    res.status(201).json({ id: result.lastInsertRowid });
  });

  app.get('/api/messages', authenticate, (req: AuthRequest, res) => {
    const messages = db.prepare(`
      SELECT m.*, u.full_name as sender_name
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.receiver_id = ? OR m.sender_id = ?
      ORDER BY m.created_at DESC
    `).all(req.user!.id, req.user!.id);
    res.json(messages);
  });

  // --- VITE MIDDLEWARE ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  // Initial Admin Creation
  const adminExists = db.prepare('SELECT id FROM users WHERE username = ?').get('admin');
  if (!adminExists) {
    const adminRole = db.prepare('SELECT id FROM roles WHERE name = ?').get('admin') as any;
    const hashedPassword = await hashPassword('admin123');
    db.prepare(`
      INSERT INTO users (username, full_name, password, role_id, must_change_password)
      VALUES (?, ?, ?, ?, 0)
    `).run('admin', 'Administrateur Principal', hashedPassword, adminRole.id);
    console.log('Initial admin created: admin / admin123');
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
