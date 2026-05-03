import React, { useRef, useState, useCallback, useEffect } from 'react'
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  TextInput,
  Keyboard,
  Animated,
  Vibration,
} from 'react-native'
import { Task, colors, generateId } from '../types'

interface Props {
  task: Task
  onToggle: (id: string) => void
  onDelete: (id: string) => void
  onToggleSubTask: (taskId: string, subTaskId: string) => void
  onAddSubTask: (taskId: string, title: string) => void
  onSubTaskComplete: () => void
  onTaskComplete: () => void
}

export function SwipeableTask({ task, onToggle, onDelete, onToggleSubTask, onAddSubTask, onSubTaskComplete, onTaskComplete }: Props) {
  const [showSubtasks, setShowSubtasks] = useState(false)
  const [newSubTaskText, setNewSubTaskText] = useState('')
  const inputRef = useRef<TextInput>(null)

  // Task complete animations
  const shakeX = useRef(new Animated.Value(0)).current
  const cardScale = useRef(new Animated.Value(1)).current
  const strikethroughWidth = useRef(new Animated.Value(0)).current

  // Track previous completed state
  const wasCompletedRef = useRef(task.completed)

  useEffect(() => {
    if (!wasCompletedRef.current && task.completed) {
      wasCompletedRef.current = true
      triggerTaskComplete()
    } else if (wasCompletedRef.current && !task.completed) {
      wasCompletedRef.current = false
      strikethroughWidth.setValue(0)
    }
  }, [task.completed])

  const triggerTaskComplete = useCallback(() => {
    // Stronger haptic
    Vibration.vibrate([0, 30, 50, 30])

    // Card bounce — squish then settle
    Animated.sequence([
      Animated.timing(cardScale, { toValue: 0.94, duration: 80, useNativeDriver: true }),
      Animated.spring(cardScale, { toValue: 1, friction: 4, tension: 100, useNativeDriver: true }),
    ]).start()

    // Bigger shake — more frames, bigger displacement
    Animated.sequence([
      Animated.timing(shakeX, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: -8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: 7, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: -5, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: 3, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: -1, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start()

    // Strikethrough draws across
    strikethroughWidth.setValue(0)
    Animated.timing(strikethroughWidth, {
      toValue: 1,
      duration: 400,
      useNativeDriver: false,
    }).start()

    onTaskComplete()
  }, [shakeX, cardScale, strikethroughWidth, onTaskComplete])

  const handleToggleSubTask = useCallback((subTaskId: string) => {
    const subTask = task.subTasks.find(st => st.id === subTaskId)
    const wasCompleted = subTask?.completed ?? false

    onToggleSubTask(task.id, subTaskId)

    if (!wasCompleted) {
      onSubTaskComplete()
    }
  }, [task.id, task.subTasks, onToggleSubTask, onSubTaskComplete])

  const handleAddSubTask = useCallback(() => {
    const trimmed = newSubTaskText.trim()
    if (!trimmed) return
    onAddSubTask(task.id, trimmed)
    setNewSubTaskText('')
    inputRef.current?.focus()
  }, [newSubTaskText, task.id, onAddSubTask])

  const handleOpenSubtasks = useCallback(() => {
    setShowSubtasks(true)
    setTimeout(() => inputRef.current?.focus(), 100)
  }, [])

  const completedSubTasks = task.subTasks.filter(st => st.completed).length

  return (
    <Animated.View style={[styles.card, { transform: [{ translateX: shakeX }, { scale: cardScale }] }]}>
      {/* Main task row */}
      <View style={styles.mainRow}>
        <Pressable
          style={({ pressed }) => [styles.checkbox, task.completed && styles.checkboxCompleted, pressed && styles.pressed]}
          onPress={() => onToggle(task.id)}
          hitSlop={12}
        >
          {task.completed && <Text style={styles.checkmark}>✓</Text>}
        </Pressable>

        {/* Title with strikethrough overlay */}
        <Pressable style={styles.titleContainer} onPress={() => onToggle(task.id)}>
          <Text style={[styles.title, task.completed && styles.titleCompleted, { paddingRight: 8 }]}>
            {task.title}
          </Text>
          <Animated.View
            style={[
              styles.strikethrough,
              {
                opacity: strikethroughWidth,
                transform: [{ scaleX: strikethroughWidth }],
              },
            ]}
            pointerEvents="none"
          />
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.deleteButton, pressed && styles.pressed]}
          onPress={() => onDelete(task.id)}
          hitSlop={12}
        >
          <Text style={styles.deleteText}>×</Text>
        </Pressable>
      </View>

      {/* Subtasks section */}
      <View style={styles.subtasksSection}>
        {task.subTasks.length > 0 && (
          <Pressable
            style={({ pressed }) => [styles.subTasksHeader, pressed && styles.pressed]}
            onPress={() => setShowSubtasks(v => !v)}
          >
            <Text style={styles.subTasksCount}>
              {completedSubTasks}/{task.subTasks.length} subtasks
            </Text>
            <Text style={styles.expandIcon}>{showSubtasks ? '▲' : '▼'}</Text>
          </Pressable>
        )}

        {!showSubtasks && (
          <Pressable
            style={({ pressed }) => [styles.addSubTaskLink, pressed && styles.pressed]}
            onPress={handleOpenSubtasks}
          >
            <Text style={styles.addSubTaskLinkText}>+ Add subtask</Text>
          </Pressable>
        )}

        {showSubtasks && (
          <View style={styles.expandedSection}>
            {task.subTasks.map(subTask => (
              <Pressable
                key={subTask.id}
                style={({ pressed }) => [styles.subTaskRow, pressed && styles.subTaskRowPressed]}
                onPress={() => handleToggleSubTask(subTask.id)}
              >
                <View style={[styles.subTaskCheckbox, subTask.completed && styles.subTaskCheckboxDone]}>
                  {subTask.completed && <Text style={styles.subTaskCheckmark}>✓</Text>}
                </View>
                <Text style={[styles.subTaskTitle, subTask.completed && styles.subTaskTitleDone]}>
                  {subTask.title}
                </Text>
              </Pressable>
            ))}

            <View style={styles.inputRow}>
              <TextInput
                ref={inputRef}
                style={styles.input}
                placeholder="Add a subtask..."
                placeholderTextColor={colors.textLight}
                value={newSubTaskText}
                onChangeText={setNewSubTaskText}
                onSubmitEditing={handleAddSubTask}
                returnKeyType="done"
                blurOnSubmit={false}
              />
              <Pressable
                style={({ pressed }) => [styles.addButton, pressed && styles.addButtonPressed]}
                onPress={handleAddSubTask}
              >
                <Text style={styles.addButtonText}>+</Text>
              </Pressable>
            </View>

            <Pressable
              style={({ pressed }) => [styles.collapseLink, pressed && styles.pressed]}
              onPress={() => {
                Keyboard.dismiss()
                setShowSubtasks(false)
              }}
            >
              <Text style={styles.collapseLinkText}>▲ Hide subtasks</Text>
            </Pressable>
          </View>
        )}
      </View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  checkboxCompleted: {
    backgroundColor: colors.completed,
    borderColor: colors.completed,
  },
  checkmark: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  titleContainer: {
    flex: 1,
    paddingVertical: 4,
    overflow: 'hidden',
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    lineHeight: 22,
  },
  titleCompleted: {
    textDecorationLine: 'line-through',
    color: colors.textLight,
  },
  strikethrough: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '50%',
    height: 1.5,
    backgroundColor: colors.secondary,
    marginTop: -0.75,
  },
  pressed: {
    opacity: 0.6,
  },
  subTaskRowPressed: {
    opacity: 0.6,
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.tertiary + '40',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  deleteText: {
    fontSize: 22,
    color: colors.text,
    fontWeight: 'bold',
    lineHeight: 24,
  },
  subtasksSection: {
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  subTasksHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    marginBottom: 4,
  },
  subTasksCount: {
    fontSize: 13,
    color: colors.secondary,
    fontWeight: '600',
  },
  expandIcon: {
    fontSize: 10,
    color: colors.secondary,
    marginLeft: 6,
  },
  addSubTaskLink: {
    paddingVertical: 8,
  },
  addSubTaskLinkText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  expandedSection: {
    marginTop: 4,
  },
  subTaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    backgroundColor: colors.background,
    borderRadius: 10,
    marginBottom: 8,
  },
  subTaskCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  subTaskCheckboxDone: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  subTaskCheckmark: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  subTaskTitle: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
  },
  subTaskTitleDone: {
    textDecorationLine: 'line-through',
    color: colors.textLight,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  addButtonPressed: {
    backgroundColor: colors.completed,
  },
  addButtonText: {
    fontSize: 26,
    color: '#fff',
    fontWeight: 'bold',
    lineHeight: 28,
  },
  collapseLink: {
    paddingVertical: 6,
    alignItems: 'center',
  },
  collapseLinkText: {
    fontSize: 12,
    color: colors.textLight,
  },
})