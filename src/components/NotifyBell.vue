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
        <el-select v-model="typeFilter" placeholder="筛选事件" size="small" style="width: 140px">
          <el-option label="全部" value=""></el-option>
          <el-option label="充值" value="USER_RECHARGE"></el-option>
          <el-option label="提现" value="USER_WITHDRAWAL"></el-option>
          <el-option label="下单" value="USER_PURCHASE"></el-option>
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
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { ElMessage } from 'element-plus'

/**
 * 可调参数
 * - wsUrl：后端 WebSocket 地址
 * - autoConnect：是否自动连接
 */
// eslint-disable-next-line no-undef
const props = defineProps({
  wsUrl: {
    type: String,
    default: 'ws://192.168.110.101:8065/ws/admin/notify',
  },
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

// 简单的提示音（内置 base64 一小段哔声），也可以换成你 public 目录下的 mp3
const beepSrc =
  'data:audio/mp3;base64,//uQZAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAACcQCA...' // 省略：可用你自己的 mp3 链接

function connect() {
  try {
    ws = new WebSocket(props.wsUrl)
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
  let message = payload.message
  if (!message) {
    switch (type) {
      case 'USER_PURCHASE':
        message = `${payload.user || '未知用户'} 购买了 ${payload.productName || '未知产品'}（金额：${payload.amount || 0} USDT）`
        break
      case 'USER_WITHDRAWAL':
        message = `${payload.user || '未知用户'} 提现 ${payload.amount || 0} USDT`
        break
      case 'USER_RECHARGE':
        message = `${payload.user || '未知用户'} 充值 ${payload.amount || 0} USDT`
        break
      default:
        message = JSON.stringify(payload)
    }
  }

  const item = {
    type,
    message,
    ts: Date.now(),
    read: false,
  }

  logs.value.unshift(item)

  // ✅ 播放提示音
  if (props.beep && audioRef.value) {
    try {
      audioRef.value.currentTime = 0
      audioRef.value.play()
    } catch (err) {
      console.warn('[Notify] 音频播放失败', err)
    }
  }
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
  switch (t) {
    case 'USER_RECHARGE': return '充值'
    case 'USER_WITHDRAWAL': return '提现'
    case 'USER_PURCHASE': return '下单'
    default: return t || '事件'
  }
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
})

onBeforeUnmount(() => {
  disconnect()
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
