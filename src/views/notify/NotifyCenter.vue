<template>
  <div class="notify-center-page">
    <!-- 页面标题 -->
    <div class="page-header">
      <div class="title">
        <h2>🔔 实时通知中心</h2>
        <span class="status" :class="{ online: connected }">
          {{ connected ? '🟢 已连接' : '🔴 已断开' }}
        </span>
      </div>

      <div class="actions">
        <el-select v-model="filterType" placeholder="筛选事件类型" size="small" clearable  :teleported="false"
>
          <el-option label="全部" value="" />
          <el-option label="充值" value="USER_RECHARGE" />
          <el-option label="提现" value="USER_WITHDRAWAL" />
          <el-option label="下单" value="USER_PURCHASE" />
        </el-select>
        <el-button size="small" @click="clearLogs">清空日志</el-button>
      </div>
    </div>

    <!-- 实时消息列表 -->
    <div class="log-container" ref="logBox">
      <div
        v-for="(msg, i) in filteredLogs"
        :key="i"
        class="log-item"
        :class="msg.type.toLowerCase()"
      >
        <div class="log-time">{{ msg.time }}</div>
        <div class="log-type">[{{ eventName(msg.type) }}]</div>
        <div class="log-content">{{ msg.content }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { ElMessage } from 'element-plus'

const logs = ref([])
const filterType = ref('')
const logBox = ref(null)
let ws = null
let reconnectTimer = null
let destroyed = false
const connected = ref(false)

// === 过滤显示 ===
const filteredLogs = computed(() => {
  return filterType.value
    ? logs.value.filter((item) => item.type === filterType.value)
    : logs.value
})

// === 事件名映射 ===
function eventName(type) {
  switch (type) {
    case 'USER_RECHARGE': return '充值事件'
    case 'USER_WITHDRAWAL': return '提现事件'
    case 'USER_PURCHASE': return '下单事件'
    default: return '未知事件'
  }
}

// === 初始化 WebSocket ===
function initWebSocket() {
  try {
    const wsUrl = 'ws://192.168.110.101:8065/ws/admin/notify'
    ws = new WebSocket(wsUrl)

    ws.onopen = () => {
      connected.value = true
      console.log('✅ 通知中心已连接')
      ElMessage.success('WebSocket 已连接')
    }

    ws.onmessage = (event) => {
      if (destroyed) return
      try {
        const msg = JSON.parse(event.data)
        console.log('📩 收到消息:', msg)
        handleEvent(msg)
      } catch (e) {
        console.warn('消息解析失败:', e, event.data)
      }
    }

    ws.onerror = (err) => {
      console.error('WebSocket 错误:', err)
      connected.value = false
    }

    ws.onclose = () => {
      connected.value = false
      console.warn('🔌 WebSocket 已断开')
      scheduleReconnect()
    }
  } catch (e) {
    console.error('WebSocket 初始化失败:', e)
    connected.value = false
    scheduleReconnect()
  }
}

// === 自动重连 ===
function scheduleReconnect() {
  if (reconnectTimer) return
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null
    if (!destroyed) initWebSocket()
  }, 3000)
}

// === 处理消息 ===
function handleEvent(msg) {
  const time = new Date().toLocaleString()

  const rawEvent = msg.event || msg.type || ''
  let type = rawEvent.toUpperCase()

  // 支持中文事件名
  if (rawEvent === '充值') type = 'USER_RECHARGE'
  if (rawEvent === '提现') type = 'USER_WITHDRAWAL'
  if (rawEvent === '下单') type = 'USER_PURCHASE'

  // ✅ 兼容没有 data 的结构
  const data = msg.data || msg
  const user = data.user || '未知用户'
  const amount = data.amount || 0
  const product = data.productName || '未知产品'

  let content = ''
  switch (type) {
    case 'USER_RECHARGE':
      content = `用户 ${user} 充值 ${amount} USDT`
      break
    case 'USER_WITHDRAWAL':
      content = `用户 ${user} 提现 ${amount} USDT`
      break
    case 'USER_PURCHASE':
      content = `用户 ${user} 购买了 ${product}（金额：${amount} USDT）`
      break
    default:
      content = JSON.stringify(data)
  }

  logs.value.unshift({ type, time, content })
  playVoice(type)

  nextTick(() => {
    if (logBox.value) logBox.value.scrollTop = 0
  })
}

// === 播放语音提示 ===
function playVoice(type) {
  const voices = {
    USER_RECHARGE: '收到充值请求',
    USER_WITHDRAWAL: '收到提现请求',
    USER_PURCHASE: '用户下单了'
  }
  const text = voices[type] || '收到新消息'
  const utter = new SpeechSynthesisUtterance(text)
  utter.lang = 'zh-CN'
  speechSynthesis.speak(utter)
}

// === 清空日志 ===
function clearLogs() {
  logs.value = []
  ElMessage.success('已清空通知记录')
}

// === 生命周期 ===
onMounted(() => {
  destroyed = false
  initWebSocket()
})
onBeforeUnmount(() => {
  destroyed = true
  if (ws) {
    // eslint-disable-next-line no-empty
    try { ws.close() } catch {
      
    }
    ws = null
  }
  if (reconnectTimer) {
    clearTimeout(reconnectTimer)
    reconnectTimer = null
  }
})
</script>

<style scoped>
.notify-center-page {
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
}
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}
.title {
  display: flex;
  align-items: center;
  gap: 10px;
}
.status {
  font-size: 13px;
  color: #ccc;
}
.status.online {
  color: #67c23a;
}
.actions {
  display: flex;
  align-items: center;
  gap: 10px;
}
.log-container {
  flex: 1;
  background: #111;
  border: 1px solid #333;
  border-radius: 6px;
  padding: 10px;
  overflow-y: auto;
  color: #eee;
  font-size: 13px;
}
.log-item {
  padding: 6px 10px;
  border-bottom: 1px solid #222;
}
.log-item.recharge { color: #67c23a; }
.log-item.withdrawal { color: #e6a23c; }
.log-item.purchase { color: #409eff; }
.log-time {
  opacity: 0.6;
  font-size: 12px;
}
.log-type {
  font-weight: bold;
  margin-top: 3px;
}
.log-content {
  margin-left: 10px;
  margin-top: 2px;
}
/* --- 修复下拉菜单和选中项字体颜色 --- */
:deep(.el-select),
:deep(.el-select__wrapper),
:deep(.el-input__inner) {
  color: #fff !important;
  background-color: #222 !important;
  border-color: #333 !important;
}

/* 占位符颜色 */
:deep(.el-select__placeholder) {
  color: #aaa !important;
}

/* 下拉面板样式 */
:deep(.el-select-dropdown) {
  background-color: #222 !important;
  border: 1px solid #333 !important;
}

/* 每一项样式 */
:deep(.el-select-dropdown__item) {
  color: #fff !important;
}

:deep(.el-select-dropdown__item.is-hovering) {
  background-color: #333 !important;
}

:deep(.el-select-dropdown__item.is-selected) {
  color: #ffd04b !important; /* 选中为金色 */
  font-weight: bold;
}

</style>
