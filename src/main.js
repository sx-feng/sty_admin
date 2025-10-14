// src/main.js
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import '@/styles/theme.css'
import '@/styles/element-override.css'

// ✅ 定义全局配置对象
const globalConfig = {
  wsUrl: 'ws://192.168.110.101:8056/ws/admin/notify', // 你的全局 WebSocket 地址
}

const app = createApp(App)

// ✅ 注入全局配置
app.config.globalProperties.$config = globalConfig

// ✅ 挂载路由与 ElementPlus
app.use(router)
app.use(ElementPlus)

// ✅ 默认主题
document.documentElement.setAttribute('data-theme', 'dark')

// ✅ 启动应用
app.mount('#app')
