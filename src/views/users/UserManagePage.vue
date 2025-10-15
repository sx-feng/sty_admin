<template>
  <div class="user-manage-page">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2>👥 用户管理</h2>
      <el-button type="primary" @click="getUserList" :loading="loading">刷新</el-button>
    </div>

    <!-- 用户列表 -->
    <el-table
      :data="tableData"
      border
      style="width: 100%"
      v-loading="loading"
    >
      <el-table-column type="index" label="ID" />
      <el-table-column prop="userName" label="用户名" />
      <el-table-column prop="realName" label="真实姓名" />
      <el-table-column prop="bankName" label="银行名称" />
      <el-table-column prop="bankBranch" label="开户行" />
      <el-table-column prop="bankCard" label="银行卡号" />
      <el-table-column prop="balance" label="余额" />
      <el-table-column prop="creditScore" label="信用分" />

      <!-- 冻结状态 -->
      <el-table-column prop="isFrozen" label="冻结状态" width="120">
        <template #default="{ row }">
          <el-tag :type="row.isFrozen ? 'danger' : 'success'">
            {{ row.isFrozen ? '冻结' : '正常' }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column prop="createTime" label="注册时间" width="160" />
      <el-table-column prop="updateTime" label="更新时间" width="160" />

      <!-- 操作列 -->
      <el-table-column label="操作" width="320">
        <template #default="scope">
          <el-button size="small" @click="openEditDialog(scope.row)">编辑</el-button>
          <el-button size="small" type="success" @click="openRechargeDialog(scope.row)">充值</el-button>
          <el-button size="small" type="warning" @click="openReduceDialog(scope.row)">扣款</el-button>

          <el-button
            size="small"
            :type="scope.row.isFrozen ? 'primary' : 'danger'"
            @click="toggleFreeze(scope.row)"
          >
            {{ scope.row.isFrozen ? '解冻' : '冻结' }}
          </el-button>

          <el-button size="small" type="danger" @click="deleteUser(scope.row)">删除</el-button>
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

    <!-- 编辑用户弹窗 -->
    <el-dialog v-model="editDialogVisible" title="编辑用户信息" width="500px">
      <el-form :model="editForm" label-width="100px" label-position="left">
        <el-form-item label="用户名">
          <el-input v-model="editForm.userName" />
        </el-form-item>

        <el-form-item label="真实姓名">
          <el-input v-model="editForm.realName" />
        </el-form-item>

        <el-form-item label="银行名称">
          <el-input v-model="editForm.bankName" />
        </el-form-item>

        <el-form-item label="开户行">
          <el-input v-model="editForm.bankBranch" />
        </el-form-item>

        <el-form-item label="银行卡号">
          <el-input v-model="editForm.bankCard" />
        </el-form-item>

        <el-form-item label="余额">
          <el-input-number v-model="editForm.balance" :min="0" />
        </el-form-item>

        <el-form-item label="信用分">
          <el-input-number v-model="editForm.creditScore" :min="0" />
        </el-form-item>

        <el-form-item label="是否冻结">
          <el-switch
            v-model="editForm.isFrozen"
            active-text="冻结"
            inactive-text="正常"
          />
        </el-form-item>

        <el-form-item label="注册时间">
          <el-input v-model="editForm.createTime" disabled />
        </el-form-item>

        <el-form-item label="更新时间">
          <el-input v-model="editForm.updateTime" disabled />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveUserInfo">保存</el-button>
      </template>
    </el-dialog>

    <!-- 充值/扣款弹窗 -->
    <el-dialog v-model="amountDialogVisible" :title="dialogTitle" width="400px">
      <el-form :model="amountForm" label-width="80px">
        <el-form-item label="用户">
          <el-input v-model="amountForm.user" disabled />
        </el-form-item>
        <el-form-item label="金额">
          <el-input-number v-model="amountForm.amount" :min="1" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="amountDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitAmount">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { request } from '@/api/request'

// 数据
const loading = ref(false)
const tableData = ref([])
const total = ref(0)
const pageSize = 10
const currentPage = ref(1)

// 弹窗状态
const editDialogVisible = ref(false)
const amountDialogVisible = ref(false)
const dialogTitle = ref('')
const editForm = ref({})
const amountForm = ref({})

// ===== 获取用户列表 =====
async function getUserList() {
  loading.value = true
  const res = await request(0, '/api/admin/user/list', { page: currentPage.value, size: pageSize })
  loading.value = false
  if (!res.ok) return ElMessage.error(res.message || '加载失败')
  tableData.value = res.data?.records || res.data || []
  total.value = res.data?.total || 0
}

// ===== 编辑用户信息 =====
function openEditDialog(row) {
  editForm.value = {
    ...row,
    balance: Number(row.balance) || 0,
  }
  editDialogVisible.value = true
}


async function saveUserInfo() {
  const res = await request(1, '/api/admin/user/update', editForm.value)
  if (res.ok) {
    ElMessage.success('修改成功')
    editDialogVisible.value = false
    getUserList()
  } else {
    ElMessage.error(res.message || '修改失败')
  }
}

// ===== 冻结 / 解冻 =====
async function toggleFreeze(row) {
  const newState = !row.isFrozen
  const text = newState ? '冻结' : '解冻'

  const confirm = await ElMessageBox.confirm(
    `确定要${text}用户「${row.userName}」吗？`,
    '提示',
    { type: 'warning' }
  ).catch(() => false)

  if (!confirm) return

  const res = await request(1, '/api/admin/user/update', { ...row, isFrozen: newState })
  if (res.ok) {
    ElMessage.success(`${text}成功`)
    getUserList()
  } else {
    ElMessage.error(`${text}失败`)
  }
}

// ===== 充值 / 扣款 =====
function openRechargeDialog(row) {
  dialogTitle.value = '充值'
  amountForm.value = { user: row.userName, amount: 0, type: 'recharge' }
  amountDialogVisible.value = true
}

function openReduceDialog(row) {
  dialogTitle.value = '扣款'
  amountForm.value = { user: row.userName, amount: 0, type: 'reduce' }
  amountDialogVisible.value = true
}

async function submitAmount() {
  const api =
    amountForm.value.type === 'recharge'
      ? '/api/admin/user/recharge'
      : '/api/admin/user/reduceBalance'

  const payload = {
    user: amountForm.value.user,
    amount: amountForm.value.amount,
  }
  const res = await request(1, api, payload)
  if (res.ok) {
    ElMessage.success(`${dialogTitle.value}成功`)
    amountDialogVisible.value = false
    getUserList()
  } else {
    ElMessage.error(res.message || `${dialogTitle.value}失败`)
  }
}

// ===== 删除用户 =====
function deleteUser(row) {
  ElMessageBox.confirm(`确定删除用户 ${row.userName} 吗？`, '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(async () => {
    const res = await request(1, '/api/admin/user/delete', { user: row.userName })
    if (res.ok) {
      ElMessage.success('删除成功')
      getUserList()
    } else {
      ElMessage.error(res.message || '删除失败')
    }
  })
}

// ===== 分页切换 =====
function handlePageChange(page) {
  currentPage.value = page
  getUserList()
}

onMounted(() => {
  getUserList()
})
</script>

<style scoped>
.user-manage-page {
  padding: 20px;
}
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}
.pagination {
  margin-top: 20px;
  text-align: right;
}
</style>
