// Pastel color palette
export const colors = {
  background: '#FDF8F5',      // Soft cream white
  card: '#FFFFFF',           // Pure white for cards
  primary: '#A8E6CF',        // Soft mint
  secondary: '#DCD0FF',      // Lavender
  tertiary: '#FFDAB9',       // Peach
  completed: '#FFB7B2',      // Blush pink
  text: '#4A4A4A',           // Soft dark gray
  textLight: '#8A8A8A',      // Light gray
  border: '#E8E0DB',         // Warm gray border
  shadow: '#00000010',       // Subtle shadow
}

// SubTask type
export interface SubTask {
  id: string
  title: string
  completed: boolean
}

// Task type
export interface Task {
  id: string
  title: string
  completed: boolean
  createdAt: number
  subTasks: SubTask[]
}

// Streak tracking
export interface Streak {
  currentStreak: number
  longestStreak: number
  lastCompletedDate: string // ISO date string YYYY-MM-DD
}

// App data structure for storage
export interface AppData {
  tasks: Task[]
  streak: Streak
}

// Generate unique ID
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2)
}

// Get today's date as ISO string (YYYY-MM-DD)
export const getTodayString = (): string => {
  return new Date().toISOString().split('T')[0]
}

// Default streak
export const defaultStreak: Streak = {
  currentStreak: 0,
  longestStreak: 0,
  lastCompletedDate: '',
}