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
