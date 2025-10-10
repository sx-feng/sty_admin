<template>
  <div class="login-page">
    <div class="login-card">
      <h2 class="title">后台管理系统</h2>

      <!-- 用户名输入 -->
      <div class="form-item">
        <label>用户名</label>
        <input
          v-model.trim="username"
          type="text"
          placeholder="请输入用户名"
          @keyup.enter="handleLogin"
        />
      </div>

      <!-- 密码输入 -->
      <div class="form-item">
        <label>密码</label>
        <input
          v-model.trim="password"
          type="password"
          placeholder="请输入密码"
          @keyup.enter="handleLogin"
        />
      </div>

      <!-- 登录按钮 -->
      <button class="login-btn" :disabled="loading" @click="doLogin">
        <span v-if="!loading">登 录</span>
        <span v-else>登录中...</span>
      </button>

      <!-- 错误提示 -->
      <p v-if="errorMsg" class="error-msg">{{ errorMsg }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue"
import { useRouter } from "vue-router"
import { request } from "@/api/request"
import { ElMessage } from 'element-plus'

 // ✅ 使用你自己的加密请求模块
const errorMsg = ref('')
const router = useRouter()
const username = ref("")
const password = ref("")
const loading = ref(false)

async function doLogin() {
  if (!username.value || !password.value) {
    alert("请输入用户名和密码")
    return
  }

  loading.value = true
  try {
    // ✅ 用你的封装请求
    const res = await request(1, "/api/admin/user/login", {
      adminUserName: username.value,
      adminUserPassword: password.value,
    })

   loading.value = false

    if (res.code === 200) {
      ElMessage.success(res.message)
      localStorage.setItem('admin-token', res.data) // ✅ 存 token
      router.push('/dashboard') // ✅ 跳转仪表盘
    } else {
      ElMessage.error(res.message || '登录失败')
    }
  } catch (err) {
    alert("网络异常：" + err.message)
  } finally {
    loading.value = false
  }
}
</script>


<style scoped>
/* 页面整体布局 */
.login-page {
  min-height: 100vh;
  background: radial-gradient(circle at 50% 20%, #1a1a1a, #000);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: "Microsoft YaHei", sans-serif;
}

/* 登录卡片 */
.login-card {
  width: 340px;
  background: rgba(255, 255, 255, 0.05);
  border: 3px solid rgba(255, 215, 0, 0.25);
  border-radius: 16px;
  padding: 30px 25px;
  box-shadow: 0 0 30px rgba(255, 215, 0, 0.1);
  text-align: center;
}

/* 标题 */
.title {
  color: #ffd700;
  font-size: 22px;
  font-weight: 700;
  margin-bottom: 25px;
}

/* 输入框 */
.form-item {
  margin-bottom: 18px;
  text-align: left;
}

.form-item label {
  display: block;
  font-size: 13px;
  color: #c5b37a;
  margin-bottom: 6px;
}

.form-item input {
  width: 96%;
  padding: 10px;
  border-radius: 8px;
  border: 1px solid #555;
  background: #000;
  color: #fff;
  outline: none;
  font-size: 14px;
  transition: border-color 0.3s;
}

.form-item input:focus {
  border-color: #ffd700;
  box-shadow: 0 0 6px rgba(255, 215, 0, 0.4);
}

/* 登录按钮 */
.login-btn {
  width: 90%;
  padding: 10px;
  background: linear-gradient(90deg, #f6c244, #d6a520);
  border: none;
  border-radius: 10px;
  color: #000;
  font-weight: 700;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.25s;
}

.login-btn:hover {
  transform: scale(1.03);
  box-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
}

.login-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 错误提示 */
.error-msg {
  color: #ff6b6b;
  font-size: 13px;
  margin-top: 10px;
}
</style>
