<template>
  <div class="admin-layout">
    <!-- 左侧导航栏 -->
    <aside class="sidebar">
      <h2 class="logo">STY 后台系统</h2>
      <nav>


        <router-link to="/dashboard" class="nav-item" active-class="active">📊 仪表盘</router-link>
        <router-link to="/users" class="nav-item" active-class="active">👥 用户管理</router-link>
        <router-link to="/financial" class="nav-item" active-class="active">💰 理财管理</router-link>
        <router-link to="/withdrawal" class="nav-item" active-class="active">💸 提现管理</router-link>
        <router-link to="/products" class="nav-item" active-class="active">🛒 产品管理</router-link>
        <router-link to="/notify" class="nav-item" active-class="active">🔔 通知中心</router-link>
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
import { useTheme } from '@/utils/useTheme'
const { theme, toggle } = useTheme()
import NotifyBell from '@/components/NotifyBell.vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

const router = useRouter()

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
  color: #ccc;
}

.admin-layout {
  display: flex;
  height: 100vh;
  background-color: #121212;
  color: #f5f5f5;
}

.sidebar {
  width: 200px;
  background: #1b1b1b;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  border-right: 1px solid #333;
}

.logo {
  text-align: center;
  padding: 15px;
  font-size: 18px;
  color: gold;
}

nav {
  display: flex;
  flex-direction: column;
}

.nav-item {
  color: #ddd;
  padding: 10px 15px;
  text-decoration: none;
  transition: background 0.2s;
}

.nav-item:hover,
.nav-item.active {
  background: #2a2a2a;
  color: gold;
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
  background: #181818;
  border-bottom: 1px solid #333;
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
</style>
