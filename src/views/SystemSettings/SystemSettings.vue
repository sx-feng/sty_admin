<template>
  <div class="system-settings-page">
    <h2>⚙️ 系统设置</h2>

    <!-- Tabs 结构 -->
    <el-tabs v-model="activeTab" type="border-card" class="settings-tabs">
<!-- 生成邀请码 -->
<el-tab-pane label="生成邀请码" name="invite">
  <el-card shadow="hover" class="card-box">
    <template #header>
      <span>🎟️ 生成邀请码</span>
    </template>

    <el-form label-width="140px">
      <el-form-item>
        <el-button type="primary" @click="generateInvite" :loading="loadingInvite">生成邀请码</el-button>
        <el-button @click="loadInviteList">刷新列表</el-button>
      </el-form-item>

      <el-form-item label="邀请码列表">
        <div class="invite-list">
          <div
            v-for="item in inviteList"
            :key="item.id"
            class="invite-item"
            @click="copyInvite(item.code)"
          >
            {{ item.code }}
            <span class="status" :class="'status-' + item.status">
              {{ statusText(item.status) }}
            </span>
          </div>
        </div>
      </el-form-item>
    </el-form>
  </el-card>
</el-tab-pane>


      <!-- 金融配置 -->
      <el-tab-pane label="金融配置" name="financial">
        <el-card shadow="hover" class="card-box">
          <template #header>
            <span>💰 金融配置</span>
          </template>

          <el-form label-width="160px">
            <el-form-item label="系统年化利率(%)">
              <el-input-number v-model="form" :step="1" />
            </el-form-item>
            <!-- <el-form-item label="手续费率(%)">
              <el-input-number v-model="form.fee_rate" :step="0.1" />
            </el-form-item>
            <el-form-item label="最低提现额度">
              <el-input-number v-model="form.withdraw_min" :step="1" />
            </el-form-item> -->

            <el-form-item>
              <el-button type="primary" @click="saveFinancial" :loading="savingFinancial">保存配置</el-button>
              <el-button @click="loadFinancial">刷新</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-tab-pane>

      <!-- 公告配置 -->
      <el-tab-pane label="公告配置" name="announcement">
        <el-card shadow="hover" class="card-box">
          <template #header>
            <span>📢 公告配置</span>
          </template>

          <el-form label-width="140px">
            <el-form-item label="公告内容">
              <el-input
                type="textarea"
                v-model="announcement"
                :rows="5"
                placeholder="请输入平台公告内容"
              />
            </el-form-item>

            <el-form-item>
              <el-button type="primary" @click="saveAnnouncement" :loading="savingAnnouncement">保存公告</el-button>
              <el-button @click="loadAnnouncement">刷新</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  getFinancialRate,
  updateFinancialRate,
  getAnnouncement,
  updateAnnouncement,
  getInvitationCode,
  getAllInvitationCodes
} from '@/api/sysconfig'

// 当前标签页
const activeTab = ref('invite')

// --- 生成邀请码 ---

const inviteList = ref([])
const loadingInvite = ref(false)

// 状态文字映射
const statusText = (s) => {
  if (s === 0) return '未使用'
  if (s === 1) return '已使用'
  if (s === 2) return '已过期'
  return '未知'
}

// 复制邀请码
function copyInvite(code) {
  navigator.clipboard.writeText(code).then(() => {
    ElMessage.success(`邀请码 ${code} 已复制！`)
  })
}

// 生成邀请码
async function generateInvite() {
  loadingInvite.value = true
  try {
    const res = await getInvitationCode()
    if (res.ok && res.data) {
      ElMessage.success(`生成成功：${res.data}`)
      await loadInviteList() // 重新刷新列表
    } else {
      ElMessage.error(res.message || '生成失败')
    }
  } catch (e) {
    ElMessage.error('网络异常')
  } finally {
    loadingInvite.value = false
  }
}

// 加载所有邀请码
async function loadInviteList() {
  try {
    const res = await getAllInvitationCodes()
    if (res.ok && Array.isArray(res.data)) {
      inviteList.value = res.data
    } else {
      ElMessage.error(res.message || '加载邀请码失败')
    }
  } catch (e) {
    ElMessage.error('网络异常')
  }
}



// --- 金融配置 ---
const form = ref(0)
const savingFinancial = ref(false)

async function loadFinancial() {
  try {
    const res = await getFinancialRate()
    if (res.code === 200) {
      let source = res.data
      if (source && typeof source === 'object') {
        source = source.rate ?? source.value ?? source.data ?? 0
      }
      const raw = parseFloat(source ?? 0)
      form.value = Number.isFinite(raw) ? raw * 100 : 0
      ElMessage.success('加载金融成功')
    }
  } catch {
    ElMessage.error('加载金融配置失败')
  }
}

async function saveFinancial() {
  savingFinancial.value = true
  try {
    const current = Number(form.value)
    const payload = Number.isFinite(current) ? current / 100 : 0
    const res = await updateFinancialRate(payload)
    if (res.code === 200) {
      ElMessage.success('金融配置已更新')
      setTimeout(() => {
        loadFinancial()  // 自动刷新最新利率
      }, 800)
    }
  } catch {
    ElMessage.error('更新失败')
  } finally {
    savingFinancial.value = false
  }
}

// --- 公告配置 ---
const announcement = ref('')
const savingAnnouncement = ref(false)

async function loadAnnouncement() {
  try {
    const res = await getAnnouncement()
    if (res.code === 200) {
      announcement.value = res.data.announcement || ''
ElMessage.success('公告已刷新')
    }
  } catch {
    ElMessage.error('加载公告失败')
  }
}

async function saveAnnouncement() {
  savingAnnouncement.value = true
  try {
    const res = await updateAnnouncement(announcement.value)
    if (res.code === 200) 
    ElMessage.success('公告已更新')
  } catch {
    ElMessage.error('更新失败')
  } finally {
    savingAnnouncement.value = false
  }
}

onMounted(() => {
  loadFinancial()
  loadAnnouncement()
 saveFinancial() 
 loadInviteList()
})
</script>

<style scoped>
.system-settings-page {
  max-width: 900px;
  margin: 40px auto;
  background: var(--bg-panel);
  border-radius: 14px;
  padding: 30px;
  color: var(--text-1);
  border: 1px solid var(--border);
  box-shadow: var(--glow);
}

h2 {
  text-align: center;
  color: var(--brand);
  font-weight: 600;
  margin-bottom: 30px;
  letter-spacing: 1px;
}

.settings-tabs {
  background: transparent;
}

.card-box {
  background: var(--bg-panel-2);
  border: 1px solid var(--border);
  border-radius: 12px;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.5);
  margin-bottom: 25px;
}

.el-card__header {
  background: linear-gradient(to right, rgba(255, 215, 0, 0.15), transparent);
  color: var(--brand);
  font-weight: 600;
  letter-spacing: 1px;
  font-size: 15px;
}

.el-input__wrapper {
  background: var(--bg-panel) !important;
  border: 1px solid var(--border) !important;
  color: var(--text-1) !important;
}

.el-input-number__decrease,
.el-input-number__increase {
  background: var(--bg-panel) !important;
  color: var(--text-2) !important;
}

.el-input__inner,
textarea {
  color: var(--text-1) !important;
  background: var(--bg-panel) !important;
}

.el-button--primary {
  background: linear-gradient(90deg, var(--brand), var(--brand-2));
  border: none;
  color: #222;
  font-weight: 600;
}

.el-button--primary:hover {
  background: linear-gradient(90deg, var(--brand), var(--brand-2));
}

.invite-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.invite-item {
  background: var(--brand-weak);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 6px 12px;
  font-weight: 600;
  color: var(--brand);
  cursor: pointer;
  user-select: none;
  transition: all 0.2s;
}

.invite-item:hover {
  background: var(--brand-weak);
  transform: scale(1.05);
  box-shadow: 0 0 8px rgba(255, 215, 0, 0.5);
}

.invite-item.used {
  opacity: 0.5;
  text-decoration: line-through;
}
</style>
