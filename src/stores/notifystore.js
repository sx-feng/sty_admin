// src/stores/notifyStore.js
import { ref,watch } from 'vue'

const connected = ref(false)
const logs = ref([])
let ws = null
let reconnectTimer = null
// ✅ 启动时从 localStorage 恢复历史记录
logs.value = JSON.parse(localStorage.getItem('notifyLogs') || '[]')
watch(logs, (val) => localStorage.setItem('notifyLogs', JSON.stringify(val)), { deep: true })
const wsUrl = window?.appConfig?.wsUrl || 'ws://192.168.110.101:8056/ws/admin/notify'

function connect() {
  if (ws) return // ✅ 防止重复连接
  try {
    ws = new WebSocket(wsUrl)
    ws.onopen = () => {
      connected.value = true
      console.log('[Notify] ✅ 已连接')
    }
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data)
        const time = new Date().toLocaleString()

        // ✅ 根据 event 自动生成文字内容
        let content = ''
        switch (msg.event) {
          case 'USER_CONNECTED':
            content = `用户 ${msg.user || msg.userId} 已连接`
            break
          case 'USER_DISCONNECTED':
            content = `用户 ${msg.user || msg.userId} 已断开连接`
            break
          case 'FINANCIAL_TRANSFER_IN':
            content = `用户 ${msg.user || msg.userId} 发起理财转入`
            break
          case 'FINANCIAL_TRANSFER_OUT':
            content = `用户 ${msg.user || msg.userId} 发起理财转出`
            break
          case 'CONTACT_SUPPORT':
            content = `用户 ${msg.user || msg.userId} 请求人工客服支持`
            break
          default:
            content = msg.data || '未知事件'
        }

        logs.value.unshift({
          type: msg.event,
          user: msg.user,
          time,
          content,
        })
      } catch (e) {
        console.warn('消息解析失败:', e, event.data)
      }
    }

    ws.onclose = () => {
      connected.value = false
      console.warn('[Notify] 🔌 连接关闭，3 秒后重连')
      ws = null
      scheduleReconnect()
    }

    ws.onerror = () => {
      connected.value = false
      console.warn('[Notify] ⚠️ WebSocket 错误')
    }
  } catch (e) {
    console.error('[Notify] WebSocket 初始化失败:', e)
    scheduleReconnect()
  }
}

function scheduleReconnect() {
  if (reconnectTimer) return
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null
    connect()
  }, 3000)
}


function clearLogs() {
  logs.value = []
}

export function useNotifyStore() {
  return {
    connected,
    logs,
    connect,
    clearLogs,
  }
}
