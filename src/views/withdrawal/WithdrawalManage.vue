<template>
  <div class="withdrawal-manage-page">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2>💸 提现管理</h2>
      <div class="actions">
        <el-input
          v-model="searchUser"
          placeholder="搜索用户名"
          size="small"
          clearable
          @keyup.enter="getWithdrawalList"
          style="width: 200px"
        />
        <el-button type="primary" size="small" @click="getWithdrawalList" :loading="loading">
          查询
        </el-button>
        <el-button size="small" @click="resetSearch">重置</el-button>
      </div>
    </div>

    <!-- 提现列表 -->
    <el-table :data="tableData" border style="width: 100%" v-loading="loading">
      <el-table-column type="index" label="ID" width="50" />
      <el-table-column prop="userName" label="用户名" />
      <el-table-column prop="amount" label="提现金额 (USDT)" />
      <el-table-column prop="status" label="状态">
        <template #default="{ row }">
          <el-tag :type="getStatusTagType(row.status)">
            {{ getStatusText(row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="申请时间" />
      <el-table-column label="操作" width="260">
        <template #default="{ row }">
          <el-button
            size="small"
            type="success"
            :disabled="row.status !== 1"
            @click="approveWithdrawal(row)"
          >
            通过
          </el-button>
          <el-button
            size="small"
            type="danger"
            :disabled="row.status !== 1"
            @click="rejectWithdrawal(row)"
          >
            拒绝
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pagination">
      <el-pagination
        background
        layout="prev, pager, next"
        :total="total"
        :page-size="pageSize"
        @current-change="handlePageChange"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { request } from '@/api/request'

const tableData = ref([])
const total = ref(0)
const pageSize = 10
const currentPage = ref(1)
const loading = ref(false)
const searchUser = ref('')
let ws = null // WebSocket 对象

// === 获取提现列表 ===
async function getWithdrawalList() {
  loading.value = true
  let res
  if (searchUser.value) {
    res = await request(0, '/api/admin/withdrawal/user', { user: searchUser.value })
  } else {
    res = await request(0, '/api/admin/withdrawal/list', {
      page: currentPage.value,
      size: pageSize
    })
  }
  loading.value = false
  if (!res.ok) return ElMessage.error(res.message || '加载失败')
  
  tableData.value = res.data || []
  total.value = res.data.total|| 0
  console.log(res.data,"withdraw")
}

// === 审核通过 ===
function approveWithdrawal(row) {
  ElMessageBox.confirm(`确定通过【${row.userName}】的提现申请吗？`, '确认审核', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'success'
  }).then(async () => {
    const res = await request(1, '/api/admin/withdrawal/updateById', {
      id: row.id,
      status: 0
    })
    if (res.ok) {
      ElMessage.success('审核通过')
      getWithdrawalList()
    } else {
      ElMessage.error(res.message || '操作失败')
    }
  })
}

// === 审核拒绝 ===
function rejectWithdrawal(row) {
  ElMessageBox.confirm(`确定拒绝【${row.userName}】的提现申请吗？`, '确认拒绝', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    const res = await request(1, '/api/admin/withdrawal/updateById', {
      id: row.id,
      status: 2
    })
    if (res.ok) {
      ElMessage.success('已拒绝')
      getWithdrawalList()
    } else {
      ElMessage.error(res.message || '操作失败')
    }
  })
}

// === 分页切换 ===
function handlePageChange(page) {
  currentPage.value = page
  getWithdrawalList()
}

// script
function getStatusTagType(status) {
  switch (status) {
    case 0: return 'warning';
    case 1: return 'success';
    case -1: return 'danger';
    default: return 'info'; // 默认兜底
  }
}

function getStatusText(status) {
  switch (status) {
    case 0: return '已通过';
    case 1: return '待处理';
    case 2: return '失败/提现拒绝';
    default: return '未知';
  }
}


// === WebSocket 实时推送 ===
function initWebSocket() {
  try {
    ws = new WebSocket('ws://192.168.110.101:8065/ws/admin/notify')
    ws.onopen = () => console.log('✅ WebSocket 已连接')
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data)
        if (msg.event === 'USER_WITHDRAWAL') {
          ElMessage.info('收到提现申请通知，刷新列表')
          getWithdrawalList()
        }
      } catch (err) {
        console.warn('WebSocket 消息解析失败', err)
      }
    }
    ws.onclose = () => console.log('🔌 WebSocket 已断开')
    ws.onerror = (err) => console.error('WebSocket 错误:', err)
  } catch (e) {
    console.error('WebSocket 初始化失败:', e)
  }
}

function closeWebSocket() {
  if (ws) {
    ws.close()
    ws = null
  }
}
function resetSearch() {
  searchUser.value = ''
  currentPage.value = 1
  getWithdrawalList()
}


// === 初始化 ===
onMounted(() => {
  getWithdrawalList()
  initWebSocket()
})

onBeforeUnmount(() => {
  closeWebSocket()
})
</script>

<style scoped>
.withdrawal-manage-page {
  padding: 20px;
}

.page-header {
  position: sticky;   /* ⭐ 关键点 */
  top: -20px;             /* 距离顶部0 */
  z-index: 10;        /* 保证不被表格覆盖 */
  background: #111;   /* 背景颜色与主题一致 */
  padding-bottom: 10px;
  border-bottom: 1px solid #333;
}

.actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.pagination {
  margin-top: 20px;
  text-align: right;
}
</style>
