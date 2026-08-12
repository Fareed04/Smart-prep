export interface UserProfile {
  uid: string;
  xp: number;
  level: number;
  streak: number;
  lastActive?: string; // ISO date string
  achievements: string[];
  customCompanies?: string[];
  dailyGoal?: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  requirement: (profile: UserProfile, session: QuizSession) => boolean;
}

export interface Question {
  id: string;
  question: string;
  options: string[];
  answer: string;
  explanation: string;
  category: string;
  company?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  passage?: string;
}

export interface QuestionProgress {
  correctCount: number;
  incorrectCount: number;
  lastAttemptCorrect: boolean;
  mastered: boolean;
}

export interface QuizState {
  questions: Question[];
  currentIndex: number;
  answers: Record<string, string>; // questionId -> selected option
  isFinished: boolean;
  timeRemaining: number; // in seconds
  timeSpentPerQuestion?: Record<string, number>; // questionId -> seconds
  flaggedQuestions: string[]; // array of questionIds
  sessionId?: string;
  isAdaptive?: boolean;
  isPracticeMode?: boolean;
  categoryDifficulties?: Record<string, 'easy' | 'medium' | 'hard'>; // Tracks current difficulty for each category
}

export interface QuizSession {
  id?: string;
  userId: string;
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  timeTaken: number;
  categoriesAttempted: string[];
  company?: string;
  questions?: string;
  answers?: string;
  createdAt: Date;
  isAdaptive?: boolean;
  isPracticeMode?: boolean;
  isMockAssessment?: boolean;
}

export interface StudyGuide {
  id?: string;
  userId: string;
  title: string;
  category: string;
  content: string;
  createdAt: Date;
}
