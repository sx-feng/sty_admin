<template>
  <div class="recharge-manage-page">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2>💰 充值申请管理</h2>
      <div class="actions">
        <el-input
          v-model="searchUser"
          placeholder="输入用户名搜索"
          size="small"
          clearable
          style="width: 200px"
        />
        <el-button type="primary" size="small" @click="getRechargeList">查询</el-button>
      </div>
    </div>

    <!-- 充值申请表格 -->
    <el-table :data="tableData" border v-loading="loading" style="width: 100%">
      <el-table-column type="index" label="#" width="50" />
      <el-table-column prop="userName" label="用户名" width="140" />
      <el-table-column prop="amount" label="充值金额" width="100" />
      <el-table-column prop="description" label="备注" min-width="180" />
      <el-table-column prop="fundType" label="类型" width="100">
        <template #default="{ row }">
          <el-tag type="info">
            {{ row.fundType === 'RECHARGE' ? '充值' : row.fundType }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'warning'">
            {{ row.status === 1 ? '成功' : '待审核' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="申请时间" width="180" />
      <el-table-column label="操作" width="200">
        <template #default="{ row }">
          <el-button size="small" type="success" @click="approveRecharge(row)">通过</el-button>
          <el-button size="small" type="danger" @click="rejectRecharge(row)">拒绝</el-button>
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
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { request } from '@/api/request'

const loading = ref(false)
const searchUser = ref('')
const tableData = ref([])
const total = ref(0)
const pageSize = 10
const currentPage = ref(1)

// ✅ 获取充值申请列表
async function getRechargeList() {
  loading.value = true
  try {
    const res = await request(0, '/api/user/fund/recharge/pending', {
      user: searchUser.value || '',
      page: currentPage.value,
      size: pageSize
    })
    console.log(res, '充值申请列表')
    if (res.ok) {
      tableData.value = res.data || []
      total.value = res.data?.length || 0
    } else {
      ElMessage.error(res.message || '加载失败')
    }
  } catch (err) {
    console.error('请求出错:', err)
    ElMessage.error('请求异常')
  } finally {
    loading.value = false
  }
}

// ✅ 审核通过
async function approveRecharge(row) {
  ElMessageBox.confirm(`确定通过用户【${row.userName}】的充值申请？`, '审核确认', {
    confirmButtonText: '通过',
    cancelButtonText: '取消',
    type: 'success'
  }).then(async () => {
    const res = await request(1, '/api/user/fund/recharge/approve', { flowId: row.id },true)
        console.log(res, '充值申请列表')
   
    if (res.ok) {
      ElMessage.success('已通过充值申请')
      getRechargeList()
    } else {
      ElMessage.error(res.message || '操作失败')
    }
  })
}

// ✅ 拒绝申请
async function rejectRecharge(row) {
  ElMessageBox.confirm(`确定拒绝用户【${row.userName}】的充值申请？`, '警告', {
    confirmButtonText: '拒绝',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    const res = await request(1, '/api/user/fund/recharge/refuse', { flowId: row.id },true)
    if (res.ok) {
      ElMessage.success('已拒绝充值申请')
      getRechargeList()
    } else {
      ElMessage.error(res.message || '操作失败')
    }
  })
}

// ✅ 分页切换
function handlePageChange(page) {
  currentPage.value = page
  getRechargeList()
}

onMounted(() => {
  getRechargeList()
})
</script>

<style scoped>
.recharge-manage-page {
  padding: 20px;
}
.page-header {
    position: sticky;  
  top: -30px;             /* 距离顶部0 */
  z-index: 10;        /* 保证不被表格覆盖 */
  background: var(--bg-panel);
  border-bottom: 1px solid var(--border);  
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}
.actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
.pagination {
  margin-top: 15px;
  text-align: right;
}
</style>


