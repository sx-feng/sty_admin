<template>
  <div class="notify-center-page">
    <!-- 页面标题 -->
    <div class="page-header">
      <div class="title">
        <h2>🔔 实时通知中心</h2>
        <p>{{ connected ? '🟢 已连接' : '🔴 已断开' }}</p>
        <el-button @click="clearLogs" size="small">清空</el-button>
      </div>

      <div class="actions">
        <el-select
          v-model="filterType"
          placeholder="筛选事件类型"
          size="small"
          clearable
          :teleported="false"
        >
          <el-option label="全部" value="" />
          <el-option label="充值" value="USER_RECHARGE" />
          <el-option label="提现" value="USER_WITHDRAWAL" />
          <el-option label="下单" value="USER_PURCHASE" />
          <el-option label="用户上线" value="USER_CONNECTED" />
          <el-option label="用户下线" value="USER_DISCONNECTED" />
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
        :class="msg.type?.toLowerCase()"
      >
        <div class="log-time">{{ msg.time }}</div>
        <div class="log-type">[{{ eventName(msg.type) }}]</div>
        <div class="log-content">{{ msg.content }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'
import { useNotifyStore } from '@/stores/notifystore'

const { logs, connected, clearLogs } = useNotifyStore()

const filterType = ref('')
const logBox = ref(null)

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
    case 'USER_CONNECTED': return '用户上线'
    case 'USER_DISCONNECTED': return '用户下线'
    case 'FINANCIAL_TRANSFER_IN': return '理财转入'
    case 'FINANCIAL_TRANSFER_OUT': return '理财转出'
    case 'CONTACT_SUPPORT': return '客服请求'
    default: return '未知事件'
  }
}

// === 自动滚动到顶部 ===
nextTick(() => {
  if (logBox.value) logBox.value.scrollTop = 0
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
.log-item.user_connected { color: #67c23a; } /* 🟢 用户上线绿色 */
.log-item.user_disconnected { color: #f56c6c; } /* 🔴 用户下线红色 */
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
/* --- 下拉菜单样式修复 --- */
:deep(.el-select),
:deep(.el-select__wrapper),
:deep(.el-input__inner) {
  color: #fff !important;
  background-color: #222 !important;
  border-color: #333 !important;
}
:deep(.el-select__placeholder) {
  color: #aaa !important;
}
:deep(.el-select-dropdown) {
  background-color: #222 !important;
  border: 1px solid #333 !important;
}
:deep(.el-select-dropdown__item) {
  color: #fff !important;
}
:deep(.el-select-dropdown__item.is-hovering) {
  background-color: #333 !important;
}
:deep(.el-select-dropdown__item.is-selected) {
  color: #ffd04b !important;
  font-weight: bold;
}
</style>
