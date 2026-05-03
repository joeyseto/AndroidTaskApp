import React, { useEffect, useRef, useState } from 'react'
import { View, StyleSheet, Animated, Dimensions } from 'react-native'

interface Props {
  visible: boolean
  onComplete?: () => void
}

const { width, height } = Dimensions.get('window')
const CONFETTI_COUNT = 50

const confettiColors = ['#A8E6CF', '#DCD0FF', '#FFDAB9', '#FFB7B2', '#B8D4E3', '#FFE5B4']

interface ConfettiPiece {
  x: Animated.Value
  y: Animated.Value
  rotate: Animated.Value
  color: string
  size: number
}

export function ConfettiOverlay({ visible, onComplete }: Props) {
  const piecesRef = useRef<ConfettiPiece[]>([])
  const [renderPieces, setRenderPieces] = useState<ConfettiPiece[]>([])

  useEffect(() => {
    if (visible) {
      // Generate confetti pieces
      const newPieces: ConfettiPiece[] = Array.from({ length: CONFETTI_COUNT }, () => ({
        x: new Animated.Value(Math.random() * width),
        y: new Animated.Value(-50),
        rotate: new Animated.Value(0),
        color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
        size: 8 + Math.random() * 8,
      }))

      piecesRef.current = newPieces
      setRenderPieces(newPieces)

      // Animate all pieces falling
      const animations = newPieces.map((piece, idx) => {
        const endX = width / 2 + (Math.random() - 0.5) * width
        return Animated.parallel([
          Animated.timing(piece.y, {
            toValue: height + 50,
            duration: 2000 + Math.random() * 1000,
            useNativeDriver: true,
          }),
          Animated.timing(piece.rotate, {
            toValue: 360 * (2 + Math.random() * 2),
            duration: 2000 + Math.random() * 1000,
            useNativeDriver: true,
          }),
          Animated.timing(piece.x, {
            toValue: endX,
            duration: 2000 + Math.random() * 1000,
            useNativeDriver: true,
          }),
        ])
      })

      Animated.parallel(animations).start(() => {
        setRenderPieces([])
        if (onComplete) {
          onComplete()
        }
      })
    }
  }, [visible])

  if (!visible || renderPieces.length === 0) {
    return null
  }

  return (
    <View style={styles.container} pointerEvents="none">
      {renderPieces.map((piece, index) => (
        <Animated.View
          key={index}
          style={[
            styles.confetti,
            {
              width: piece.size,
              height: piece.size,
              backgroundColor: piece.color,
              transform: [
                { translateX: piece.x },
                { translateY: piece.y },
                {
                  rotate: piece.rotate.interpolate({
                    inputRange: [0, 360],
                    outputRange: ['0deg', '360deg'],
                  }),
                },
              ],
            },
          ]}
        />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
  confetti: {
    position: 'absolute',
    borderRadius: 2,
  },
})