<template>
  <div class="financial-manage-page">
    <!-- 标题栏 -->
    <div class="page-header">
      <h2>💰 理财记录管理</h2>
      <div class="actions">
        <el-input
          v-model="searchUser"
          placeholder="输入用户名搜索"
          size="small"
          clearable
          @keyup.enter="getFinancialList"
          style="width: 200px"
        />
        <el-button type="primary" size="small" @click="getFinancialList" :loading="loading">搜索</el-button>
        <el-button size="small" @click="resetSearch">重置</el-button>
      </div>
    </div>

    <!-- 理财记录表格 -->
    <el-table
      :data="tableData"
      border
      style="width: 100%"
      v-loading="loading"
    >
      <el-table-column type="index" label="ID"  />
      <el-table-column prop="userName" label="用户名" />
      <el-table-column prop="amount" label="投资金额 (USDT)" />
      <el-table-column prop="profit" label="收益 (USDT)" />
      <el-table-column prop="interestRate" label="收益率 (%)" />
      <el-table-column prop="status" label="状态">
        <template #default="{ row }">
          <el-tag :type="row.status === 0 ? 'success' : 'error'">
            {{ row.status === 0 ? '进行中' : '已结束' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="开始时间" />
      <el-table-column prop="updateTime" label="更新时间" />
      <el-table-column label="操作" width="260">
        <template #default="{ row }">
          <el-button size="small" @click="openEditDialog(row)">编辑</el-button>
          <el-button size="small" type="danger" @click="deleteRecord(row)">删除</el-button>
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

    <!-- 编辑弹窗 -->
  <!-- 编辑弹窗 -->
<el-dialog v-model="editDialogVisible" title="编辑理财记录" width="500px">
  <el-form :model="editForm" label-width="100px" label-position="left">
    <el-form-item label="用户名">
      <el-input v-model="editForm.userName" placeholder="请输入用户名" />
    </el-form-item>

    <el-form-item label="投资金额 (USDT)">
      <el-input-number
        v-model="editForm.amount"
        :min="0"
        :step="0.01"
        controls-position="right"
        style="width: 100%"
      />
    </el-form-item>

    <el-form-item label="收益 (USDT)">
      <el-input-number
        v-model="editForm.profit"
        :min="0"
        :step="0.01"
        controls-position="right"
        style="width: 100%"
      />
    </el-form-item>

    <el-form-item label="收益率 (%)">
      <el-input-number
        v-model="editForm.interestRate"
        :min="0"
        :max="100"
        :step="0.1"
        controls-position="right"
        style="width: 100%"
      />
    </el-form-item>

    <el-form-item label="状态">
      <el-select v-model="editForm.status" placeholder="选择状态" style="width: 100%">
        <el-option label="进行中" :value="0" />
        <el-option label="已结束" :value="1" />
      </el-select>
    </el-form-item>

    <el-form-item label="开始时间">
      <el-date-picker
        v-model="editForm.createTime"
        type="datetime"
        placeholder="选择开始时间"
        style="width: 100%"
      />
    </el-form-item>

    <el-form-item label="更新时间">
      <el-date-picker
        v-model="editForm.updateTime"
        type="datetime"
        placeholder="选择更新时间"
        style="width: 100%"
      />
    </el-form-item>
  </el-form>

  <template #footer>
    <el-button @click="editDialogVisible = false">取消</el-button>
    <el-button type="primary" @click="saveFinancialInfo">保存</el-button>
  </template>
</el-dialog>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { request } from '@/api/request'

const loading = ref(false)
const tableData = ref([])
const total = ref(0)
const pageSize = 10
const currentPage = ref(1)
const searchUser = ref('')

const editDialogVisible = ref(false)
const editForm = ref({})

// === 获取理财记录 ===
async function getFinancialList() {
  loading.value = true
  let res
  if (searchUser.value) {
    res = await request(0, '/api/admin/financial/user', { user: searchUser.value })
  } else {
    res = await request(0, '/api/admin/financial/list', { page: currentPage.value, size: pageSize })
  }
  loading.value = false
  if (!res.ok) return ElMessage.error(res.message || '加载失败')
  tableData.value = res.data || []
  total.value = res.data.total || 0
  console.log("financial",res.data)
}

// === 重置搜索 ===
function resetSearch() {
  searchUser.value = ''
  currentPage.value = 1  // ✅ 回到第一页
  getFinancialList()
}
// === 编辑 ===
function openEditDialog(row) {
  editForm.value = { ...row }
  editDialogVisible.value = true
}

async function saveFinancialInfo() {
  const payload = { ...editForm.value }
  if (payload.createTime instanceof Date)
    payload.createTime = payload.createTime.toISOString().slice(0, 19).replace('T', ' ')
  if (payload.updateTime instanceof Date)
    payload.updateTime = payload.updateTime.toISOString().slice(0, 19).replace('T', ' ')
  
  const res = await request(1, '/api/admin/financial/update', payload)
  if (res.ok) {
    ElMessage.success('修改成功')
    editDialogVisible.value = false
    getFinancialList()
  } else {
    ElMessage.error(res.message || '修改失败')
  }
}

// === 删除 ===
function deleteRecord(row) {
  ElMessageBox.confirm(`确定删除【${row.user}】的理财记录吗？`, '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(async () => {
    const res = await request(1, '/api/admin/financial/delete', { id: row.id })
    if (res.ok) {
      ElMessage.success('删除成功')
      getFinancialList()
    } else {
      ElMessage.error(res.message || '删除失败')
    }
  })
}


// === 分页 ===
function handlePageChange(page) {
  currentPage.value = page
  getFinancialList()
}

onMounted(() => {
  getFinancialList()
})
</script>

<style scoped>
.financial-manage-page {
  padding: 20px;
}
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  position: sticky;   /* ⭐ 关键点 */
  top: -20px;             /* 距离顶部0 */
  z-index: 10;        /* 保证不被表格覆盖 */
  background: #111;   /* 背景颜色与主题一致 */
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
.page-header{ background: var(--bg-panel) !important; border-bottom: 1px solid var(--border); }
</style>


