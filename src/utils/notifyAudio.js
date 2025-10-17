// Utility for playing spoken notifications in Chinese based on event type mappings.
// Uses the browser SpeechSynthesis API and falls back silently when unavailable.
import { getNotifySpeech } from '@/constants/notifyTypes'

let selectedVoice = null

function pickChineseVoice(synth) {
  const voices = synth.getVoices?.() || []
  if (!voices.length) return null
  const zhVoice = voices.find(v => v && typeof v.lang === 'string' && v.lang.toLowerCase().startsWith('zh'))
  return zhVoice || voices[0]
}

export function speakNotificationByType(type, fallbackMessage) {
  if (typeof window === 'undefined') return
  const synth = window.speechSynthesis
  if (!synth || typeof SpeechSynthesisUtterance === 'undefined') return

  const text = getNotifySpeech(type, fallbackMessage)

  if (!selectedVoice) {
    selectedVoice = pickChineseVoice(synth)
    if (!selectedVoice) {
      // 声音列表尚未加载，等待事件后再尝试一次
      const retry = () => {
        selectedVoice = pickChineseVoice(synth)
        if (selectedVoice) speakNotificationByType(type, fallbackMessage)
        synth.removeEventListener('voiceschanged', retry)
      }
      synth.addEventListener('voiceschanged', retry)
      return
    }
  }

  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = selectedVoice.lang || 'zh-CN'
  utterance.voice = selectedVoice
  utterance.pitch = 1
  utterance.rate = 0.95

  // 避免排队堆积导致长时间播报
  if (synth.speaking) synth.cancel()
  synth.speak(utterance)
}
