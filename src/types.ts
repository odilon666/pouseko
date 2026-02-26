export type Role = 'admin' | 'teacher' | 'student';

export interface User {
  id: number;
  username?: string;
  student_code?: string;
  full_name: string;
  role: Role;
  class_id?: number;
  class_name?: string;
  must_change_password: boolean;
  is_active: boolean;
}

export interface Class {
  id: number;
  name: string;
  created_at: string;
}

export interface Chapter {
  id: number;
  title: string;
  class_id: number;
}

export interface Lesson {
  id: number;
  title: string;
  content: string;
  chapter_id: number;
}

export interface Exercise {
  id: number;
  title: string;
  description: string;
  lesson_id: number;
  deadline: string;
  max_score: number;
}

export interface Submission {
  id: number;
  exercise_id: number;
  student_id: number;
  content: string;
  submitted_at: string;
  score?: number;
  feedback?: string;
}
