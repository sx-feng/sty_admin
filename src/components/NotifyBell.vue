<template>
  <div class="notify-bell">
    <el-badge :is-dot="hasUnread" class="bell-badge">
      <el-button circle class="bell-btn" @click="drawerOpen = true" :title="hasUnread ? '有新消息' : '通知'">
        <i class="icon">🔔</i>
      </el-button>
    </el-badge>

    <!-- 抽屉显示通知列表 -->
    <el-drawer v-model="drawerOpen" title="通知中心" size="380px" append-to-body>
      <div class="toolbar">
        <el-select v-model="typeFilter" placeholder="筛选事件" size="small" style="width: 160px">
          <el-option label="全部" value=""></el-option>
          <el-option
            v-for="item in notifyTypeDefs"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          ></el-option>
        </el-select>
        <el-button size="small" @click="markAllRead">标记已读</el-button>
        <el-button size="small" @click="clearAll" type="danger" plain>清空</el-button>
      </div>

      <div class="list" v-if="filteredLogs.length">
        <div
          v-for="(log, i) in filteredLogs"
          :key="i"
          class="log-item"
          :class="['t-' + log.type.toLowerCase(), { unread: !log.read }]"
        >
          <div class="line1">
            <span class="tag">{{ typeText(log.type) }}</span>
            <span class="time">{{ formatTime(log.ts) }}</span>
          </div>
          <div class="msg">{{ log.message }}</div>
        </div>
      </div>
      <div v-else class="empty">暂无消息</div>
    </el-drawer>

    <!-- 静音/提示音 -->
    <audio ref="audioRef" preload="auto">
      <source :src="beepSrc" type="audio/mp3" />
    </audio>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, getCurrentInstance } from 'vue'
import { ElMessage } from 'element-plus'
import { speakNotificationByType } from '@/utils/notifyAudio'
import { notifyTypeDefs, getNotifyShortLabel, formatNotifyMessage, getNotifyAudio } from '@/constants/notifyTypes'
const { appContext } = getCurrentInstance()
const wsUrl = appContext.config.globalProperties.$config.wsUrl


/**
 * 可调参数
 * - wsUrl：后端 WebSocket 地址
 * - autoConnect：是否自动连接
 */
// eslint-disable-next-line no-undef
const props = defineProps({

  autoConnect: {
    type: Boolean,
    default: true,
  },
  // 未读时是否播放声音
  beep: { type: Boolean, default: true },
})

// UI 状态
const drawerOpen = ref(false)
const typeFilter = ref('')

// 消息列表
const logs = ref([]) // { type, message, ts, read }

// 未读
const hasUnread = computed(() => logs.value.some(l => !l.read))

// 过滤后
const filteredLogs = computed(() =>
  typeFilter.value ? logs.value.filter(l => l.type === typeFilter.value) : logs.value
)

// WebSocket
let ws = null
let reconnectTimer = null
const audioRef = ref(null)
const audioCache = new Map()
// WebAudio：按类型播放不同提示音（无需外部 mp3）
let audioCtx = null
let audioUnlocked = false

// eslint-disable-next-line no-unused-vars
function initAudio() {
  if (!audioCtx) {
    const Ctx = window.AudioContext || window.webkitAudioContext
    if (!Ctx) return
    audioCtx = new Ctx()
  }
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume()
  audioUnlocked = true
  if (typeof Audio !== 'undefined') {
    notifyTypeDefs.forEach(item => {
      if (!item.audio || audioCache.has(item.audio)) return
      try {
        const audioElement = new Audio(item.audio)
        audioElement.preload = 'auto'
        audioElement.load()
        audioCache.set(item.audio, audioElement)
      } catch {
        // ignore: preload failures commonly thrown before user interaction
      }
    })
  }
}

function getCachedAudio(url) {
  if (!url) return null
  if (audioCache.has(url)) return audioCache.get(url)
  if (typeof Audio === 'undefined') return null
  try {
    const audioElement = new Audio(url)
    audioElement.preload = 'auto'
    audioCache.set(url, audioElement)
    return audioElement
  } catch {
    return null
  }
}

function playAudioClip(url) {
  const el = getCachedAudio(url)
  if (!el) return false
  try {
    el.currentTime = 0
    const playPromise = el.play()
    if (playPromise && typeof playPromise.then === 'function') {
      playPromise.catch(() => {})
    }
    return true
  } catch {
    return false
  }
}

// 生成一次“哔”的纯音
function beep(freq = 880, duration = 180) {
  if (!audioCtx) return
  const osc = audioCtx.createOscillator()
  const gain = audioCtx.createGain()
  osc.type = 'sine'
  osc.frequency.value = freq
  // 快速起音、快速衰减，避免爆音
  gain.gain.setValueAtTime(0.0001, audioCtx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.22, audioCtx.currentTime + 0.012)
  gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration / 1000)
  osc.connect(gain).connect(audioCtx.destination)
  osc.start()
  osc.stop(audioCtx.currentTime + duration / 1000 + 0.02)
}

// 按事件类型播放不同音色/节奏
// eslint-disable-next-line no-unused-vars
function playBeepFor(type) {
  if (!props.beep) return
  const audioUrl = getNotifyAudio(type)
  if (audioUrl && playAudioClip(audioUrl)) return
  // 若未解锁，尝试用 <audio> 退而求其次（可能仍受策略限制）
  if (!audioUnlocked) {
    if (audioRef.value && audioRef.value.play) {
      try { audioRef.value.currentTime = 0; audioRef.value.play() } catch {""}
    }
    return
  }
  switch (type) {
    case 'USER_RECHARGE':     // 充值：高音短提示
      beep(1200, 180)
      break
    case 'USER_WITHDRAWAL':   // 提现：低音稍长
      beep(520, 220)
      break
    case 'USER_PURCHASE':     // 下单：双击提示
      beep(900, 120)
      setTimeout(() => beep(900, 120), 160)
      break
    default:                  // 其他：中音
      beep(800, 160)
  }
}
// 简单的提示音（内置 base64 一小段哔声），也可以换成你 public 目录下的 mp3
const beepSrc =
  'data:audio/mp3;base64,//uQZAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAACcQCA...' // 省略：可用你自己的 mp3 链接

function connect() {
  try {
    ws = new WebSocket(wsUrl)
  } catch (e) {
    console.error('WS 创建失败：', e)
    scheduleReconnect()
    return
  }

  ws.onopen = () => {
    console.log('[Notify] WS connected')
    ElMessage.success('通知服务已连接')
  }

  ws.onmessage = (evt) => {
    let payload = null
    try {
      payload = JSON.parse(evt.data)
    } catch {
      // 兼容纯字符串
      payload = { event: 'USER_PURCHASE', message: String(evt.data || '新消息') }
    }

    // ✅ 自动识别 event 类型
    const type = payload.event || payload.type || 'USER_PURCHASE'

    // ✅ 动态生成可读消息内容
    const message = formatNotifyMessage(type, payload, payload.message)

    const item = {
      type,
      message,
      ts: Date.now(),
      read: false,
    }

    logs.value.unshift(item)

    // ✅ 播放提示音
    playBeepFor(type)
    speakNotificationByType(type, item.message)
  }


  ws.onerror = () => {
    console.warn('[Notify] WS error')
  }

  ws.onclose = () => {
    console.warn('[Notify] WS closed')
    scheduleReconnect()
  }
}

function scheduleReconnect() {
  if (reconnectTimer) return
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null
    connect()
  }, 2000)
}

function disconnect() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer)
    reconnectTimer = null
  }
  if (ws) {
    // eslint-disable-next-line no-empty
    try { ws.close() } catch {
        
    }
    ws = null
  }
}

function markAllRead() {
  logs.value = logs.value.map(l => ({ ...l, read: true }))
}

function clearAll() {
  logs.value = []
}

function typeText(t) {
  return getNotifyShortLabel(t || '')
}

function pad(n) { return String(n).padStart(2, '0') }
function formatTime(ts) {
  const d = new Date(ts)
  const y = d.getFullYear()
  const m = pad(d.getMonth() + 1)
  const day = pad(d.getDate())
  const hh = pad(d.getHours())
  const mm = pad(d.getMinutes())
  const ss = pad(d.getSeconds())
  return `${y}-${m}-${day} ${hh}:${mm}:${ss}`
}

onMounted(() => {
  if (props.autoConnect) connect()
  window.addEventListener('click', initAudio, { once: true })
})

onBeforeUnmount(() => {
  disconnect()
  window.removeEventListener('click', initAudio)

})
</script>

<style scoped>
.notify-bell {
  display: inline-flex;
  align-items: center;
}
.bell-badge {
  --el-badge-dot-size: 10px;
}
.bell-btn {
  width: 36px;
  height: 36px;
  background: #222;
  border: 1px solid #333;
  color: #ffd24d;
}
.bell-btn:hover {
  background: #262626;
  border-color: #444;
}
.icon { font-size: 16px; }

/* 抽屉内部 */
.toolbar {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 10px;
}
.list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: calc(100vh - 180px);
  overflow-y: auto;
}
.log-item {
  background: #121212;
  border: 1px solid #2a2a2a;
  border-radius: 10px;
  padding: 10px;
}
.log-item.unread {
  box-shadow: 0 0 0 1px rgba(255, 210, 77, .35) inset;
}
.line1 {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
  font-size: 12px;
  color: #aaa;
}
.tag {
  padding: 2px 6px;
  border-radius: 999px;
  font-weight: 700;
}
.t-user_recharge .tag { background: rgba(76, 175, 80, .15); color: #77e087; }
.t-user_withdrawal .tag { background: rgba(244, 67, 54, .15); color: #ff8a80; }
.t-user_purchase .tag { background: rgba(255, 193, 7, .15); color: #ffd24d; }
.msg {
  color: #eaeaea;
  line-height: 1.5;
  word-break: break-word;
}
.empty {
  text-align: center;
  color: #777;
  padding: 20px 0;
}
</style>
