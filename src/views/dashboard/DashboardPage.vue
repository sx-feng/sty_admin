<template>
  <div class="dashboard-page">
    <h2 class="page-title">仪表盘概览</h2>

    <!-- 系统概况统计卡片 -->
    <div class="summary-cards">
      <div class="card">
        <span class="label">👤 用户总数</span>
        <span class="value">{{ stats.userCount }}</span>
      </div>
      <div class="card">
        <span class="label">💰 理财总额</span>
        <span class="value">{{ stats.financeTotal.toLocaleString() }} USDT</span>
      </div>
      <div class="card">
        <span class="label">📥 待处理提现数</span>
        <span class="value">{{ stats.withdrawPending }}</span>
      </div>
    </div>

    <!-- 图表区域 -->
    <div class="charts">
      <div class="chart-box">
        <h3>📈 理财趋势</h3>
        <div ref="chartFinance" class="chart"></div>
      </div>

      <div class="chart-box">
        <h3>💸 提现统计</h3>
        <div ref="chartWithdraw" class="chart"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue"
import * as echarts from "echarts"
import { request } from "@/api/request"  

// 系统概况数据
const stats = ref({
  userCount: 0,
  financeTotal: 0,
  withdrawPending: 0
})

const chartFinance = ref(null)
const chartWithdraw = ref(null)

/** ======================
 * 加载后台数据
 * ====================== */
async function loadDashboardData() {
  try {
    const [userRes, financeRes, withdrawRes] = await Promise.all([
      request(0, "/api/admin/user/list"),
      request(0, "/api/admin/financial/list"),
      request(0, "/api/admin/withdrawal/list")
    ])

    console.log("userRes:", userRes)
    console.log("financeRes:", financeRes)
    console.log("withdrawRes:", withdrawRes)

    /** ✅ 用户统计 */
    const userList = Array.isArray(userRes.data)
      ? userRes.data
      : userRes.data?.records || userRes.data?.data || []
    stats.value.userCount = userList.length

    /** ✅ 理财统计 */
    const financeList = Array.isArray(financeRes.data)
      ? financeRes.data
      : financeRes.data?.records || financeRes.data?.data || []
    stats.value.financeTotal = financeList.reduce((sum, x) => sum + Number(x.amount || 0), 0)
    initFinanceChart(financeList)

    /** ✅ 提现统计 */
    const withdrawList = Array.isArray(withdrawRes.data)
      ? withdrawRes.data
      : withdrawRes.data?.records || withdrawRes.data?.data || []
   stats.value.withdrawPending = withdrawList.filter(
  (x) => x.status === 1 || x.status === "PROCESSING"
).length

    initWithdrawChart(withdrawList)
  } catch (e) {
    console.error("仪表盘数据加载失败:", e)
  }
}
/** ======================
 * 图表初始化
 * ====================== */
function initFinanceChart(list = []) {
  const chart = echarts.init(chartFinance.value)
  const xData = list.map((_, i) => `第${i + 1}笔`)
  const yData = list.map((x) => Number(x.amount || 0))

  chart.setOption({
    tooltip: { trigger: "axis" },
    xAxis: { type: "category", data: xData },
    yAxis: { type: "value" },
    series: [
      {
        data: yData,
        type: "line",
        smooth: true,
        areaStyle: { color: "rgba(255,215,0,0.2)" },
        lineStyle: { color: "#FFD700", width: 2 }
      }
    ]
  })
}

function initWithdrawChart(list = []) {
  const chart = echarts.init(chartWithdraw.value)
  const grouped = list.reduce((map, x) => {
    // 取日期前 10 位
    const date = (x.createTime || x.date || "").slice(0, 10)
    // 注意金额是负数（提现），要取绝对值
    map[date] = (map[date] || 0) + Math.abs(Number(x.amount || 0))
    return map
  }, {})

  const xData = Object.keys(grouped)
  const yData = Object.values(grouped)

  chart.setOption({
    tooltip: { trigger: "axis" },
    xAxis: { type: "category", data: xData },
    yAxis: { type: "value" },
    series: [
      {
        data: yData,
        type: "bar",
        barWidth: 20,
        itemStyle: { color: "#f6c244" }
      }
    ]
  })
}


onMounted(() => {
  loadDashboardData()
})
</script>

<style scoped>
.dashboard-page {
  padding: 30px;
  min-height: 100vh;
  background: #000;
  color: #ffd700;
  font-family: "Microsoft YaHei", sans-serif;
}

/* 页面标题 */
.page-title {
  font-size: 22px;
  font-weight: 700;
  text-align: center;
  margin-bottom: 30px;
}

/* 概况卡片 */
.summary-cards {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 16px;
  margin-bottom: 30px;
}

.card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 215, 0, 0.3);
  border-radius: 12px;
  padding: 16px 24px;
  text-align: center;
  width: 180px;
  box-shadow: 0 0 15px rgba(255, 215, 0, 0.1);
  transition: transform 0.2s;
}
.card:hover {
  transform: scale(1.05);
}
.label {
  display: block;
  font-size: 14px;
  color: #c5b37a;
  margin-bottom: 4px;
}
.value {
  font-size: 22px;
  font-weight: 700;
  color: #ffd700;
}

/* 图表区域 */
.charts {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-around;
  gap: 20px;
}
.chart-box {
  width: 480px;
  max-width: 95%;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 215, 0, 0.25);
  border-radius: 14px;
  padding: 16px;
  box-shadow: 0 0 15px rgba(255, 215, 0, 0.08);
}
.chart-box h3 {
  font-size: 16px;
  margin-bottom: 10px;
}
.chart {
  width: 100%;
  height: 300px;
}
</style>
