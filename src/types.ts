export interface UserProfile {
  uid: string;
  xp: number;
  level: number;
  streak: number;
  lastActive?: string; // ISO date string
  achievements: string[];
  customCompanies?: string[];
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
  flaggedQuestions: string[]; // array of questionIds
  sessionId?: string;
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
}

export interface StudyGuide {
  id?: string;
  userId: string;
  title: string;
  category: string;
  content: string;
  createdAt: Date;
}
