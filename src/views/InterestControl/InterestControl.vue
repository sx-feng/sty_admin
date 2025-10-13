<template>
  <div class="interest-control">
    <el-card>
        <div class="search-bar">
  <el-input
    v-model="searchName"
    placeholder="请输入利率名称进行搜索"
    clearable
    @clear="loadData"
    style="width: 300px; margin-right: 12px"
  />
  <el-button type="primary" @click="handleSearch">🔍 查询</el-button>
</div>

      <div class="toolbar">
        <el-button type="primary" @click="openForm()">➕ 新增利率</el-button>
      </div>

      <el-table :data="dataList" style="width: 100%" border>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="interestRateName" label="利率名称" />
        <el-table-column prop="interestRateValue" label="利率值 (%)" />
        <el-table-column prop="isOpen" label="是否启用">
          <template #default="{ row }">
            <el-tag :type="row.isOpen ? 'success' : 'info'">
              {{ row.isOpen ? '启用' : '关闭' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180">
          <template #default="{ row }">
            <el-button size="small" type="primary" @click="openForm(row)">编辑</el-button>
            <el-button size="small" type="danger" @click="handleDelete(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 弹窗表单 -->
      <el-dialog v-model="visible" :title="form.id ? '编辑利率' : '新增利率'">
        <el-form :model="form" label-width="100px">
          <el-form-item label="利率名称">
            <el-input v-model="form.interestRateName" />
          </el-form-item>
          <el-form-item label="利率值 (%)">
            <el-input v-model="form.interestRateValue" />
          </el-form-item>
          <el-form-item label="是否启用">
            <el-switch v-model="form.isOpen" />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="visible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit">提交</el-button>
        </template>
      </el-dialog>
    </el-card>
  </div>
</template>

<script setup>

import {  ElMessageBox } from 'element-plus'
import { ref, onMounted } from 'vue'
import {request} from '@/api/request'
const dataList = ref([])
const visible = ref(false)
const form = ref({})


const openForm = (row = null) => {
  form.value = row ? { ...row } : { interestRateName: '', interestRateValue: '', isOpen: false }
  visible.value = true
}

const handleSubmit = async () => {
  const api = form.value.id
    ? '/api/admin/InterestRateConfig/update'
    : '/api/admin/InterestRateConfig/add'
  const res = await request(1,api, form.value) // POST
  console.log(res,"update")
  if (res?.code === 200) {
    visible.value = false
    await loadData()
  }
}

const handleDelete = async (id) => {
  const ok = await ElMessageBox.confirm('确定要删除这条利率配置吗？', '提示', { type: 'warning' })
  if (ok) {
    // const res = await fetch(`/api/admin/InterestRateConfig/delete/${id}`, { method: 'DELETE' })
     const res = await request(1,`/api/admin/InterestRateConfig/delete/${id}`, form.value) // POST
    console.log(res,"detele")
    // const json = await res.json()
    // if (json?.code === 200) {
      await loadData()
    // }
  }
}
const searchName = ref('')

// 查询按钮逻辑
const handleSearch = async () => {
  const res = await request(0, '/api/admin/InterestRateConfig/page', {
    interestRateName: searchName.value
  }, true) // 第四个参数 true 表示拼接为 query 参数
  if (res.code === 200) {
    dataList.value = res.data.records || res.data || [] // 兼容分页 or list
  }
}
const loadData = async () => {
  const res = await request(0, '/api/admin/InterestRateConfig/page', {}, true)
  if (res.code === 200) {
    dataList.value = res.data.records || res.data || []
  }
}


onMounted(loadData)
</script>

<style scoped>
.interest-control {
  padding: 20px;
}
.toolbar {
  margin-bottom: 16px;
  display: flex;
  justify-content: flex-end;
}
.search-bar {
  margin-bottom: 16px;
  display: flex;
  justify-content: flex-start;
  align-items: center;
}

</style>
