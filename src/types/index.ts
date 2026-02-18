// Tipos principales del sistema

export interface User {
  id: string
  name?: string
  email: string
  emailVerified?: Date
  image?: string
}

export interface UserProgress {
  id: string
  userId: string
  totalPoints: number
  currentLevel: number
  totalXP: number
  currentStreak: number
  maxStreak: number
  worldsCompleted: number
  challengesSolved: number
}

export interface World {
  id: string
  order: number
  name: string
  description: string
  color: string
  icon: string
  requiredLevel: number
  requiredXP: number
  totalLevels: number
  totalChallenges: number
}

export interface Level {
  id: string
  worldId: string
  order: number
  name: string
  description: string
  totalChallenges: number
  pointsPerChallenge: number
  xpPerChallenge: number
  concepts: string[]
  difficulty: 'beginner' | 'intermediate' | 'advanced'
}

export interface Challenge {
  id: string
  levelId: string
  order: number
  title: string
  description: string
  instruction: string
  type: 'code' | 'quiz' | 'drag-drop'
  initialCode?: string
  expectedSolution?: string
  testCase?: any
  quizOptions?: string[]
  correctAnswer?: string
  points: number
  xp: number
  isRequired: boolean
}

export interface Badge {
  id: string
  name: string
  description: string
  icon: string
  color: string
  type: string
  criteria?: any
}
