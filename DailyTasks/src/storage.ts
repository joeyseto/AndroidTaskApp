import AsyncStorage from '@react-native-async-storage/async-storage'
import { Task, Streak, AppData, defaultStreak, getTodayString } from './types'

const TASKS_KEY = '@daily_tasks_v3'

// Default app data
const defaultData: AppData = {
  tasks: [],
  streak: defaultStreak,
}

export const Storage = {
  // Load all app data
  async load(): Promise<AppData> {
    try {
      const data = await AsyncStorage.getItem(TASKS_KEY)
      if (data) {
        const parsed = JSON.parse(data)
        // Ensure streak exists
        return {
          tasks: parsed.tasks || [],
          streak: parsed.streak || defaultStreak,
        }
      }
      return defaultData
    } catch (error) {
      console.error('Failed to load data:', error)
      return defaultData
    }
  },

  // Save all app data
  async save(data: AppData): Promise<void> {
    try {
      await AsyncStorage.setItem(TASKS_KEY, JSON.stringify(data))
    } catch (error) {
      console.error('Failed to save data:', error)
    }
  },

  // Update streak when task is completed
  updateStreakOnComplete(streak: Streak): Streak {
    const today = getTodayString()
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

    // Already completed today
    if (streak.lastCompletedDate === today) {
      return streak
    }

    let newStreak: Streak

    if (streak.lastCompletedDate === yesterday) {
      // Consecutive day - increment streak
      newStreak = {
        currentStreak: streak.currentStreak + 1,
        longestStreak: Math.max(streak.longestStreak, streak.currentStreak + 1),
        lastCompletedDate: today,
      }
    } else if (streak.lastCompletedDate === '') {
      // First ever completion
      newStreak = {
        currentStreak: 1,
        longestStreak: 1,
        lastCompletedDate: today,
      }
    } else {
      // Streak broken - start fresh
      newStreak = {
        currentStreak: 1,
        longestStreak: streak.longestStreak, // Keep longest
        lastCompletedDate: today,
      }
    }

    return newStreak
  },

  // Check if streak should be reset (missed a day)
  checkStreakReset(streak: Streak): Streak {
    const today = getTodayString()
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

    // No streak to check
    if (streak.lastCompletedDate === '') {
      return streak
    }

    // Completed today or yesterday - streak is valid
    if (streak.lastCompletedDate === today || streak.lastCompletedDate === yesterday) {
      return streak
    }

    // Missed days - reset current streak but keep longest
    return {
      ...streak,
      currentStreak: 0,
    }
  },
}