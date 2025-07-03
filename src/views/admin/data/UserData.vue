<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useTransition } from '@vueuse/core'
import { getUsers, getUserActivity } from "@/api/user";
import { getAllComments } from "@/api/homepage";
import { ChatLineRound } from '@element-plus/icons-vue'
import * as echarts from 'echarts'

const users = ref([])
const userActivity = ref([])
const allUsers = ref(0)
const activeUsers = ref(0)
const newUsers = ref(0)
const outputValue = useTransition(activeUsers, { duration: 1500 })
const feedBacks = ref(0)
const chartRef1 = ref<HTMLDivElement | null>(null) // 新注册用户趋势图
const chartRef2 = ref<HTMLDivElement | null>(null) // 活跃用户趋势图
const chartRef3 = ref<HTMLDivElement | null>(null) // 用户消费分布饼图
const chartRef4 = ref<HTMLDivElement | null>(null) // 用户活跃度雷达图

// 格式化日期为 YYYY-MM-DD
const formatDate = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 获取过去 7 天的日期数组（包括今天）
const getLast7Days = () => {
  const dates = []
  const today = new Date()
  for (let i = 6; i >= 0; i--) {
    const pastDate = new Date(today)
    pastDate.setDate(today.getDate() - i)
    dates.push(formatDate(pastDate))
  }
  return dates
}

// 统计过去 7 天的新注册用户数
const countRecentRegistrations = () => {
  const last7Days = getLast7Days()
  const registrationCounts = last7Days.map(date => ({
    date,
    count: users.value.filter(user => user.registrationTime.startsWith(date)).length
  }))
  return {
    dates: registrationCounts.map(item => item.date),
    counts: registrationCounts.map(item => item.count)
  }
}

// 统计过去 7 天的活跃用户数
const countRecentActiveUsers = () => {
  const last7Days = getLast7Days()
  const activeCounts = last7Days.map(date => ({
    date,
    count: users.value.filter(user => user.lastLoginTime.startsWith(date)).length
  }))
  return {
    dates: activeCounts.map(item => item.date),
    counts: activeCounts.map(item => item.count)
  }
}

// 统计用户消费金额分布（饼图数据）
const countUserSpendingDistribution = () => {
  const distribution = {
    '0元': 0,
    '1-100元': 0,
    '100-500元': 0,
    '500元以上': 0
  }

  userActivity.value.forEach(activity => {
    const spent = activity.totalSpent || 0
    if (spent === 0) {
      distribution['0元']++
    } else if (spent <= 100) {
      distribution['1-100元']++
    } else if (spent <= 500) {
      distribution['100-500元']++
    } else {
      distribution['500元以上']++
    }
  })

  return {
    labels: Object.keys(distribution),
    data: Object.values(distribution)
  }
}

// 统计用户活跃度雷达图数据
const countUserActivityRadar = () => {
  const indicators = [
    { name: '登录次数', max: 40 },
    { name: '购票次数', max: 10 },
    { name: '消费金额', max: 500 }
  ]

  // 计算平均值作为雷达图数据
  const avgLogin = userActivity.value.reduce((sum, act) => sum + (act.loginCount || 0), 0) / userActivity.value.length
  const avgPurchase = userActivity.value.reduce((sum, act) => sum + (act.purchaseCount || 0), 0) / userActivity.value.length
  const avgSpent = userActivity.value.reduce((sum, act) => sum + (act.totalSpent || 0), 0) / userActivity.value.length

  return {
    indicators,
    values: [avgLogin, avgPurchase, avgSpent]
  }
}

// 初始化 ECharts 图表（支持渐变折线图）
const initChart = (chartRef: HTMLDivElement | null, title: string, countsData: number[]) => {
  if (!chartRef) return

  const existingChart = echarts.getInstanceByDom(chartRef)
  if (existingChart) existingChart.dispose()

  const myChart = echarts.init(chartRef)
  const last7Days = getLast7Days()

  const option = {
    title: { text: title, left: 'center' },
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: last7Days,
      axisLabel: { rotate: 45 }
    },
    yAxis: { type: 'value' },
    series: [{
      name: '用户数',
      type: 'line',
      data: countsData,
      smooth: true,
      symbol: 'circle', // 显示数据点
      symbolSize: 8,
      itemStyle: {
        color: '#409EFF', // 折线颜色
        borderColor: '#fff', // 数据点边框颜色
        borderWidth: 2
      },
      lineStyle: {
        width: 3,
        shadowColor: 'rgba(64, 158, 255, 0.3)',
        shadowBlur: 10,
        shadowOffsetY: 10
      },
      // 渐变区域填充
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(64, 158, 255, 0.5)' }, // 顶部颜色（浅蓝）
          { offset: 1, color: 'rgba(64, 158, 255, 0.1)' }  // 底部颜色（透明）
        ])
      },
      // 高亮样式
      emphasis: {
        itemStyle: {
          color: '#FF6B3B', // 高亮时数据点颜色
          borderColor: '#fff',
          borderWidth: 2
        },
        lineStyle: {
          width: 4,
          shadowColor: 'rgba(255, 107, 59, 0.3)',
          shadowBlur: 10,
          shadowOffsetY: 10
        }
      }
    }],
    grid: {
      bottom: '15%',
      left: '3%',
      right: '4%',
      containLabel: true
    }
  }

  myChart.setOption(option)

  const resizeHandler = () => myChart.resize()
  window.addEventListener('resize', resizeHandler)

  return () => {
    window.removeEventListener('resize', resizeHandler)
    myChart.dispose()
  }
}

// 初始化饼图
const initPieChart = (chartRef: HTMLDivElement | null, title: string, labels: string[], data: number[]) => {
  if (!chartRef) return

  const existingChart = echarts.getInstanceByDom(chartRef)
  if (existingChart) existingChart.dispose()

  const myChart = echarts.init(chartRef)
  const option = {
    title: { text: title, left: 'center' },
    tooltip: { trigger: 'item' },
    legend: { orient: 'vertical', left: 'left' },
    series: [
      {
        name: '用户分布',
        type: 'pie',
        radius: ['40%', '70%'], // 环形饼图
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: { show: false, formatter: '{b}: {c} ({d}%)' },
        emphasis: {
          label: { show: true, fontSize: '18', fontWeight: 'bold' }
        },
        labelLine: { show: false },
        data: labels.map((label, index) => ({
          value: data[index],
          name: label,
          itemStyle: {
            color: [
              '#5470C6', '#91CC75', '#FAC858', '#EE6666' // 自定义颜色
            ][index]
          }
        }))
      }
    ]
  }

  myChart.setOption(option)
  const resizeHandler = () => myChart.resize()
  window.addEventListener('resize', resizeHandler)

  return () => {
    window.removeEventListener('resize', resizeHandler)
    myChart.dispose()
  }
}

// 初始化雷达图
const initRadarChart = (chartRef: HTMLDivElement | null, title: string, indicators: any[], values: number[]) => {
  if (!chartRef) return

  const existingChart = echarts.getInstanceByDom(chartRef)
  if (existingChart) existingChart.dispose()

  const myChart = echarts.init(chartRef)
  const option = {
    title: {
      text: title,
      left: 'center',
      textStyle: {
        color: '#333',
        fontSize: 16,
        fontWeight: 'bold'
      }
    },
    tooltip: {
      trigger: 'item',
      formatter: params => {
        let result = params.name + '<br/>'
        params.value.forEach((val, index) => {
          result += `${indicators[index].name}: ${val}<br/>`
        })
        return result
      }
    },
    legend: {
      data: ['平均活跃度'],
      bottom: 10
    },
    radar: {
      indicator: indicators.map(item => ({
        name: item.name, // 直接使用字符串，而不是对象
        max: item.max
      })),
      shape: 'circle',
      radius: '70%',
      splitNumber: 5,
      axisName: {
        color: '#333',
        fontSize: 12,
        formatter: function (value: string) { // 确保名称正确显示
          return value
        }
      },
      splitLine: {
        lineStyle: {
          color: 'rgba(0, 0, 0, 0.1)',
          width: 1
        }
      },
      splitArea: {
        show: true,
        areaStyle: {
          color: ['rgba(64, 158, 255, 0.05)', 'rgba(64, 158, 255, 0.1)'],
          shadowColor: 'rgba(0, 0, 0, 0.1)',
          shadowBlur: 10
        }
      },
      axisLine: {
        lineStyle: {
          color: 'rgba(0, 0, 0, 0.1)'
        }
      }
    },
    series: [
      {
        name: '用户活跃度',
        type: 'radar',
        symbolSize: 0, // 设置为0不显示数据点符号
        lineStyle: {
          width: 3,
          color: '#409EFF'
        },
        itemStyle: {
          color: '#409EFF',
          borderColor: '#fff',
          borderWidth: 2
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(64, 158, 255, 0.6)' },
            { offset: 1, color: 'rgba(64, 158, 255, 0.1)' }
          ]),
          shadowColor: 'rgba(64, 158, 255, 0.3)',
          shadowBlur: 10,
          shadowOffsetY: 5
        },
        data: [
          {
            value: values,
            name: '平均活跃度',
            label: {
              show: false // 不显示标签
            }
          }
        ]
      }
    ]
  }

  myChart.setOption(option)
  const resizeHandler = () => myChart.resize()
  window.addEventListener('resize', resizeHandler)

  return () => {
    window.removeEventListener('resize', resizeHandler)
    myChart.dispose()
  }
}

// 获取用户数据和用户活跃度数据
const initUsers = () => {
  getUsers().then(res => {
    users.value = res.data
    allUsers.value = users.value.length
    newUsers.value = users.value.filter(user =>
        user.registrationTime.startsWith(formatDate(new Date()))
    ).length
    activeUsers.value = users.value.filter(user =>
        user.lastLoginTime.startsWith(formatDate(new Date()))
    ).length

    getUserActivity().then(res => {
      userActivity.value = res.data

      // 初始化图表
      const { counts: newUsersCounts } = countRecentRegistrations()
      const { counts: activeUsersCounts } = countRecentActiveUsers()
      initChart(chartRef1.value, '近一周新注册用户趋势', newUsersCounts)
      initChart(chartRef2.value, '近一周活跃用户趋势', activeUsersCounts)

      const { labels, data } = countUserSpendingDistribution()
      const { indicators, values } = countUserActivityRadar()
      initPieChart(chartRef3.value, '用户消费金额分布', labels, data)
      initRadarChart(chartRef4.value, '用户平均活跃度分析', indicators, values)
    })

    const params = {
      pageNo: 1,
      pageSize: 5,
      category: undefined,
      status: undefined
    };
    getAllComments(params).then(res => {
      feedBacks.value = res.data?.total
    })
  })
}

// 监听数据变化
watch([chartRef1, chartRef2, chartRef3, chartRef4, users, userActivity], () => {
  if (users.value.length > 0 && userActivity.value.length > 0) {
    const { counts: newUsersCounts } = countRecentRegistrations()
    const { counts: activeUsersCounts } = countRecentActiveUsers()
    if (chartRef1.value) initChart(chartRef1.value, '近一周新注册用户趋势', newUsersCounts)
    if (chartRef2.value) initChart(chartRef2.value, '近一周活跃用户趋势', activeUsersCounts)

    const { labels, data } = countUserSpendingDistribution()
    const { indicators, values } = countUserActivityRadar()
    if (chartRef3.value) initPieChart(chartRef3.value, '用户消费金额分布', labels, data)
    if (chartRef4.value) initRadarChart(chartRef4.value, '用户平均活跃度分析', indicators, values)
  }
}, { immediate: true })

onMounted(() => {
  initUsers()
})
</script>

<template>
  <div>
    <div class="header">
      <el-card style="margin-bottom: 10px">
        <el-row gutter="950">
          <el-col span="18"><div><span>用户数据</span></div></el-col>
        </el-row>
      </el-card>
    </div>

    <el-card style="margin-bottom: 10px">
      <el-row>
        <el-col :span="6">
          <el-statistic title="Total users" :value="allUsers" class="bold-statistic"/>
        </el-col>
        <el-col :span="6">
          <el-statistic :value="newUsers" class="bold-statistic">
            <template #title>
              <el-badge value="new" class="item">
                <div style="display: inline-flex; align-items: center">
                  Today's new users
                </div>
              </el-badge>
            </template>
          </el-statistic>
        </el-col>
        <el-col :span="6">
          <el-statistic title="Daily active users" :value="outputValue" :transition="true" class="bold-statistic"/>
        </el-col>
        <el-col :span="6">
          <el-statistic title="Feedback number" :value="feedBacks" class="bold-statistic">
            <template #suffix>
              <el-icon style="vertical-align: -0.125em">
                <ChatLineRound />
              </el-icon>
            </template>
          </el-statistic>
        </el-col>
      </el-row>
    </el-card>

    <!-- 两个图表横向排列 -->
    <el-row :gutter="20" style="margin-bottom: 10px">
      <el-col :span="12">
        <el-card>
          <div ref="chartRef1" style="width: 100%; height: 400px;"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <div ref="chartRef2" style="width: 100%; height: 400px;"></div>
        </el-card>
      </el-col>
    </el-row>
<!--    另两个图表也横向排列-->
    <el-row :gutter="20">
      <el-col :span="12">
        <el-card>
          <div ref="chartRef3" style="width: 100%; height: 400px;"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <div ref="chartRef4" style="width: 100%; height: 400px;"></div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped lang="scss">
.header {
  width: 100%;
}

.el-col {
  text-align: center;
}

.bold-statistic {
  :deep(.el-statistic__head),
  :deep(.el-statistic__content) {
    font-weight: bold;
  }
}
</style>