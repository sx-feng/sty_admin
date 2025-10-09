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
      <el-table-column type="index" label="#" width="50" />
      <el-table-column prop="user" label="用户名" />
      <el-table-column prop="amount" label="投资金额 (USDT)" />
      <el-table-column prop="profit" label="收益 (USDT)" />
      <el-table-column prop="rate" label="收益率 (%)" />
      <el-table-column prop="cycleDays" label="周期 (天)" />
      <el-table-column prop="status" label="状态">
        <template #default="{ row }">
          <el-tag :type="row.status === 'active' ? 'success' : 'info'">
            {{ row.status === 'active' ? '进行中' : '已结束' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="startTime" label="开始时间" />
      <el-table-column prop="endTime" label="结束时间" />
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
    <el-dialog v-model="editDialogVisible" title="编辑理财记录" width="450px">
      <el-form :model="editForm" label-width="90px">
        <el-form-item label="用户名">
          <el-input v-model="editForm.user" disabled />
        </el-form-item>
        <el-form-item label="收益率 (%)">
          <el-input-number v-model="editForm.rate" :min="0" :max="100" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="editForm.status" placeholder="选择状态">
            <el-option label="进行中" value="active" />
            <el-option label="已结束" value="finished" />
          </el-select>
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
  tableData.value = res.data?.records || []
  total.value = res.data?.total || 0
}

// === 重置搜索 ===
function resetSearch() {
  searchUser.value = ''
  getFinancialList()
}

// === 编辑 ===
function openEditDialog(row) {
  editForm.value = { ...row }
  editDialogVisible.value = true
}

async function saveFinancialInfo() {
  const res = await request(1, '/api/admin/financial/update', editForm.value)
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
