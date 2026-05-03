import React, { useEffect, useRef } from 'react'
import { View, Text, Animated, StyleSheet } from 'react-native'
import { colors } from '../types'

interface Props {
  visible: boolean
  onAnimationComplete?: () => void
}

export function NiceOverlay({ visible, onAnimationComplete }: Props) {
  const textScale = useRef(new Animated.Value(0.6)).current
  const textOpacity = useRef(new Animated.Value(0)).current
  const ringScale = useRef(new Animated.Value(0)).current
  const ringOpacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (visible) {
      textScale.setValue(0.6)
      textOpacity.setValue(0)
      ringScale.setValue(0)
      ringOpacity.setValue(0)

      // Ring expands from center
      Animated.parallel([
        Animated.timing(ringScale, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(ringOpacity, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]).start()

      // Text sequence: pop in → hold → shrink+fade → done
      Animated.sequence([
        Animated.parallel([
          Animated.timing(textScale, { toValue: 1, duration: 250, useNativeDriver: true }),
          Animated.timing(textOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
        ]),
        Animated.delay(600),
        Animated.parallel([
          Animated.timing(textScale, { toValue: 0.8, duration: 280, useNativeDriver: true }),
          Animated.timing(textOpacity, { toValue: 0, duration: 280, useNativeDriver: true }),
        ]),
      ]).start(({ finished }) => {
        if (finished) onAnimationComplete?.()
      })
    }
  }, [visible])

  if (!visible) return null

  return (
    <View style={styles.overlay} pointerEvents="none">
      {/* Expanding ring from center */}
      <Animated.View
        style={[
          styles.ring,
          {
            transform: [{ scale: ringScale }],
            opacity: ringOpacity,
          },
        ]}
      />

      {/* "nice." centered */}
      <Animated.Text
        style={[
          styles.text,
          {
            opacity: textOpacity,
            transform: [{ scale: textScale }],
          },
        ]}
      >
nice work.
      </Animated.Text>
    </View>
  )
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  ring: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: colors.primary + '50',
  },
  text: {
    fontSize: 30,
    fontWeight: '300',
    color: colors.text,
    fontStyle: 'italic',
    letterSpacing: -1,
  },
})