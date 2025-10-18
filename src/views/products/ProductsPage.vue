<template>
  <div class="product-manage-page">
    <!-- 页面标题与操作 -->
    <div class="page-header">
      <h2>🛒 用户理财产品管理</h2>
      <div class="actions">
        <el-select v-model="filterType" placeholder="筛选状态" @change="getProductList" size="small">
          <el-option label="全部产品" value="all" />
          <el-option label="未到期产品" value="0" />
          <el-option label="已到期产品" value="1" />
        </el-select>
        <el-button type="primary" size="small" @click="getProductList" :loading="loading">刷新</el-button>
      </div>
    </div>

    <!-- 产品列表 -->
    <el-table :data="tableData" border style="width: 100%" v-loading="loading">
      <el-table-column type="index" label="#" width="60" />
      <el-table-column prop="incomeStatus" label="收益状态" width="120">
        <template #default="{ row }">
          <el-tag :type="(row.incomeStatus === 1 || row.incomeStatus === '1' || row.incomeStatus === '盈利') ? 'success' : 'info'">
            {{
              row.incomeStatus === 'PROFIT'
                ? '盈利'
                : (row.incomeStatus === 'LOSS'
                    ? '亏损'
                    : (row.incomeStatus ?? '—'))
            }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="userName" label="用户名" />
      <el-table-column prop="productName" label="产品名称" />
      <el-table-column prop="amount" label="金额 (USDT)" />
      <el-table-column prop="interestRate" label="利率 (%)" />
      <el-table-column prop="cycleType" label="周期类型 (s/m/h)" />
      <el-table-column prop="cycleValue" label="周期值" />
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="row.status === 0 ? 'success' : 'danger'">
            {{ row.status === 0 ? '进行中' : '已到期' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="endTime" label="到期时间" />
      <el-table-column label="操作" width="200">
        <template #default="{ row }">
          <el-button size="small" @click="openEditDialog(row)">编辑</el-button>
          <el-button size="small" type="danger" @click="deleteProduct(row)">删除</el-button>
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
    <el-dialog v-model="editDialogVisible" title="编辑产品信息" width="450px">
      <el-form :model="editForm" label-width="90px">
        <el-form-item label="用户名">
          <el-input v-model="editForm.userName" disabled />
        </el-form-item>
        <el-form-item label="产品名称">
          <el-input v-model="editForm.productName" disabled />
        </el-form-item>
        <el-form-item label="利率 (%)">
          <el-input-number v-model="editForm.interestRate" :min="0" :max="100" />
        </el-form-item>
        <el-form-item label="周期类型">
          <el-input v-model="editForm.cycleType" placeholder="s/m/h" />
        </el-form-item>
        <el-form-item label="周期值">
          <el-input-number v-model="editForm.cycleValue" :min="1" />
        </el-form-item>
        <el-form-item label="收益状态">
  <el-select v-model="editForm.incomeStatus" placeholder="选择收益状态">
    <el-option label="亏损" value="LOSS" />
    <el-option label="盈利" value="PROFIT" />
  </el-select>
</el-form-item>
        <el-form-item label="状态">
          <el-select v-model="editForm.status" placeholder="选择状态">
            <el-option label="进行中" :value="0" />
            <el-option label="已到期" :value="1" />
          </el-select>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveProductInfo">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { request } from '@/api/request'

// 数据与状态
const tableData = ref([])
const pageSize = 10
const currentPage = ref(1)
const loading = ref(false)
const filterType = ref('all') // 默认显示全部产品
const total = ref(0)



// 编辑弹窗
const editDialogVisible = ref(false)
const editForm = ref({})

// ===== 获取产品列表 =====
async function getProductList() {
  loading.value = true
  let url = ''

  // 根据筛选类型选择接口
  if (filterType.value === 'all') {
    url = '/api/admin/product/find/all'
  } else {
    url = `/api/admin/product/find/status/${filterType.value}`
  }

  const res = await request(0, url, { page: currentPage.value, size: pageSize })
  loading.value = false

  if (!res.ok) return ElMessage.error(res.message || '加载失败')

  // 如果后端分页格式为 {records, total}
  tableData.value = res.data?.records || res.data || []
  // eslint-disable-next-line no-undef
  total.value = res.data?.total || 0
}

// ===== 编辑产品 =====
function openEditDialog(row) {
  editForm.value = { ...row }
  editDialogVisible.value = true
}

async function saveProductInfo() {
  const res = await request(1, '/api/admin/product/update', editForm.value)
  if (res.ok) {
    ElMessage.success('修改成功')
    editDialogVisible.value = false
    getProductList()
  } else {
    ElMessage.error(res.message || '修改失败')
  }
}

// ===== 删除产品 =====
function deleteProduct(row) {
  ElMessageBox.confirm(`确定删除产品【${row.productName}】吗？`, '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    const res = await request(1, '/api/admin/product/delete', { id: row.id },true)
    if (res.ok) {
      ElMessage.success('删除成功')
      getProductList()
    } else {
      ElMessage.error(res.message || '删除失败')
    }
  })
}

// ===== 分页 =====
function handlePageChange(page) {
  currentPage.value = page
  getProductList()
}

onMounted(() => {
  getProductList()
})
</script>

<style scoped>
.product-manage-page {
  padding: 20px;
}
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  position: sticky; 
  top: -20px;             /* 距离顶部0 */
  z-index: 10;        /* 保证不被表格覆盖 */
  background: var(--bg-panel);
    border-bottom: 1px solid var(--border);   
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


