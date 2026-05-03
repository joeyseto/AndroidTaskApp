import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  SafeAreaView,
  Platform,
  Animated,
  Keyboard,
} from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { SwipeableTask } from './src/components/SwipeableTask'
import { AddTaskInput } from './src/components/AddTaskInput'
import { ConfettiOverlay } from './src/components/ConfettiOverlay'
import { NiceOverlay } from './src/components/NiceOverlay'
import { Task, colors, generateId, Streak } from './src/types'
import { Storage } from './src/storage'
import { Sound } from './src/sound'

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [streak, setStreak] = useState<Streak>({ currentStreak: 0, longestStreak: 0, lastCompletedDate: '' })
  const [loading, setLoading] = useState(true)
  const [showConfetti, setShowConfetti] = useState(false)
  const [showNice, setShowNice] = useState(false)
  const celebrationOpacity = useRef(new Animated.Value(0)).current
  const insets = useSafeAreaInsets()

  useEffect(() => {
    const loadData = async () => {
      const data = await Storage.load()
      const checkedStreak = Storage.checkStreakReset(data.streak)
      setTasks(data.tasks)
      setStreak(checkedStreak)
      setLoading(false)
    }
    loadData()
    Sound.init()
  }, [])

  useEffect(() => {
    if (!loading) {
      Storage.save({ tasks, streak })
    }
  }, [tasks, streak, loading])

  const triggerCelebration = useCallback(() => {
    Sound.playSuccess()
    setShowConfetti(true)
    Animated.sequence([
      Animated.timing(celebrationOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(1500),
      Animated.timing(celebrationOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => setShowConfetti(false))
  }, [celebrationOpacity])

  const handleAddTask = useCallback((task: Task) => {
    setTasks(prev => [...prev, task])
  }, [])

  const handleToggleTask = useCallback((id: string) => {
    setTasks(prev => {
      const updated = prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t)
      const task = updated.find(t => t.id === id)
      if (task?.completed) {
        const newStreak = Storage.updateStreakOnComplete(streak)
        setStreak(newStreak)
        const allComplete = updated.every(t => t.completed)
        if (allComplete) triggerCelebration()
        else Sound.playComplete()
      }
      return updated
    })
  }, [streak, triggerCelebration])

  const handleToggleSubTask = useCallback((taskId: string, subTaskId: string) => {
    setTasks(prev =>
      prev.map(task => {
        if (task.id !== taskId) return task
        const subTask = task.subTasks.find(st => st.id === subTaskId)
        const wasCompleted = subTask?.completed ?? false
        return {
          ...task,
          subTasks: task.subTasks.map(st =>
            st.id === subTaskId ? { ...st, completed: !st.completed } : st
          ),
        }
      })
    )
    Sound.playSubTask()
  }, [])

  const handleAddSubTask = useCallback((taskId: string, title: string) => {
    setTasks(prev =>
      prev.map(task => {
        if (task.id !== taskId) return task
        return {
          ...task,
          subTasks: [...task.subTasks, { id: generateId(), title, completed: false }],
        }
      })
    )
  }, [])

  const handleDeleteTask = useCallback((id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id))
  }, [])

  const completedCount = tasks.filter(t => t.completed).length
  const inProgressCount = tasks.filter(t => !t.completed).length

  const getGreeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <GestureHandlerRootView style={styles.gestureRoot}>
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />

        {/* Header - outside FlatList so it doesn't scroll */}
        <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
          <Text style={styles.greeting}>{getGreeting()}</Text>
          <Text style={styles.title}>Dopamine Hit</Text>

          {streak.currentStreak > 0 && (
            <View style={styles.streakContainer}>
              <Text style={styles.streakEmoji}>🔥</Text>
              <Text style={styles.streakText}>{streak.currentStreak} day streak!</Text>
            </View>
          )}

          <View style={styles.statsRow}>
            <View style={[styles.statBadge, styles.inProgressBadge]}>
              <Text style={styles.statNumber}>{inProgressCount}</Text>
              <Text style={styles.statLabel}>in progress</Text>
            </View>
            <View style={[styles.statBadge, styles.completedBadge]}>
              <Text style={styles.statNumber}>{completedCount}</Text>
              <Text style={styles.statLabel}>done</Text>
            </View>
          </View>
        </View>

        {/* Task list - takes remaining space */}
        <FlatList
          data={tasks}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <SwipeableTask
              task={item}
              onToggle={handleToggleTask}
              onDelete={handleDeleteTask}
              onToggleSubTask={handleToggleSubTask}
              onAddSubTask={handleAddSubTask}
              onSubTaskComplete={() => setShowNice(true)}
              onTaskComplete={Sound.playComplete}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>✨</Text>
              <Text style={styles.emptyText}>Nothing here yet</Text>
              <Text style={styles.emptySubtext}>Add your first task below!</Text>
            </View>
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        />

        {/* Add task input - pinned to bottom */}
        <View style={[styles.inputContainer, { paddingBottom: insets.bottom + 16 }]}>
          <AddTaskInput onAdd={handleAddTask} />
        </View>

        {/* Overlays */}
        <NiceOverlay
          visible={showNice}
          onAnimationComplete={() => setShowNice(false)}
        />
        {showConfetti && <ConfettiOverlay visible={true} />}
        <Animated.View style={[styles.celebration, { opacity: celebrationOpacity }]} pointerEvents="none">
          <Text style={styles.celebrationEmoji}>🎉</Text>
          <Text style={styles.celebrationText}>Amazing!</Text>
          <Text style={styles.celebrationSubtext}>All tasks complete!</Text>
        </Animated.View>
      </SafeAreaView>
    </GestureHandlerRootView>
  )
}

const styles = StyleSheet.create({
  gestureRoot: { flex: 1 },
  container: { flex: 1, backgroundColor: colors.background },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { fontSize: 16, color: colors.textLight },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  greeting: { fontSize: 14, color: colors.textLight, marginBottom: 4 },
  title: { fontSize: 26, fontWeight: 'bold', color: colors.text, marginBottom: 12 },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 12,
    gap: 6,
  },
  streakEmoji: { fontSize: 18 },
  streakText: { fontSize: 14, fontWeight: '600', color: '#E65100' },
  statsRow: { flexDirection: 'row', gap: 10 },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  inProgressBadge: { backgroundColor: colors.secondary },
  completedBadge: { backgroundColor: colors.completed },
  statNumber: { fontSize: 14, fontWeight: 'bold', color: colors.card },
  statLabel: { fontSize: 12, color: colors.card, opacity: 0.9 },
  listContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 16,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 100,
  },
  emptyEmoji: { fontSize: 64, marginBottom: 16 },
  emptyText: { fontSize: 20, fontWeight: '600', color: colors.text, marginBottom: 8 },
  emptySubtext: { fontSize: 16, color: colors.textLight },
  inputContainer: {
    paddingHorizontal: 24,
    paddingTop: 8,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  celebration: {
    position: 'absolute',
    top: '35%',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  celebrationEmoji: { fontSize: 80, marginBottom: 12 },
  celebrationText: { fontSize: 28, fontWeight: 'bold', color: colors.text },
  celebrationSubtext: { fontSize: 18, color: colors.textLight, marginTop: 4 },
})