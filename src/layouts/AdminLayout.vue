<template>
  <div class="admin-layout">
    <!-- 左侧导航栏 -->
    <aside class="sidebar">
      <h2 class="logo">后台系统</h2>
      <nav>


        <router-link to="/dashboard" class="nav-item" active-class="active">📊 仪表盘</router-link>
        <router-link to="/users" class="nav-item" active-class="active">👥 用户管理</router-link>
        <router-link to="/financial" class="nav-item" active-class="active">💰 理财管理</router-link>
        <router-link to="/withdrawal" class="nav-item" active-class="active">💸 提现管理</router-link>
        <router-link to="/recharge" class="nav-item" active-class="active">💳 充值管理</router-link>
        <router-link to="/products" class="nav-item" active-class="active">🛒 产品管理</router-link>
        <router-link to="/InterestControl" class="nav-item" active-class="active">📈 利率控制</router-link>
         <router-link to="/notify" class="nav-item" active-class="active">🔔 通知中心</router-link>
         <router-link to="/SystemSettings" class="nav-item" active-class="active">⚙️系统设置</router-link>

      </nav>
      <div class="logout">
        <el-button type="danger" size="small" @click="logout">退出登录</el-button>
      </div>
    </aside>

    <!-- 右侧内容 -->
    <main class="main-content">
      <header class="topbar">
        <span class="topbar_to"><el-switch :active-text="'暗色'" :inactive-text="'浅色'" :model-value="theme === 'dark'"
            @change="toggle()" /></span>
              <span class="status-text" :class="{ online: connected }">
              {{ connected ? '🟢 已连接' : '🔴 已断开' }}
              </span> &nbsp;&nbsp;&nbsp;

        <span>欢迎回来，管理员！</span>
        <NotifyBell />
      </header>

      <section class="page-view">
        <router-view />
      </section>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, getCurrentInstance } from 'vue'
import { useTheme } from '@/utils/useTheme'
const { theme, toggle } = useTheme()
import NotifyBell from '@/components/NotifyBell.vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
const router = useRouter()
// ✅ 取全局 WebSocket 地址
const { appContext } = getCurrentInstance()
const wsUrl = appContext.config.globalProperties.$config.wsUrl

// ✅ 新增连接状态变量
const connected = ref(false)
let ws = null
let reconnectTimer = null

function initWebSocket() {
  try {
    ws = new WebSocket(wsUrl)
    ws.onopen = () => { connected.value = true }
    ws.onclose = () => {
      connected.value = false
      scheduleReconnect()
    }
    ws.onerror = () => {
      connected.value = false
    }
  } catch (e) {
    connected.value = false
    scheduleReconnect()
  }
}

function scheduleReconnect() {
  if (reconnectTimer) return
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null
    initWebSocket()
  }, 3000)
}
onMounted(() => {
  initWebSocket()
})



function logout() {
  localStorage.removeItem('admin-token')
  ElMessage.success('已退出登录')
  router.push('/login')
}
</script>

<style scoped>
.topbar_to {
  margin-right: auto; /* 让它靠左，自动撑开间距 */
  display: flex;
  align-items: center;
  gap: 6px; /* 让文字和开关有点间距 */
  font-size: 14px;
  color: var(--text-2);
}

.admin-layout {
  display: flex;
  height: 100vh;
  background-color: var(--bg-body);
  color: var(--text-1);
}

.sidebar {
  width: 200px;
  background: var(--bg-panel);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  border-right: 1px solid var(--border);
}

.logo {
  text-align: center;
  padding: 15px;
  font-size: 18px;
  color: var(--brand);
}

nav {
  display: flex;
  flex-direction: column;
}

.nav-item {
  color: var(--text-1);
  padding: 10px 15px;
  text-decoration: none;
  transition: background 0.2s, color 0.2s;
}

.nav-item:hover,
.nav-item.active {
  background: var(--bg-panel-2);
  color: var(--brand);
}

.logout {
  padding: 10px;
  text-align: center;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.topbar {
  height: 50px;
  background: var(--bg-panel);
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0 20px;
}

.page-view {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}
.status-text {
  font-size: 13px;
  color: #ff5f5f; /* 默认红色 */
  transition: color 0.3s;
}
.status-text.online {
  color: var(--success); /* 绿色 */
}
.topbar-right {
  display: flex;
  align-items: center;
  gap: 15px;
}

</style>
