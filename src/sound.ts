import { Audio } from 'expo-av'

let completionSound: Audio.Sound | null = null

export const Sound = {
  async init() {
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      })
    } catch (error) {
      console.error('Failed to init audio:', error)
    }
  },

  async playComplete() {
    try {
      // Use a system sound approach - create a simple beep
      const { sound } = await Audio.Sound.createAsync(
        { uri: 'https://www.soundjay.com/buttons/sounds/click_16.mp3' },
        { shouldPlay: true, volume: 0.5 }
      )
      // Unload after playing
      sound.setOnPlaybackStatusUpdate(status => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync()
        }
      })
    } catch (error) {
      // Silently fail if sound doesn't work
    }
  },

  async playSuccess() {
    try {
      // Play a slightly longer, more triumphant sound
      const { sound } = await Audio.Sound.createAsync(
        { uri: 'https://www.soundjay.com/buttons/sounds/button_09.mp3' },
        { shouldPlay: true, volume: 0.6 }
      )
      sound.setOnPlaybackStatusUpdate(status => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync()
        }
      })
    } catch (error) {
      // Silently fail
    }
  },

  async playSubTask() {
    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri: 'https://www.soundjay.com/buttons/sounds/click_16.mp3' },
        { shouldPlay: true, volume: 0.25 }
      )
      sound.setOnPlaybackStatusUpdate(status => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync()
        }
      })
    } catch (error) {
      // Silently fail
    }
  },

  async cleanup() {
    if (completionSound) {
      await completionSound.unloadAsync()
      completionSound = null
    }
  },
}