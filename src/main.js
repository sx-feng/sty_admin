// src/main.js
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import '@/styles/theme.css'
import '@/styles/element-override.css'
const app = createApp(App)
app.use(router)       // ✅ 挂载 Vue Router
app.use(ElementPlus)  // ✅ 挂载 ElementPlus
app.mount('#app')     // ✅ 挂载应用
document.documentElement.setAttribute('data-theme','dark'); // 默认黑金
