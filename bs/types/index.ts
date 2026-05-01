// ─── Auth / Registration ───────────────────────────────────────────────────

export type Tenant = { id: string; name: string }

export type Grade = { id: string; name: string; grade_num: number; gender?: string }

export type Class = { id: string; name: string; grade: number }

export type PendingData = {
  name: string
  phone: string
  email: string
  age: string
  gender: string
  tenantId?: string
  gradeId?: string
  classId?: string
  tenant?: string
  grade?: string
  role?: string
}

// ─── User / Profile ────────────────────────────────────────────────────────

export type UserProfile = {
  name: string
  email: string
  age: number | null
  gender: string
  current_score: number
  best_streak: number
  streak: number
  points: number
  level: number
  progress: number
  grade?: number
  tenant?: string
  className?: string
}

// ─── Leaderboard ───────────────────────────────────────────────────────────

export type LeaderboardUser = {
  id: string
  name: string
  current_score: number
  gender: string
}

export type AdminLeaderboardUser = {
  id: string
  name: string
  current_score: number
  gender: string
  grade?: number
}

export type CurrentUserRank = {
  name: string
  score: number
  rank: number
}

// ─── Reading / Dashboard ───────────────────────────────────────────────────

export type QuestionOption = {
  id: string
  option: string
}

export type Question = {
  id: string
  question: string
  score: number
  correctCount?: number
  options: QuestionOption[]
}

export type CorrectAnswer = {
  question: string
  correct_option: string
}

export type Attempt = {
  question: string
  option: string
}

export type TodayReading = {
  userId: string
  readingId: string
  book: number
  chapter: number
  fromVerse: number
  toVerse: number
  text: string[]
  bookName: string
  reference: string
  isCompleted: boolean
  readingDate: string
  questions: Question[]
  hasAttempted: boolean | null
  attempts: Attempt[]
  correctAnswers: CorrectAnswer[]
}

export type QuizResults = {
  success: boolean
  results: { questionId: string; optionId: string; isCorrect: boolean | undefined }[]
  totalScore: number
  correctAnswers: CorrectAnswer[]
}

// ─── Reading History ───────────────────────────────────────────────────────

export type ReadingHistory = {
  totalDays: number
  currentStreak: number
  longestStreak: number
  completedDays: string[]
}

// ─── Admin ─────────────────────────────────────────────────────────────────

export type AdminStats = {
  totalUsers: number
  pendingCount: number
  lastUpdated: string
}

export type AdminReading = {
  id: string
  book: number
  chapter: number
  from_verse: number
  to_verse: number
  day: string
  grade: number | { grade_num: number; gender?: string } | null
  tenant: string
}

// ─── Quiz Builder ──────────────────────────────────────────────────────────

export type QuestionOptionBuilder = {
  text: string
  isCorrect: boolean
}

export type QuestionBuilder = {
  question: string
  score: number
  options: QuestionOptionBuilder[]
}

// ─── Bible API ─────────────────────────────────────────────────────────────

export type BibleBookInfo = {
  chapters: number
  book_name?: string
}

export type BibleChapterInfo = {
  verses_count: number
}

// ─── API Payloads ──────────────────────────────────────────────────────────

export type AnswerPayload = {
  questionId: string
  optionId: string
}

export type OptionInsert = {
  text: string
  isCorrect: boolean
}

// ─── Request Detail (Admin Kids) ───────────────────────────────────────────

export type RequestDetail = {
  id: string
  status: 'pending' | 'accepted' | 'rejected' | 'transferred'
  type: 'admin' | 'kid'
  role?: string
  user: { name: string; email?: string; age: number; gender: string }
  class?: { name: string; grade: number }
  grade?: { name: string }
}
