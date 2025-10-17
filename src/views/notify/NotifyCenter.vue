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
          <el-option
            v-for="item in notifyTypeDefs"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
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
import { notifyTypeDefs, getNotifyLabel } from '@/constants/notifyTypes'

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
  return getNotifyLabel(type || '')
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
  color: var(--text-2);
}
.status.online {
  color: var(--success);
}
.actions {
  display: flex;
  align-items: center;
  gap: 10px;
}
.log-container {
  flex: 1;
  background: var(--bg-panel);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 10px;
  overflow-y: auto;
  color: var(--text-1);
  font-size: 13px;
}
.log-item {
  padding: 6px 10px;
  border-bottom: 1px solid var(--border);
}
.log-item.recharge { color: var(--success); }
.log-item.withdrawal { color: #e6a23c; }
.log-item.purchase { color: var(--info); }
.log-item.user_connected { color: var(--success); } /* 🟢 用户上线绿色 */
.log-item.user_disconnected { color: var(--danger); } /* 🔴 用户下线红色 */
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
  color: var(--text-1) !important;
  background-color: var(--bg-panel) !important;
  border-color: #333 !important;
}
:deep(.el-select__placeholder) {
  color: var(--text-2) !important;
}
:deep(.el-select-dropdown) {
  background-color: var(--bg-panel) !important;
  border: 1px solid var(--border) !important;
}
:deep(.el-select-dropdown__item) {
  color: var(--text-1) !important;
}
:deep(.el-select-dropdown__item.is-hovering) {
  background-color: var(--bg-panel-2) !important;
}
:deep(.el-select-dropdown__item.is-selected) {
  color: var(--brand) !important;
  font-weight: bold;
}
</style>

